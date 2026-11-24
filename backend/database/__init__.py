"""Database configuration, session management, and ORM models for IRISaathi."""

from backend.database.connection import (
    DEFAULT_DB_PATH,
    DEFAULT_DB_URL,
    create_db_engine,
    create_session_factory,
    get_db_url,
    get_session,
    init_db,
)
from backend.database.models import (
    AIPrediction,
    Base,
    DoctorReview,
    ExplainabilityResult,
    GeneratedReport,
    ImageQualityResult,
    Patient,
    Referral,
    RetinalImage,
    ScreeningSession,
    utc_now,
)

__all__ = [
    "AIPrediction",
    "Base",
    "DEFAULT_DB_PATH",
    "DEFAULT_DB_URL",
    "DoctorReview",
    "ExplainabilityResult",
    "GeneratedReport",
    "ImageQualityResult",
    "Patient",
    "Referral",
    "RetinalImage",
    "ScreeningSession",
    "create_db_engine",
    "create_session_factory",
    "get_db_url",
    "get_session",
    "init_db",
    "utc_now",
]
