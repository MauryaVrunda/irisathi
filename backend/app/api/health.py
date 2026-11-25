"""Health check API endpoint."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.schemas.screening import HealthResponse
from app.services.model_service import get_model_service

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)) -> HealthResponse:
    """Verify API readiness, database connectivity, and active model identifier."""
    settings = get_settings()
    model_service = get_model_service()
    db_status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"

    return HealthResponse(
        status="ok" if db_status == "ok" else "degraded",
        app_name=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
        database=db_status,
        model_identifier=model_service.model_identifier,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
