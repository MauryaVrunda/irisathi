"""Application settings loaded from environment and backend/.env."""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BACKEND_DIR / ".env"

if ENV_FILE.exists():
    load_dotenv(dotenv_path=ENV_FILE, override=False)

DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


def _parse_bool(value: Optional[str], default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _parse_origins(raw: Optional[str]) -> List[str]:
    if not raw or not raw.strip():
        return list(DEFAULT_CORS_ORIGINS)
    origins = [item.strip() for item in raw.split(",") if item.strip()]
    return origins or list(DEFAULT_CORS_ORIGINS)


def _resolve_path(raw_path: str, base_dir: Path) -> Path:
    candidate = Path(raw_path)
    if not candidate.is_absolute():
        candidate = (base_dir / candidate).resolve()
    return candidate


def _resolve_database_url(raw_url: str, base_dir: Path) -> str:
    prefix = "sqlite:///"
    if raw_url.startswith(prefix):
        db_part = raw_url[len(prefix) :]
        if db_part == ":memory:":
            return raw_url
        db_path = Path(db_part)
        if not db_path.is_absolute():
            db_path = (base_dir / db_path).resolve()
        db_path.parent.mkdir(parents=True, exist_ok=True)
        return f"{prefix}{db_path.as_posix()}"
    return raw_url


@dataclass(frozen=True)
class Settings:
    app_name: str
    app_version: str
    app_env: str
    debug: bool
    host: str
    port: int
    backend_dir: Path
    database_url: str
    upload_dir: Path
    report_dir: Path
    cors_origins: List[str]
    max_upload_size_mb: int
    allowed_extensions: tuple[str, ...]
    model_weights_path: Optional[str]
    seed_demo_on_startup: bool

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached application settings loaded from environment variables."""
    if ENV_FILE.exists():
        load_dotenv(dotenv_path=ENV_FILE, override=False)

    upload_dir = _resolve_path(
        os.getenv("UPLOAD_DIR", "./app/storage/uploads"), BACKEND_DIR
    )
    report_dir = _resolve_path(
        os.getenv("REPORT_DIR", "./app/storage/reports"), BACKEND_DIR
    )
    upload_dir.mkdir(parents=True, exist_ok=True)
    report_dir.mkdir(parents=True, exist_ok=True)

    raw_db_url = os.getenv("DATABASE_URL", "sqlite:///./app/storage/irisaathi.db")
    database_url = _resolve_database_url(raw_db_url, BACKEND_DIR)

    return Settings(
        app_name=os.getenv("APP_NAME", "IRISaathi Clinical Screening API"),
        app_version=os.getenv("APP_VERSION", "0.1.0"),
        app_env=os.getenv("APP_ENV", "development"),
        debug=_parse_bool(os.getenv("DEBUG"), True),
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "8000")),
        backend_dir=BACKEND_DIR,
        database_url=database_url,
        upload_dir=upload_dir,
        report_dir=report_dir,
        cors_origins=_parse_origins(os.getenv("CORS_ORIGINS")),
        max_upload_size_mb=int(os.getenv("MAX_UPLOAD_SIZE_MB", "15")),
        allowed_extensions=(".jpg", ".jpeg", ".png", ".webp"),
        model_weights_path=os.getenv("MODEL_WEIGHTS_PATH") or None,
        seed_demo_on_startup=_parse_bool(os.getenv("SEED_DEMO_ON_STARTUP"), True),
    )
