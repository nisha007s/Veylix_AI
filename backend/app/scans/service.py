"""Scan use cases. Phase 2: no accounts yet, so nothing is ever saved."""

from datetime import UTC, datetime

from app.core.config import Settings
from app.detection.email.analyzer import DISPLAY_VALUE, analyze_email
from app.detection.explain.categories import CATEGORY_TEXT
from app.detection.rules.base import RuleMatch
from app.detection.url.analyzer import analyze_url
from app.scans.schemas import (
    EmailScanResult,
    EmbeddedUrls,
    Language,
    LinkFinding,
    RuleEvidence,
    ScanResult,
    Versions,
)


def _common_fields(category: str, matches: list[RuleMatch], rule_version: str) -> dict:
    text = CATEGORY_TEXT[category]
    return {
        "scan_id": None,
        "saved": False,
        "category": category,
        "category_label": text["label"],
        "category_meaning": text["meaning"],
        "suggested_action": text["action"],
        "analysis_mode": "rules_only",
        "rule_evidence": [
            RuleEvidence(rule_id=m.rule_id, title=m.title, explanation=m.explanation,
                         strength=m.strength)
            for m in matches
        ],
        "model_contributions": [],
        "versions": Versions(rule_version=rule_version, model_version=None),
        "analysed_at": datetime.now(UTC).replace(microsecond=0),
    }


def run_url_scan(raw_url: str, settings: Settings) -> ScanResult:
    a = analyze_url(raw_url, settings.max_url_length)
    return ScanResult(
        input_type="url",
        display_value=a.display_value,
        limitations=a.limitations,
        normalizations=a.normalizations,
        notices=["not_saved", *a.notices],
        **_common_fields(a.category, a.matches, a.rule_version),
    )


def run_email_scan(raw_text: str, settings: Settings) -> EmailScanResult:
    a = analyze_email(
        raw_text,
        max_length=settings.max_email_length,
        max_links=settings.max_embedded_urls,
        max_url_length=settings.max_url_length,
    )
    return EmailScanResult(
        input_type="email",
        display_value=DISPLAY_VALUE,
        limitations=a.limitations,
        normalizations=a.normalizations,
        notices=["not_saved"],
        embedded_urls=EmbeddedUrls(
            found=a.links_found,
            analysed=a.links_analysed,
            not_analysed=a.links_not_analysed,
            failed=a.links_failed,
            findings=[
                LinkFinding(display_value=f.display_value, category=f.category,
                            rule_ids=f.rule_ids)
                for f in a.link_findings
            ],
        ),
        language=Language(status="not_checked"),
        **_common_fields(a.category, a.matches, a.rule_version),
    )
