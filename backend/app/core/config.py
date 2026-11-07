"""Central application settings (SAD-OD-03).

All configuration is read here, and only here, from environment variables
prefixed with ``VEYLIX_``. During development an optional, git-ignored
``.env`` file at the project root may supply them.

Settings are added phase by phase: Phase 2 needs no database or secrets.
"""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/app/core/config.py -> parents[3] is the Veylix_AI project root.
PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="VEYLIX_",
        env_file=PROJECT_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",  # settings for later phases are ignored until needed
    )

    app_env: Literal["development", "test", "production"] = "development"

    # Comma-separated list of allowed frontend origins (SRS SEC-031).
    cors_allowed_origins: str = "http://localhost:5173"

    # Input limits. Defaults are the PRD v1.2 values; they may be lowered,
    # never raised above the PRD values.
    max_url_length: int = Field(default=2048, ge=1, le=2048)
    max_email_length: int = Field(default=50_000, ge=1, le=50_000)
    max_embedded_urls: int = Field(default=20, ge=1, le=20)
    max_scan_body_bytes: int = Field(default=131_072, ge=1024, le=131_072)

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_allowed_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    """Load settings once per process."""
    return Settings()
