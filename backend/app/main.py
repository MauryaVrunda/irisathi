"""FastAPI entrypoint for IRISaathi backend."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api import health, patients, screening
from app.core.config import get_settings
from app.core.cors import configure_cors
from app.core.database import SessionLocal, init_db, seed_demo_data


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings = get_settings()
    init_db()
    if settings.seed_demo_on_startup:
        db = SessionLocal()
        try:
            seed_demo_data(db, settings)
        finally:
            db.close()
    yield


def create_app() -> FastAPI:
    """Create and configure the FastAPI application instance."""
    settings = get_settings()
    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "IRISaathi tele-ophthalmology assistive retinal screening API "
            "(prototype decision-support tool; not a standalone clinical diagnosis)."
        ),
        lifespan=lifespan,
    )

    configure_cors(application, settings)

    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    application.mount(
        "/uploads",
        StaticFiles(directory=str(settings.upload_dir)),
        name="uploads",
    )

    application.include_router(health.router)
    application.include_router(health.router, prefix="/api")
    application.include_router(patients.router, prefix="/api")
    application.include_router(screening.router, prefix="/api")

    return application


app = create_app()
