import pytest

from app.core.safety import defang
from app.detection.aggregation.rules_only import categorize
from app.detection.rules.base import RuleMatch


def m(rule_id: str, strength: str) -> RuleMatch:
    return RuleMatch(rule_id, "title", strength, "explanation")


# One test per row of the rules-only decision table (SRS TR-005).
@pytest.mark.parametrize("matches, expected", [
    ([m("BR-001", "strong")], "high"),
    ([m("BR-009", "weak"), m("BR-005", "strong")], "high"),
    ([m("BR-002", "moderate")], "medium"),
    ([m("BR-007", "weak"), m("BR-009", "weak")], "medium"),
    ([m("BR-007", "weak")], "inconclusive"),
    ([m("BR-009", "weak")], "low"),
    ([], "low"),
])
def test_rules_only_table(matches, expected):
    assert categorize(matches, insufficient_evidence_rules=frozenset({"BR-007"})) == expected


@pytest.mark.parametrize("raw, expected", [
    ("https://example.com/a.html", "hxxps://example[.]com/a[.]html"),
    ("HTTP://EXAMPLE.COM", "hxxp://EXAMPLE[.]COM"),
    ("http://a.com/?next=http://b.com", "hxxp://a[.]com/?next=hxxp://b[.]com"),
])
def test_defang(raw, expected):
    assert defang(raw) == expected
