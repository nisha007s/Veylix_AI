"""Email rule catalogue (SRS §8.2), approved for email rule version 0.1.0 (OD-03).

Matches are rule-based indicators, not proof of phishing. Explanations quote
only phrases from our own lists, never passages from the email (SRS DR-032).
BR-026 (grammar) is intentionally not used in v0.1.
"""

from dataclasses import dataclass

from app.detection.rules.base import Rule
from shared.email_lists import (
    ACTION_PHRASES,
    CREDENTIAL_PHRASES,
    ORGANISATION_CLAIMS,
    PAYMENT_PHRASES,
    SENSITIVE_INFO_PHRASES,
    URGENCY_PHRASES,
)
from shared.email_preprocessing import find_phrases

EMAIL_RULE_VERSION = "0.1.0"

MAX_PHRASES_SHOWN = 3


@dataclass(frozen=True)
class EmailContext:
    text: str                      # normalized email text (in memory only)
    link_categories: list[str]     # categories of the analysed embedded links


def _quoted(phrases: list[str]) -> str:
    return ", ".join(f'"{p}"' for p in phrases[:MAX_PHRASES_SHOWN])


def _phrase_rule(phrases: tuple[str, ...]):
    def check(ctx: EmailContext) -> dict[str, str] | None:
        found = find_phrases(ctx.text, phrases, check_negation=True)
        return {"phrases": _quoted(found)} if found else None
    return check


def _impersonation(ctx: EmailContext) -> dict[str, str] | None:
    claims = find_phrases(ctx.text, ORGANISATION_CLAIMS)
    actions = find_phrases(ctx.text, ACTION_PHRASES, check_negation=True)
    if claims and actions:
        return {"claims": _quoted(claims), "actions": _quoted(actions)}
    return None


def _suspicious_links(ctx: EmailContext) -> dict[str, str] | None:
    high = ctx.link_categories.count("high")
    medium = ctx.link_categories.count("medium")
    if high:
        return {"strength": "strong", "count": str(high), "level": "High"}
    if medium:
        return {"strength": "moderate", "count": str(medium), "level": "Medium"}
    return None


EMAIL_RULES: tuple[Rule, ...] = (
    Rule(
        "BR-020", "Urgency or pressure", "weak",
        "The text uses pressure or urgency language ({phrases}).",
        _phrase_rule(URGENCY_PHRASES),
    ),
    Rule(
        "BR-021", "Request for login details or codes", "moderate",
        "The text asks for passwords, login details or one-time codes ({phrases}).",
        _phrase_rule(CREDENTIAL_PHRASES),
    ),
    Rule(
        "BR-022", "Request for money or payment details", "moderate",
        "The text asks for money or payment details ({phrases}).",
        _phrase_rule(PAYMENT_PHRASES),
    ),
    Rule(
        "BR-023", "Possible impersonation", "moderate",
        "The text presents itself as an organisation ({claims}) and asks you to act "
        "({actions}). Check the sender through an official channel.",
        _impersonation,
    ),
    Rule(
        "BR-024", "Suspicious links", "moderate",  # strength set per match: High link -> strong
        "{count} link(s) in the email scored {level} in URL analysis.",
        _suspicious_links,
    ),
    Rule(
        "BR-025", "Request for sensitive information", "moderate",
        "The text asks for personal or sensitive information ({phrases}).",
        _phrase_rule(SENSITIVE_INFO_PHRASES),
    ),
)
