"""
config.py — Centralised configuration for the Flashcard API.

All settings are read from environment variables (with sensible defaults).
Copy .env.example to .env and fill in your values before running the server.

Usage anywhere in the project:
    from config import settings
    print(settings.openrouter_api_key)
"""

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
    openai_api_key: str  = ""
    llm_model:      str  = "xiaomi/mimo-v2-flash"
    llm_base_url:   str  = "https://openrouter.ai/api/v1"
    llm_temperature: float = 0.3
    llm_max_tokens:  int   = 4096

    # ------------------------------------------------------------------
    # JWT Authentication
    # ------------------------------------------------------------------
    # Secret key used to sign JWT tokens — CHANGE THIS in production!
    jwt_secret_key: str = "your-super-secret-key-change-in-production"

    # Signing algorithm
    jwt_algorithm:  str = "HS256"

    # Token expiry in minutes (default: 24 hours)
    jwt_expire_minutes: int = 60 * 24

    # ------------------------------------------------------------------
    # Database
    # ------------------------------------------------------------------
    database_url: str = "sqlite:///./flashcards.db"

    # ------------------------------------------------------------------
    # File upload
    # ------------------------------------------------------------------
    upload_dir:             str       = "uploads"
    max_upload_size_bytes:  int       = 20 * 1024 * 1024   # 20 MB
    allowed_mime_types:     list[str] = ["application/pdf"]

    # ------------------------------------------------------------------
    # Flashcard generation
    # ------------------------------------------------------------------
    default_card_count: int = 10
    max_card_count:     int = 30

    # ------------------------------------------------------------------
    # Spaced repetition (SM-2 defaults)
    # ------------------------------------------------------------------
    sr_initial_interval:    int   = 1
    sr_min_ease_factor:     float = 1.3
    sr_default_ease_factor: float = 2.5

    # ------------------------------------------------------------------
    # API / server
    # ------------------------------------------------------------------
    api_title:   str = "AI Flashcard API"
    api_version: str = "2.0.0"

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
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ------------------------------------------------------------------
    # Derived helpers
    # ------------------------------------------------------------------
    @property
    def upload_path(self) -> Path:
        path = Path(self.upload_dir)
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------
@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings: Settings = get_settings()