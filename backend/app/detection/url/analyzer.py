"""URL analyzer: validate -> parse (shared) -> rules -> rules-only category.

Pure logic: no database, no HTTP framework, no network access.
"""

from dataclasses import dataclass

from app.core.safety import defang
from app.detection.aggregation.rules_only import Category, categorize
from app.detection.errors import InvalidInput
from app.detection.rules.base import RuleMatch, evaluate
from app.detection.rules.url_rules import RULE_VERSION, URL_RULES
from shared.url_parsing import ParsedUrl, UrlParseError, parse_url

LIMITATIONS = (
    "This link was not opened. Its page content and final destination are unknown.",
    "Indicators are signals, not proof. A Low result is not a guarantee of safety.",
    "Machine-learning analysis is not available yet, so this result uses documented rules only.",
)


@dataclass(frozen=True)
class UrlAnalysis:
    display_value: str
    category: Category
    matches: list[RuleMatch]
    normalizations: list[str]
    notices: list[str]
    limitations: list[str]
    rule_version: str


def safe_display(p: ParsedUrl) -> str:
    """Defanged scheme://host[:port]/path. User-info, query and fragment are left out."""
    host = f"[{p.host}]" if p.ip_format == "ipv6" else p.host
    port = f":{p.port}" if p.port is not None else ""
    return defang(f"{p.scheme}://{host}{port}{p.path}")


def analyze_url(raw: str, max_length: int) -> UrlAnalysis:
    # Length is checked first, before any parsing (SRS SEC-070).
    if len(raw) > max_length:
        raise InvalidInput("too_long", f"URL is longer than {max_length:,} characters.")
    if not raw.strip():
        raise InvalidInput("empty", "Enter a URL to analyse.")
    try:
        parsed = parse_url(raw)
    except UrlParseError:
        raise InvalidInput(
            "unparseable", "This does not look like a valid http or https web address."
        ) from None

    matches = evaluate(URL_RULES, parsed)
    category = categorize(matches, insufficient_evidence_rules=frozenset({"BR-007"}))

    notices = []
    if parsed.query or parsed.fragment:
        notices.append("query_string_hidden")
    if parsed.has_userinfo:
        notices.append("userinfo_hidden")
    if any(m.rule_id == "BR-007" for m in matches):
        notices.append("shortener_destination_unknown")

    return UrlAnalysis(
        display_value=safe_display(parsed),
        category=category,
        matches=matches,
        normalizations=list(parsed.normalizations),
        notices=notices,
        limitations=list(LIMITATIONS),
        rule_version=RULE_VERSION,
    )
