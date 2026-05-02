"""
config.py — Centralised configuration for the Flashcard API.

All settings are read from environment variables (with sensible defaults).
Copy .env.example to .env and fill in your values before running the server.

Usage anywhere in the project:
    from config import settings
    print(settings.openrouter_api_key)
"""

import os
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


# ---------------------------------------------------------------------------
# Settings model
# ---------------------------------------------------------------------------
class Settings(BaseSettings):
    """
    Pydantic-settings automatically reads these fields from:
      1. Environment variables  (exact name, case-insensitive)
      2. A .env file in the project root (if present)
    """

    # ------------------------------------------------------------------
    # OpenRouter / LLM
    # ------------------------------------------------------------------
    # Your OpenRouter API key — set OPENAI_API_KEY in your .env file.
    # OpenRouter accepts the standard "OPENAI_API_KEY" header name,
    # so existing tooling (LangChain's ChatOpenAI) works without changes.
    openai_api_key: str = ""

    # Model identifier on OpenRouter
    llm_model: str = "xiaomi/mimo-v2-flash"

    # OpenRouter base URL (drop-in replacement for the OpenAI base URL)
    llm_base_url: str = "https://openrouter.ai/api/v1"

    # LLM temperature — low value keeps flashcard output focused & factual
    llm_temperature: float = 0.3

    # Maximum tokens the LLM may return per request
    llm_max_tokens: int = 4096

    # ------------------------------------------------------------------
    # Database
    # ------------------------------------------------------------------
    # SQLite by default — swap for postgresql+psycopg2://user:pass@host/db
    database_url: str = "sqlite:///./flashcards.db"

    # ------------------------------------------------------------------
    # File upload
    # ------------------------------------------------------------------
    # Directory where uploaded PDFs are temporarily stored
    upload_dir: str = "uploads"

    # Maximum allowed PDF size in bytes (default: 20 MB)
    max_upload_size_bytes: int = 20 * 1024 * 1024

    # Allowed MIME types for upload validation
    allowed_mime_types: list[str] = ["application/pdf"]

    # ------------------------------------------------------------------
    # Flashcard generation
    # ------------------------------------------------------------------
    # Default number of flashcards to generate when not specified by user
    default_card_count: int = 10

    # Hard cap — prevents runaway token usage
    max_card_count: int = 30

    # ------------------------------------------------------------------
    # Spaced repetition (SM-2 defaults)
    # ------------------------------------------------------------------
    # Initial interval in days after the first successful review
    sr_initial_interval: int = 1

    # Minimum easiness factor — SM-2 recommendation is 1.3
    sr_min_ease_factor: float = 1.3

    # Starting easiness factor for new cards
    sr_default_ease_factor: float = 2.5

    # ------------------------------------------------------------------
    # API / server
    # ------------------------------------------------------------------
    # Displayed in OpenAPI docs and used by CORS middleware
    api_title: str = "AI Flashcard API"
    api_version: str = "1.0.0"

    # Origins allowed by CORS (comma-separated string in .env)
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    # ------------------------------------------------------------------
    # Pydantic-settings config
    # ------------------------------------------------------------------
    model_config = SettingsConfigDict(
        env_file=".env",          # load from .env in the working directory
        env_file_encoding="utf-8",
        case_sensitive=False,     # OPENAI_API_KEY == openai_api_key
        extra="ignore",           # silently ignore unrecognised env vars
    )

    # ------------------------------------------------------------------
    # Derived helpers (not env vars)
    # ------------------------------------------------------------------
    @property
    def upload_path(self) -> Path:
        """Resolved Path object for the upload directory."""
        path = Path(self.upload_dir)
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def is_sqlite(self) -> bool:
        """True when the configured DB is SQLite (useful for engine options)."""
        return self.database_url.startswith("sqlite")


# ---------------------------------------------------------------------------
# Singleton — import `settings` everywhere instead of re-instantiating
# ---------------------------------------------------------------------------
@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Cached factory so Settings() is only constructed once per process.
    Use this in FastAPI dependency injection:
        from config import get_settings
        def my_route(cfg: Settings = Depends(get_settings)): ...
    """
    return Settings()


# Module-level singleton for direct imports:
#   from config import settings
settings: Settings = get_settings()