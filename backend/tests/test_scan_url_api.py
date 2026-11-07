"""POST /api/v1/scans/url against API spec v0.1 §3.1."""

import pytest

from tests.network_guard import no_network  # noqa: F401 (fixture)

URL = "/api/v1/scans/url"

EXPECTED_FIELDS = {
    "scan_id", "saved", "input_type", "display_value", "category", "category_label",
    "category_meaning", "suggested_action", "analysis_mode", "rule_evidence",
    "model_contributions", "limitations", "normalizations", "notices", "versions",
    "analysed_at",
}


def validation_error(r, reason: str) -> dict:
    assert r.status_code == 422
    error = r.json()["error"]
    assert error["code"] == "validation_error"
    assert error["request_id"] == r.headers["X-Request-ID"]
    assert error["fields"] == [{"field": "url", "reason": reason}]
    return error


# ---------- Successful scans ----------

def test_valid_url_returns_structured_rules_only_result(client):
    r = client.post(URL, json={"url": "https://example.com/about"})
    assert r.status_code == 200
    body = r.json()
    assert set(body) == EXPECTED_FIELDS
    assert body["input_type"] == "url"
    assert body["analysis_mode"] == "rules_only"
    assert body["versions"] == {"rule_version": "0.1.0", "model_version": None}
    assert body["model_contributions"] == []
    assert body["limitations"]
    assert body["analysed_at"].endswith("Z")


def test_guest_scan_is_not_saved(client):
    body = client.post(URL, json={"url": "https://example.com"}).json()
    assert body["saved"] is False and body["scan_id"] is None
    assert "not_saved" in body["notices"]


def test_clean_url_is_low_with_no_guarantee_wording(client):
    body = client.post(URL, json={"url": "https://example.com/about"}).json()
    assert body["category"] == "low"
    assert body["rule_evidence"] == []
    assert "not a guarantee" in body["suggested_action"]


def test_ip_host_is_high_with_evidence(client):
    body = client.post(URL, json={"url": "http://192.168.1.1/login"}).json()
    assert body["category"] == "high"
    assert body["category_label"] == "High"
    ids = [e["rule_id"] for e in body["rule_evidence"]]
    assert ids == ["BR-001", "BR-009"]


def test_shortener_alone_is_inconclusive_with_notice(client):
    body = client.post(URL, json={"url": "https://bit.ly/3xYz"}).json()
    assert body["category"] == "inconclusive"
    assert "shortener_destination_unknown" in body["notices"]


def test_display_value_is_defanged_without_query_userinfo_or_fragment(client):
    url = "https://alice:pw@secure-login.example.com/verify?token=SECRET123#top"
    r = client.post(URL, json={"url": url})
    body = r.json()
    assert body["display_value"] == "hxxps://secure-login[.]example[.]com/verify"
    assert "query_string_hidden" in body["notices"]
    assert "userinfo_hidden" in body["notices"]
    # Nothing secret or clickable is echoed back anywhere in the response.
    for leaked in ("SECRET123", "alice", "pw@", "https://", "example.com"):
        assert leaked not in r.text


def test_normalizations_are_reported(client):
    body = client.post(URL, json={"url": "hxxps://example[.]com"}).json()
    assert body["normalizations"] == ["defang_reversed"]
    body = client.post(URL, json={"url": "example.com"}).json()
    assert body["normalizations"] == ["scheme_added"]


def test_no_raw_score_or_percentage_is_shown(client):
    r = client.post(URL, json={"url": "http://192.168.1.1/login"})
    assert "%" not in r.text
    assert "score" not in r.text and "probability" not in r.text


def test_scan_response_is_not_cached(client):
    r = client.post(URL, json={"url": "https://example.com"})
    assert r.headers["Cache-Control"] == "no-store"


def test_unknown_fields_are_ignored(client):
    r = client.post(URL, json={"url": "https://example.com", "category": "low", "saved": True})
    assert r.status_code == 200
    assert r.json()["saved"] is False


def test_same_input_gives_same_result(client):
    a = client.post(URL, json={"url": "http://0xC0A80101/verify"}).json()
    b = client.post(URL, json={"url": "http://0xC0A80101/verify"}).json()
    a.pop("analysed_at"), b.pop("analysed_at")
    assert a == b


def test_scan_endpoint_makes_no_network_requests(no_network, client):
    assert client.post(URL, json={"url": "https://bit.ly/abc"}).status_code == 200


# ---------- Validation (never Inconclusive) ----------

def test_url_of_2049_characters_is_rejected_with_limit_message(client):
    url = "https://example.com/" + "a" * (2049 - len("https://example.com/"))
    error = validation_error(client.post(URL, json={"url": url}), "too_long")
    assert "2,048" in error["message"]


def test_url_of_exactly_2048_characters_is_accepted(client):
    url = "https://example.com/" + "a" * (2048 - len("https://example.com/"))
    assert client.post(URL, json={"url": url}).status_code == 200


@pytest.mark.parametrize("value", ["", "   ", "\n\t"])
def test_empty_url_is_rejected(client, value):
    validation_error(client.post(URL, json={"url": value}), "empty")


@pytest.mark.parametrize("value", ["javascript:alert(1)", "ftp://example.com", "http://exa mple.com"])
def test_unparseable_url_is_rejected(client, value):
    r = client.post(URL, json={"url": value})
    validation_error(r, "unparseable")
    assert "inconclusive" not in r.text


def test_missing_url_field_is_required(client):
    validation_error(client.post(URL, json={}), "required")


@pytest.mark.parametrize("value", [123, None, ["https://example.com"]])
def test_non_string_url_is_invalid(client, value):
    validation_error(client.post(URL, json={"url": value}), "invalid_value")


def test_get_is_not_allowed(client):
    """Scan input must never travel in a query string (SRS API-006)."""
    assert client.get(URL, params={"url": "https://example.com"}).status_code == 405
