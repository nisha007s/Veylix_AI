"""Rule definitions shared by the URL (and later email) rule catalogues."""

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any, Literal

Strength = Literal["weak", "moderate", "strong"]


@dataclass(frozen=True)
class Rule:
    """One documented, testable indicator (SRS FR-071).

    ``check`` returns template values when the rule matches, otherwise None.
    A rule whose strength depends on the evidence (e.g. BR-024) may return a
    ``"strength"`` key to override the default.
    """

    rule_id: str
    title: str
    strength: Strength
    template: str
    check: Callable[[Any], dict[str, str] | None]


@dataclass(frozen=True)
class RuleMatch:
    rule_id: str
    title: str
    strength: Strength
    explanation: str


def evaluate(rules: tuple[Rule, ...], subject: Any) -> list[RuleMatch]:
    """Run every rule in catalogue order and return the matches."""
    matches = []
    for rule in rules:
        values = rule.check(subject)
        if values is not None:
            values = dict(values)
            strength = values.pop("strength", rule.strength)
            matches.append(
                RuleMatch(rule.rule_id, rule.title, strength, rule.template.format(**values))
            )
    return matches
