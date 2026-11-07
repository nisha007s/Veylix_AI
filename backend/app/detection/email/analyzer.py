"""Email analyzer: validate -> preprocess (shared) -> embedded links -> rules -> category.

Raw email text is used only inside this function call. It is never returned,
stored or logged (SRS FR-061, AC-11).
"""

from dataclasses import dataclass, field

from app.detection.aggregation.rules_only import Category, categorize
from app.detection.rules.base import RuleMatch, evaluate
from app.detection.errors import InvalidInput
from app.detection.rules.email_rules import EMAIL_RULE_VERSION, EMAIL_RULES, EmailContext
from app.detection.url.analyzer import analyze_url
from shared.email_preprocessing import preprocess_email

DISPLAY_VALUE = "Pasted email (content not stored)"

LIMITATIONS = (
    "Only the pasted text was analysed. Sender checks (SPF, DKIM, DMARC) are not available "
    "from pasted text.",
    "Where a link is shown as text, its real destination may differ and may not be visible "
    "in pasted text.",
    "Reliable detection is supported for English text only.",
    "Links were not opened. Their page content and final destinations are unknown.",
    "Indicators are signals, not proof. A Low result is not a guarantee of safety.",
    "Machine-learning analysis is not available yet, so this result uses documented rules only.",
)


@dataclass(frozen=True)
class LinkFinding:
    display_value: str
    category: Category
    rule_ids: list[str]


@dataclass(frozen=True)
class EmailAnalysis:
    category: Category
    matches: list[RuleMatch]
    normalizations: list[str]
    limitations: list[str]
    rule_version: str
    links_found: int
    links_analysed: int
    links_not_analysed: int
    links_failed: int
    link_findings: list[LinkFinding] = field(default_factory=list)


def analyze_email(raw: str, max_length: int, max_links: int, max_url_length: int) -> EmailAnalysis:
    # Length is checked first, before any processing (SRS SEC-070).
    if len(raw) > max_length:
        raise InvalidInput("too_long", f"Email text is longer than {max_length:,} characters.")
    if not raw.strip():
        raise InvalidInput("empty", "Paste the email text to analyse.")

    email = preprocess_email(raw)

    # Analyse at most `max_links` unique links, in order of appearance.
    findings: list[LinkFinding] = []
    failed = 0
    for url in email.urls[:max_links]:
        try:
            result = analyze_url(url, max_url_length)
        except InvalidInput:
            failed += 1  # one bad link never stops the email scan (SRS NFR-011)
            continue
        findings.append(
            LinkFinding(result.display_value, result.category, [m.rule_id for m in result.matches])
        )

    context = EmailContext(text=email.text, link_categories=[f.category for f in findings])
    matches = evaluate(EMAIL_RULES, context)
    category = categorize(matches, moderate_rules_for_high=2)

    return EmailAnalysis(
        category=category,
        matches=matches,
        normalizations=["html_converted"] if email.html_converted else [],
        limitations=list(LIMITATIONS),
        rule_version=EMAIL_RULE_VERSION,
        links_found=len(email.urls),
        links_analysed=len(findings),
        links_not_analysed=max(0, len(email.urls) - max_links),
        links_failed=failed,
        link_findings=findings,
    )
