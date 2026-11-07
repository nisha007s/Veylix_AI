"""POST /api/v1/scans/email against API spec v0.1 §3.2."""

import logging
import time

import pytest

from tests.network_guard import no_network  # noqa: F401 (fixture)
from tests.test_scan_url_api import EXPECTED_FIELDS

EMAIL = "/api/v1/scans/email"


def scan(client, text):
    r = client.post(EMAIL, json={"text": text})
    assert r.status_code == 200, r.text
    return r.json()


def validation_error(r, reason):
    assert r.status_code == 422
    error = r.json()["error"]
    assert error["code"] == "validation_error"
    assert error["fields"] == [{"field": "text", "reason": reason}]
    return error


# ---------- Response shape ----------

def test_response_has_spec_fields(client):
    body = scan(client, "Hi team, the report is attached. Thanks.")
    assert set(body) == EXPECTED_FIELDS | {"embedded_urls", "language"}
    assert body["input_type"] == "email"
    assert body["display_value"] == "Pasted email (content not stored)"
    assert body["language"] == {"status": "not_checked"}
    assert body["analysis_mode"] == "rules_only"
    assert body["saved"] is False and "not_saved" in body["notices"]
    assert body["embedded_urls"] == {"found": 0, "analysed": 0, "not_analysed": 0,
                                     "failed": 0, "findings": []}
    assert any("SPF" in line for line in body["limitations"])
    assert any("English" in line for line in body["limitations"])


def test_ordinary_email_is_low(client):
    body = scan(client, "Hi team, the report is attached. See you tomorrow.")
    assert body["category"] == "low"
    assert body["rule_evidence"] == []


def test_legitimate_security_notice_with_negation_is_low(client):
    body = scan(client, "Reminder from the support team: we will never ask you to share your OTP.")
    assert body["category"] == "low"


# ---------- Categories ----------

def test_high_risk_link_makes_email_high(client):
    body = scan(client, "Your account will be suspended. Log in at http://192.168.1.1/login now.")
    assert body["category"] == "high"
    ids = [e["rule_id"] for e in body["rule_evidence"]]
    assert "BR-024" in ids and "BR-020" in ids
    finding = body["embedded_urls"]["findings"][0]
    assert finding == {"display_value": "hxxp://192[.]168[.]1[.]1/login", "category": "high",
                       "rule_ids": ["BR-001", "BR-009"]}


def test_two_moderate_indicators_make_email_high(client):
    body = scan(client, "Please confirm your password and send a copy of your Aadhaar.")
    assert body["category"] == "high"
    assert {e["rule_id"] for e in body["rule_evidence"]} == {"BR-021", "BR-025"}


def test_one_moderate_indicator_is_medium(client):
    body = scan(client, "Kindly share your bank details for the refund.")
    assert body["category"] == "medium"


# ---------- Embedded links ----------

def test_25_links_analyses_20_and_reports_5(client):
    text = " ".join(f"https://site{i}.example.com/page" for i in range(25))
    links = scan(client, text)["embedded_urls"]
    assert (links["found"], links["analysed"], links["not_analysed"]) == (25, 20, 5)
    assert len(links["findings"]) == 20


def test_duplicate_links_count_once(client):
    links = scan(client, "https://a.example.com " * 30)["embedded_urls"]
    assert (links["found"], links["analysed"], links["not_analysed"]) == (1, 1, 0)


def test_unparseable_link_is_counted_as_failed_and_scan_completes(client):
    body = scan(client, "Go to http://example.com:99999/x or https://example.org")
    links = body["embedded_urls"]
    assert (links["found"], links["analysed"], links["failed"]) == (2, 1, 1)


def test_hidden_html_link_destination_is_analysed(client):
    html = '<p>Sign in at <a href="http://192.168.1.1/login">https://www.mybank.com</a></p>'
    body = scan(client, html)
    assert "html_converted" in body["normalizations"]
    displays = [f["display_value"] for f in body["embedded_urls"]["findings"]]
    assert "hxxp://192[.]168[.]1[.]1/login" in displays
    assert body["category"] == "high"


# ---------- Privacy and safe handling ----------

def test_raw_email_text_is_never_returned_or_logged(client, caplog):
    marker = "UNIQUE-MARKER-7f3a9c"
    caplog.set_level(logging.DEBUG)
    r = client.post(EMAIL, json={"text": f"Urgent! {marker} confirm your password now."})
    assert r.status_code == 200
    assert marker not in r.text
    assert marker.lower() not in r.text
    assert all(marker not in rec.getMessage() for rec in caplog.records)


def test_pasted_script_is_never_returned(client):
    html = "<html><body><script>alert('XSS-PROBE')</script><p>Hello</p></body></html>"
    r = client.post(EMAIL, json={"text": html})
    assert r.status_code == 200
    assert "XSS-PROBE" not in r.text and "<script" not in r.text


def test_email_response_is_not_cached(client):
    r = client.post(EMAIL, json={"text": "Hello"})
    assert r.headers["Cache-Control"] == "no-store"


def test_email_scan_makes_no_network_requests(no_network, client):
    scan(client, "Verify at https://bit.ly/x and http://192.168.1.1/login")


def test_maximum_length_email_is_fast(client):
    text = ("Urgent: confirm your password at https://example.com/login today. " * 800)[:50_000]
    start = time.perf_counter()
    scan(client, text)
    assert time.perf_counter() - start < 2.0


# ---------- Validation (never Inconclusive) ----------

def test_email_over_50000_characters_is_rejected_with_limit_message(client):
    error = validation_error(client.post(EMAIL, json={"text": "a" * 50_001}), "too_long")
    assert "50,000" in error["message"]


def test_email_of_exactly_50000_characters_is_accepted(client):
    assert client.post(EMAIL, json={"text": "a" * 50_000}).status_code == 200


@pytest.mark.parametrize("value", ["", "   ", "\n\n\t"])
def test_empty_email_is_rejected(client, value):
    validation_error(client.post(EMAIL, json={"text": value}), "empty")


def test_missing_text_is_required(client):
    validation_error(client.post(EMAIL, json={}), "required")


@pytest.mark.parametrize("value", [42, None, ["hello"]])
def test_non_string_text_is_invalid(client, value):
    validation_error(client.post(EMAIL, json={"text": value}), "invalid_value")
