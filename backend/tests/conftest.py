"""Pytest fixtures providing isolated SQLite database and storage directories."""

from __future__ import annotations

import io
from pathlib import Path
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw
from sqlalchemy.orm import Session, sessionmaker

from app import main as main_module
from app.api import health as health_api
from app.api import screening as screening_api
from app.core import config as config_module
from app.core.config import Settings
from app.core.database import create_db_engine, get_db, init_db
from app.main import create_app
from app.services.model_service import ModelService
from app.services.screening_service import ScreeningService


def make_synthetic_fundus_bytes(
    size: tuple[int, int] = (512, 512),
    sharp: bool = True,
    image_format: str = "PNG",
) -> bytes:
    """Create a synthetic fundus-like test image in memory."""
    img = Image.new("RGB", size, (10, 10, 14))
    draw = ImageDraw.Draw(img)
    w, h = size
    margin = w // 10
    if sharp:
        # Illuminated retinal disc + high-contrast vessel-like lines
        draw.ellipse((margin, margin, w - margin, h - margin), fill=(175, 82, 48))
        draw.ellipse((w // 2 - 28, h // 2 - 28, w // 2 + 28, h // 2 + 28), fill=(235, 190, 110))
        for offset in (-80, -40, 0, 40, 80):
            draw.line(
                [(w // 2, h // 2), (w // 2 + offset * 2, margin + 20)],
                fill=(95, 22, 18),
                width=4,
            )
            draw.line(
                [(w // 2, h // 2), (w // 2 + offset * 2, h - margin - 20)],
                fill=(95, 22, 18),
                width=4,
            )
    else:
        # Flat, dark, low-contrast frame
        draw.rectangle((0, 0, w, h), fill=(18, 18, 20))

    buf = io.BytesIO()
    img.save(buf, format=image_format)
    return buf.getvalue()


@pytest.fixture()
def test_settings(tmp_path: Path) -> Settings:
    upload_dir = tmp_path / "uploads"
    report_dir = tmp_path / "reports"
    upload_dir.mkdir(parents=True, exist_ok=True)
    report_dir.mkdir(parents=True, exist_ok=True)
    db_file = tmp_path / "test_irisaathi.db"

    return Settings(
        app_name="IRISaathi Test API",
        app_version="0.1.0-test",
        app_env="testing",
        debug=True,
        host="127.0.0.1",
        port=8000,
        backend_dir=Path(__file__).resolve().parents[1],
        database_url=f"sqlite:///{db_file.as_posix()}",
        upload_dir=upload_dir,
        report_dir=report_dir,
        cors_origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        max_upload_size_mb=5,
        allowed_extensions=(".jpg", ".jpeg", ".png", ".webp"),
        model_weights_path=None,
        seed_demo_on_startup=False,
    )


@pytest.fixture()
def db_session(test_settings: Settings) -> Generator[Session, None, None]:
    engine = create_db_engine(test_settings.database_url)
    init_db(engine)
    TestingSessionLocal = sessionmaker(
        bind=engine, autoflush=False, autocommit=False, expire_on_commit=False
    )
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture()
def client(
    test_settings: Settings,
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> Generator[TestClient, None, None]:
    monkeypatch.setattr(config_module, "get_settings", lambda: test_settings)
    monkeypatch.setattr(main_module, "get_settings", lambda: test_settings)
    monkeypatch.setattr(main_module, "init_db", lambda: None)
    monkeypatch.setattr(health_api, "get_settings", lambda: test_settings)
    monkeypatch.setattr(screening_api, "get_settings", lambda: test_settings)

    app = create_app()

    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    def override_screening_service() -> ScreeningService:
        return ScreeningService(
            settings=test_settings,
            model_service=ModelService(settings=test_settings),
        )

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[screening_api.get_screening_service] = override_screening_service

    with TestClient(app) as test_client:
        yield test_client
