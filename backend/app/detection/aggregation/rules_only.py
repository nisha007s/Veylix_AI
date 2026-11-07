"""Rules-only decision table (SRS BR-048). Approved for rule version 0.1.0 (OD-04).

Rows are checked top to bottom; the first match decides the category:

    1. Any strong indicator                         -> high
    1b. (email only) 2+ moderate indicators from
        different rules                             -> high
    2. Any moderate indicator, or 2+ weak ones      -> medium
    3. Only "unknown destination" indicators        -> inconclusive
    4. Otherwise (one weak indicator, or none)      -> low

Row 1b is enabled by passing ``moderate_rules_for_high=2``; URL results are
unaffected.
"""

from typing import Literal

from app.detection.rules.base import RuleMatch

Category = Literal["low", "medium", "high", "inconclusive"]


def categorize(
    matches: list[RuleMatch],
    insufficient_evidence_rules: frozenset[str] = frozenset(),
    moderate_rules_for_high: int | None = None,
) -> Category:
    strengths = [m.strength for m in matches]
    if "strong" in strengths:
        return "high"
    moderate_rules = {m.rule_id for m in matches if m.strength == "moderate"}
    if moderate_rules_for_high and len(moderate_rules) >= moderate_rules_for_high:
        return "high"
    if "moderate" in strengths or strengths.count("weak") >= 2:
        return "medium"
    if matches and all(m.rule_id in insufficient_evidence_rules for m in matches):
        return "inconclusive"
    return "low"
