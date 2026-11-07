"""Every URL rule has matching and non-matching tests (SRS FR-074)."""

import pytest

from app.detection.rules.base import evaluate
from app.detection.rules.url_rules import URL_RULES
from shared.url_parsing import parse_url

RULES = {r.rule_id: r for r in URL_RULES}


def matches(rule_id: str, url: str) -> bool:
    return bool(evaluate((RULES[rule_id],), parse_url(url)))


def explanation(rule_id: str, url: str) -> str:
    return evaluate((RULES[rule_id],), parse_url(url))[0].explanation


# ---------- BR-001 IP address host ----------

@pytest.mark.parametrize("url", [
    "http://192.168.1.1/login",
    "http://3232235777/",
    "http://0xC0A80101/",
    "http://[2001:db8::1]/",
])
def test_br001_matches_ip_hosts(url):
    assert matches("BR-001", url)


@pytest.mark.parametrize("url", ["https://example.com", "https://192-168-1-1.example.com"])
def test_br001_ignores_domain_names(url):
    assert not matches("BR-001", url)


def test_br001_mentions_unusual_format():
    assert "unusual numeric format" in explanation("BR-001", "http://3232235777/")


# ---------- BR-002 punycode / IDN ----------

@pytest.mark.parametrize("url", ["https://xn--pypal-4ve.com", "https://pаypal.com"])
def test_br002_matches_punycode_and_unicode(url):
    assert matches("BR-002", url)


@pytest.mark.parametrize("url", ["https://paypal.com", "https://example.com/xn--path"])
def test_br002_ignores_plain_ascii_hosts(url):
    assert not matches("BR-002", url)


# ---------- BR-005 user-info marker ----------

@pytest.mark.parametrize("url", [
    "https://paypal.com@evil.example.com/",
    "https://user:pass@example.com",
])
def test_br005_matches_userinfo(url):
    assert matches("BR-005", url)


@pytest.mark.parametrize("url", [
    "https://example.com/contact?email=a@b.com",   # '@' only in the query
    "https://example.com/@username",               # '@' only in the path
])
def test_br005_ignores_at_sign_outside_authority(url):
    assert not matches("BR-005", url)


# ---------- BR-007 URL shortener ----------

@pytest.mark.parametrize("url", ["https://bit.ly/3xYz", "tinyurl.com/abc", "https://t.co/x"])
def test_br007_matches_shorteners(url):
    assert matches("BR-007", url)


@pytest.mark.parametrize("url", ["https://example.com", "https://notbit.ly.example.com"])
def test_br007_ignores_other_domains(url):
    assert not matches("BR-007", url)


def test_br007_explanation_defangs_the_service_name():
    assert "bit[.]ly" in explanation("BR-007", "https://bit.ly/x")


# ---------- BR-009 suspicious terms ----------

@pytest.mark.parametrize("url", [
    "https://example.com/login",
    "https://secure-verify.example.com",
    "https://example.com/page?action=update",
])
def test_br009_matches_suspicious_terms(url):
    assert matches("BR-009", url)


@pytest.mark.parametrize("url", ["https://example.com/about", "https://news.example.org/today"])
def test_br009_ignores_ordinary_urls(url):
    assert not matches("BR-009", url)


def test_br009_shows_at_most_three_terms():
    text = explanation("BR-009", "https://example.com/login/verify/account/update/password")
    assert text.count('"') == 6


def test_br009_is_case_insensitive():
    assert matches("BR-009", "https://example.com/LOGIN")


# ---------- Catalogue ----------

def test_rule_ids_are_unique_and_documented():
    ids = [r.rule_id for r in URL_RULES]
    assert len(ids) == len(set(ids))
    for r in URL_RULES:
        assert r.title and r.template and r.strength in ("weak", "moderate", "strong")


def test_rules_are_fast_on_maximum_length_input():
    """No catastrophic slowdowns on long adversarial input (SRS SEC-071)."""
    import time
    url = "https://example.com/" + "a@." * 676  # about 2,048 characters
    start = time.perf_counter()
    evaluate(URL_RULES, parse_url(url))
    assert time.perf_counter() - start < 0.5
