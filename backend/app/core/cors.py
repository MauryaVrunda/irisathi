"""CORS configuration for local React/Vite development servers."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import Settings, get_settings


def configure_cors(app: FastAPI, settings: Settings | None = None) -> None:
    """Attach CORSMiddleware allowing configured frontend origins."""
    active_settings = settings or get_settings()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=active_settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["Content-Disposition"],
    )
