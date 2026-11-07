import re

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel, Field

from app.core.errors import ApiError
from app.main import create_app
from tests.conftest import make_settings

REQUEST_ID = re.compile(r"^[0-9a-f]{32}$")


def assert_error(response, status: int, code: str) -> dict:
    """Check the structured error format from API spec v0.1 section 2."""
    assert response.status_code == status
    error = response.json()["error"]
    assert error["code"] == code
    assert error["message"]
    assert error["request_id"] == response.headers["X-Request-ID"]
    return error


class _Probe(BaseModel):
    text: str = Field(max_length=10)


@pytest.fixture
def probe_client() -> TestClient:
    """App with test-only routes for exercising error handling."""
    app: FastAPI = create_app(make_settings(max_scan_body_bytes=2048))

    @app.post("/api/v1/_probe")
    def probe(body: _Probe) -> dict:
        return {"ok": True}

    @app.get("/api/v1/_crash")
    def crash() -> None:
        raise RuntimeError("secret-internal-detail")

    @app.get("/api/v1/_conflict")
    def conflict() -> None:
        raise ApiError(409, "conflict", "Already pending.")

    return TestClient(app, raise_server_exceptions=False)


# ---------- Health and request IDs ----------

def test_health_ok(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_every_response_has_server_generated_request_id(client):
    r1 = client.get("/api/v1/health", headers={"X-Request-ID": "injected\nvalue"})
    r2 = client.get("/api/v1/health")
    assert REQUEST_ID.match(r1.headers["X-Request-ID"])
    assert r1.headers["X-Request-ID"] != "injected\nvalue"
    assert r1.headers["X-Request-ID"] != r2.headers["X-Request-ID"]


# ---------- Error format ----------

def test_unknown_route_returns_structured_404(client):
    assert_error(client.get("/api/v1/does-not-exist"), 404, "not_found")


def test_wrong_method_returns_structured_405(client):
    assert_error(client.delete("/api/v1/health"), 405, "method_not_allowed")


def test_api_error_uses_structured_format(probe_client):
    assert_error(probe_client.get("/api/v1/_conflict"), 409, "conflict")


def test_validation_error_lists_field_and_reason_without_echoing_input(probe_client):
    secret = "SECRET-INPUT-123456789"
    r = probe_client.post("/api/v1/_probe", json={"text": secret})
    error = assert_error(r, 422, "validation_error")
    assert error["fields"] == [{"field": "text", "reason": "too_long"}]
    assert secret not in r.text


def test_missing_field_reason_is_required(probe_client):
    error = assert_error(probe_client.post("/api/v1/_probe", json={}), 422, "validation_error")
    assert error["fields"] == [{"field": "text", "reason": "required"}]


def test_invalid_json_is_validation_error(probe_client):
    r = probe_client.post(
        "/api/v1/_probe", content=b"{not json", headers={"Content-Type": "application/json"}
    )
    assert_error(r, 422, "validation_error")


def test_unexpected_error_returns_generic_500_without_internals(probe_client):
    r = probe_client.get("/api/v1/_crash")
    assert_error(r, 500, "internal_error")
    assert "secret-internal-detail" not in r.text
    assert "Traceback" not in r.text


# ---------- Body size limit (413) ----------

def test_body_over_limit_by_content_length_returns_413(probe_client):
    r = probe_client.post("/api/v1/_probe", content=b"x" * 3000,
                          headers={"Content-Type": "application/json"})
    assert_error(r, 413, "payload_too_large")


def test_body_over_limit_without_content_length_returns_413(probe_client):
    def chunks():
        for _ in range(4):
            yield b"x" * 1000

    r = probe_client.post("/api/v1/_probe", content=chunks(),
                          headers={"Content-Type": "application/json"})
    assert_error(r, 413, "payload_too_large")


def test_body_under_limit_is_accepted(probe_client):
    assert probe_client.post("/api/v1/_probe", json={"text": "short"}).status_code == 200


# ---------- Docs only outside production ----------

def test_docs_available_in_development(client):
    assert client.get("/api/v1/docs").status_code == 200


def test_docs_disabled_in_production():
    prod = TestClient(create_app(make_settings(app_env="production")))
    assert prod.get("/api/v1/docs").status_code == 404
    assert prod.get("/api/v1/openapi.json").status_code == 404
