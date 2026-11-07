"""Every email rule has matching, non-matching and negation tests (SRS FR-074)."""

import pytest

from app.detection.aggregation.rules_only import categorize
from app.detection.rules.base import RuleMatch, evaluate
from app.detection.rules.email_rules import EMAIL_RULES, EmailContext
from shared.email_preprocessing import normalize_text

RULES = {r.rule_id: r for r in EMAIL_RULES}


def run(rule_id: str, text: str, links: list[str] | None = None) -> list[RuleMatch]:
    ctx = EmailContext(text=normalize_text(text), link_categories=links or [])
    return evaluate((RULES[rule_id],), ctx)


def matches(rule_id: str, text: str, links: list[str] | None = None) -> bool:
    return bool(run(rule_id, text, links))


# ---------- BR-020 Urgency ----------

@pytest.mark.parametrize("text", [
    "Your account will be suspended within 24 hours.",
    "URGENT: action required",
    "Final notice before closure.",
])
def test_br020_matches_urgency(text):
    assert matches("BR-020", text)


@pytest.mark.parametrize("text", ["See you at the meeting next week.", "No rush, reply when you can."])
def test_br020_ignores_calm_text(text):
    assert not matches("BR-020", text)


def test_br020_negated():
    assert not matches("BR-020", "Your account will never be suspended without notice.")


# ---------- BR-021 Credential request ----------

@pytest.mark.parametrize("text", [
    "Please confirm your password using the form.",
    "Reply and share your OTP to continue.",
    "Verify your account to avoid closure.",
])
def test_br021_matches_credential_requests(text):
    assert matches("BR-021", text)


@pytest.mark.parametrize("text", [
    "Your password was changed successfully.",
    "Your verification code is 482913.",
])
def test_br021_ignores_notifications(text):
    assert not matches("BR-021", text)


@pytest.mark.parametrize("text", [
    "We will never ask you to share your OTP.",
    "Do not enter your password on unknown sites.",
])
def test_br021_negated(text):
    assert not matches("BR-021", text)


# ---------- BR-022 Payment request ----------

@pytest.mark.parametrize("text", [
    "Buy a gift card and send me the codes.",
    "Update your card number and CVV.",
    "A processing fee is required, pay immediately.",
])
def test_br022_matches_payment_requests(text):
    assert matches("BR-022", text)


@pytest.mark.parametrize("text", ["Thanks for your order of two books.", "The meeting is in the card room."])
def test_br022_ignores_ordinary_text(text):
    assert not matches("BR-022", text)


def test_br022_negated():
    assert not matches("BR-022", "We will never ask for your card number by email.")


# ---------- BR-023 Impersonation ----------

@pytest.mark.parametrize("text", [
    "This is your bank. Please verify your details today.",
    "Microsoft security team: sign in to restore access.",
])
def test_br023_matches_claim_plus_action(text):
    assert matches("BR-023", text)


@pytest.mark.parametrize("text", [
    "Your Amazon order has shipped.",        # claim, no action
    "Please confirm the meeting time.",      # action, no claim
    "I love pineapple pizza, confirm?",      # brand only as part of a word
])
def test_br023_needs_both_claim_and_action(text):
    assert not matches("BR-023", text)


def test_br023_negated_action():
    assert not matches("BR-023", "Your bank will never ask you to verify anything by email.")


# ---------- BR-024 Suspicious links ----------

def test_br024_high_link_is_strong():
    [m] = run("BR-024", "hello", ["low", "high"])
    assert m.strength == "strong"
    assert "1 link(s)" in m.explanation and "High" in m.explanation


def test_br024_medium_link_is_moderate():
    [m] = run("BR-024", "hello", ["medium", "medium"])
    assert m.strength == "moderate"
    assert "2 link(s)" in m.explanation


@pytest.mark.parametrize("links", [[], ["low"], ["inconclusive", "low"]])
def test_br024_ignores_low_and_inconclusive_links(links):
    assert not matches("BR-024", "hello", links)


# ---------- BR-025 Sensitive information ----------

@pytest.mark.parametrize("text", [
    "Send a copy of your Aadhaar and PAN card.",
    "Confirm your date of birth and mother's maiden name.",
    "Update your KYC immediately.",
])
def test_br025_matches_sensitive_requests(text):
    assert matches("BR-025", text)


@pytest.mark.parametrize("text", ["Happy birthday!", "Our company panel meets on Friday."])
def test_br025_ignores_ordinary_text(text):
    assert not matches("BR-025", text)


def test_br025_negated():
    assert not matches("BR-025", "We never ask for your Aadhaar number.")


# ---------- Explanations never quote the email ----------

def test_explanations_only_quote_list_phrases():
    secret = "zz-private-detail-zz"
    text = f"Urgent: {secret} please confirm your password and send your bank details."
    ctx = EmailContext(text=normalize_text(text), link_categories=[])
    for m in evaluate(EMAIL_RULES, ctx):
        assert secret not in m.explanation


def test_br026_grammar_is_not_used():
    assert "BR-026" not in RULES


# ---------- Email category table ----------

def _m(rule_id, strength):
    return RuleMatch(rule_id, "t", strength, "e")


@pytest.mark.parametrize("found, expected", [
    ([_m("BR-024", "strong")], "high"),
    ([_m("BR-021", "moderate"), _m("BR-025", "moderate")], "high"),
    ([_m("BR-021", "moderate")], "medium"),
    ([_m("BR-021", "moderate"), _m("BR-020", "weak")], "medium"),
    ([_m("BR-020", "weak")], "low"),
    ([], "low"),
])
def test_email_category_table(found, expected):
    assert categorize(found, moderate_rules_for_high=2) == expected


def test_two_moderate_row_is_off_for_urls():
    assert categorize([_m("BR-002", "moderate"), _m("BR-021", "moderate")]) == "medium"
