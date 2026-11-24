"""SQLite + SQLAlchemy engine and session management for offline-capable IRISaathi deployments."""

from __future__ import annotations

import os
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from backend.database.models import Base

BACKEND_DIR = Path(__file__).resolve().parents[1]
DEFAULT_DB_PATH = BACKEND_DIR / "data" / "irisaathi.db"
DEFAULT_DB_URL = f"sqlite:///{DEFAULT_DB_PATH.as_posix()}"


def get_db_url(db_url: str | None = None) -> str:
    """Resolve the database URL from an explicit argument, environment variable, or local SQLite default."""
    if db_url:
        return db_url
    env_url = os.getenv("IRISAATHI_DB_URL")
    if env_url:
        return env_url
    return DEFAULT_DB_URL


def _enable_sqlite_foreign_keys(dbapi_connection, _connection_record) -> None:
    """Ensure SQLite enforces foreign key constraints on every connection."""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def create_db_engine(db_url: str | None = None, echo: bool = False) -> Engine:
    """Create a SQLAlchemy engine configured for SQLite with foreign key enforcement."""
    resolved_url = get_db_url(db_url)
    connect_args = {}

    if resolved_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
        if resolved_url != "sqlite:///:memory:" and ":memory:" not in resolved_url:
            sqlite_file = resolved_url.replace("sqlite:///", "", 1)
            Path(sqlite_file).parent.mkdir(parents=True, exist_ok=True)

    engine = create_engine(resolved_url, echo=echo, connect_args=connect_args, future=True)
    if resolved_url.startswith("sqlite"):
        event.listen(engine, "connect", _enable_sqlite_foreign_keys)
    return engine


def create_session_factory(engine: Engine) -> sessionmaker[Session]:
    """Build a configured sessionmaker bound to the provided engine."""
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def init_db(engine: Engine) -> None:
    """Create all normalized IRISaathi database tables if they do not exist."""
    Base.metadata.create_all(bind=engine)


@contextmanager
def get_session(session_factory: sessionmaker[Session]) -> Iterator[Session]:
    """Provide a transactional SQLAlchemy session scope with automatic rollback on failure."""
    session = session_factory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
