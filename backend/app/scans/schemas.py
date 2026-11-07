"""Request/response schemas for scan endpoints (API spec v0.1 §3)."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel


class UrlScanRequest(BaseModel):
    url: str  # length and emptiness are checked by the analyzer with clear messages


class EmailScanRequest(BaseModel):
    text: str


class RuleEvidence(BaseModel):
    rule_id: str
    title: str
    explanation: str
    strength: Literal["weak", "moderate", "strong"]


class ModelContribution(BaseModel):
    feature: str
    label: str
    direction: Literal["towards_phishing", "towards_legitimate"]


class Versions(BaseModel):
    rule_version: str
    model_version: str | None


class ScanResult(BaseModel):
    scan_id: UUID | None
    saved: bool
    input_type: Literal["url", "email"]
    display_value: str
    category: Literal["low", "medium", "high", "inconclusive"]
    category_label: str
    category_meaning: str
    suggested_action: str
    analysis_mode: Literal["rules_only", "hybrid"]
    rule_evidence: list[RuleEvidence]
    model_contributions: list[ModelContribution]
    limitations: list[str]
    normalizations: list[str]
    notices: list[str]
    versions: Versions
    analysed_at: datetime


class LinkFinding(BaseModel):
    display_value: str
    category: Literal["low", "medium", "high", "inconclusive"]
    rule_ids: list[str]


class EmbeddedUrls(BaseModel):
    found: int
    analysed: int
    not_analysed: int
    failed: int
    findings: list[LinkFinding]


class Language(BaseModel):
    status: Literal["english", "mostly_non_english", "not_checked"]


class EmailScanResult(ScanResult):
    embedded_urls: EmbeddedUrls
    language: Language
