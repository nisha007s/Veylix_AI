"""URL rule catalogue (SRS §8.1). Strengths and lists approved for version 0.1.0 (OD-03).

Matches are rule-based indicators, not proof of phishing.

Every released change to rules, strengths, lists or the rules-only table must
increment RULE_VERSION (SRS FR-072).
"""

from app.core.safety import defang
from app.detection.rules.base import Rule
from shared.url_lists import SUSPICIOUS_URL_TERMS, URL_SHORTENERS
from shared.url_parsing import ParsedUrl

RULE_VERSION = "0.1.0"

MAX_TERMS_SHOWN = 3


def _ip_host(p: ParsedUrl) -> dict[str, str] | None:
    if not p.is_ip_host:
        return None
    if p.ip_format == "ipv4_alternate":
        return {"form": "an IP address written in an unusual numeric format"}
    return {"form": "an IP address"}


def _punycode(p: ParsedUrl) -> dict[str, str] | None:
    has_punycode = any(label.startswith("xn--") for label in p.host.split("."))
    has_non_ascii = not p.host.isascii()
    return {} if has_punycode or has_non_ascii else None


def _userinfo(p: ParsedUrl) -> dict[str, str] | None:
    return {} if p.has_userinfo else None


def _shortener(p: ParsedUrl) -> dict[str, str] | None:
    if p.registered_domain in URL_SHORTENERS:
        return {"service": defang(p.registered_domain)}
    return None


def _suspicious_terms(p: ParsedUrl) -> dict[str, str] | None:
    text = f"{p.host}{p.path}?{p.query}".lower()
    found = [term for term in SUSPICIOUS_URL_TERMS if term in text]
    if not found:
        return None
    shown = ", ".join(f'"{t}"' for t in found[:MAX_TERMS_SHOWN])
    return {"terms": shown}


URL_RULES: tuple[Rule, ...] = (
    Rule(
        "BR-001", "IP address instead of a domain name", "strong",
        "The link uses {form} instead of a domain name. Legitimate services rarely do this.",
        _ip_host,
    ),
    Rule(
        "BR-002", "Internationalized (punycode) domain", "moderate",
        "The domain name contains internationalized characters (punycode). These can imitate "
        "a trusted domain using look-alike letters.",
        _punycode,
    ),
    Rule(
        "BR-005", "Hidden destination using '@'", "strong",
        "The link contains an '@' before the domain. Browsers ignore everything before the '@', "
        "which can disguise the real destination.",
        _userinfo,
    ),
    Rule(
        "BR-007", "URL shortener", "weak",
        "The link uses the URL shortener {service}. Its final destination is unknown because "
        "Veylix does not open links.",
        _shortener,
    ),
    Rule(
        "BR-009", "Suspicious words", "weak",
        "The link contains words often used in phishing: {terms}.",
        _suspicious_terms,
    ),
)
