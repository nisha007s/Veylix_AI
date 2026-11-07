import pytest
from pydantic import ValidationError

from tests.conftest import make_settings


def test_defaults_match_prd_limits():
    s = make_settings()
    assert s.max_url_length == 2048
    assert s.max_email_length == 50_000
    assert s.max_embedded_urls == 20
    assert s.max_scan_body_bytes == 131_072


def test_reads_veylix_prefixed_environment_variables(monkeypatch):
    monkeypatch.setenv("VEYLIX_MAX_URL_LENGTH", "100")
    assert make_settings().max_url_length == 100


def test_ignores_unprefixed_variables(monkeypatch):
    monkeypatch.setenv("MAX_URL_LENGTH", "100")
    assert make_settings().max_url_length == 2048


@pytest.mark.parametrize(
    "field, value",
    [
        ("max_url_length", 2049),
        ("max_url_length", 0),
        ("max_email_length", 50_001),
        ("max_embedded_urls", 21),
        ("max_scan_body_bytes", 131_073),
    ],
)
def test_limits_cannot_exceed_prd_values(field, value):
    with pytest.raises(ValidationError):
        make_settings(**{field: value})


def test_cors_origins_parsed_from_comma_list():
    s = make_settings(cors_allowed_origins="http://a.test, http://b.test")
    assert s.cors_origins == ["http://a.test", "http://b.test"]
