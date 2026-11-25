"""SQLAlchemy ORM models for IRISaathi retinal screening persistence."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    """Declarative base for all ORM entities."""


class PatientRecord(Base):
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    gender: Mapped[str] = mapped_column(String(16), nullable=False)
    mobile: Mapped[str] = mapped_column(String(24), nullable=False)
    village: Mapped[str] = mapped_column(String(120), nullable=False)
    district: Mapped[str] = mapped_column(String(120), nullable=False, default="Navsari")
    state: Mapped[str] = mapped_column(String(120), nullable=False, default="Gujarat")
    diabetes_status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="diagnosed"
    )
    diabetes_duration_years: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    hba1c: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    blood_glucose: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    previous_dr_history: Mapped[str] = mapped_column(
        String(32), nullable=False, default="none"
    )
    previous_ophth_visit: Mapped[str] = mapped_column(
        String(32), nullable=False, default="never"
    )
    symptoms_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    preferred_eye: Mapped[str] = mapped_column(String(16), nullable=False, default="right")
    is_anonymous: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )

    screenings: Mapped[List["ScreeningSession"]] = relationship(
        back_populates="patient",
        cascade="all, delete-orphan",
        order_by="desc(ScreeningSession.created_at)",
    )


class ScreeningSession(Base):
    __tablename__ = "screening_sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    patient_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("patients.id", ondelete="CASCADE"), index=True, nullable=False
    )
    eye: Mapped[str] = mapped_column(String(8), nullable=False, default="OD")
    health_centre: Mapped[str] = mapped_column(
        String(160), nullable=False, default="Primary Health Centre (PHC)"
    )
    study_date: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="analyzed")
    is_demo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )

    patient: Mapped[PatientRecord] = relationship(back_populates="screenings")
    image_asset: Mapped[Optional["RetinalImageAsset"]] = relationship(
        back_populates="screening", uselist=False, cascade="all, delete-orphan"
    )
    quality_check: Mapped[Optional["ImageQualityCheck"]] = relationship(
        back_populates="screening", uselist=False, cascade="all, delete-orphan"
    )
    ai_prediction: Mapped[Optional["AIPrediction"]] = relationship(
        back_populates="screening", uselist=False, cascade="all, delete-orphan"
    )
    doctor_review: Mapped[Optional["DoctorReview"]] = relationship(
        back_populates="screening", uselist=False, cascade="all, delete-orphan"
    )
    referral: Mapped[Optional["ReferralRecord"]] = relationship(
        back_populates="screening", uselist=False, cascade="all, delete-orphan"
    )
    reports: Mapped[List["GeneratedReport"]] = relationship(
        back_populates="screening", cascade="all, delete-orphan"
    )


class RetinalImageAsset(Base):
    __tablename__ = "retinal_images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    screening_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("screening_sessions.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    public_url: Mapped[str] = mapped_column(String(512), nullable=False)
    content_type: Mapped[str] = mapped_column(String(64), nullable=False, default="image/jpeg")
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    width_px: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    height_px: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sha256_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    source_type: Mapped[str] = mapped_column(String(32), nullable=False, default="upload")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )

    screening: Mapped[ScreeningSession] = relationship(back_populates="image_asset")


class ImageQualityCheck(Base):
    __tablename__ = "quality_checks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    screening_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("screening_sessions.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    overall_score: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False)
    width_px: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    height_px: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    mean_brightness: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    contrast_std: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    sharpness_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    metrics_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    resolution_detail: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    checked_at: Mapped[str] = mapped_column(String(64), nullable=False)

    screening: Mapped[ScreeningSession] = relationship(back_populates="quality_check")


class AIPrediction(Base):
    __tablename__ = "ai_predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    screening_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("screening_sessions.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    is_prototype_output: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    sample_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    predicted_grade: Mapped[int] = mapped_column(Integer, nullable=False)
    predicted_grade_name: Mapped[str] = mapped_column(String(160), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    referral_status: Mapped[str] = mapped_column(String(32), nullable=False)
    referral_recommendation: Mapped[str] = mapped_column(Text, nullable=False)
    probabilities_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    lesions_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    lesion_counts_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    quadrant_counts_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    clinical_rationale: Mapped[str] = mapped_column(Text, nullable=False, default="")
    anatomical_distribution: Mapped[str] = mapped_column(Text, nullable=False, default="")
    macular_risk_assessment: Mapped[str] = mapped_column(
        String(32), nullable=False, default="moderate"
    )
    visual_threat_assessment: Mapped[str] = mapped_column(Text, nullable=False, default="")
    clinical_protocol: Mapped[str] = mapped_column(Text, nullable=False, default="")
    recommended_followup_weeks: Mapped[int] = mapped_column(Integer, nullable=False, default=6)
    processing_time_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=120)
    model_identifier: Mapped[str] = mapped_column(String(128), nullable=False)
    disclaimer: Mapped[str] = mapped_column(Text, nullable=False)
    gradcam_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    gradcam_method: Mapped[str] = mapped_column(
        String(64), nullable=False, default="Grad-CAM++ Reference Heatmap"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )

    screening: Mapped[ScreeningSession] = relationship(back_populates="ai_prediction")


class DoctorReview(Base):
    __tablename__ = "doctor_reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    screening_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("screening_sessions.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    clinician_id: Mapped[str] = mapped_column(String(64), nullable=False)
    clinician_name: Mapped[str] = mapped_column(String(160), nullable=False)
    confirmed_grade: Mapped[int] = mapped_column(Integer, nullable=False)
    action_pathway: Mapped[str] = mapped_column(String(64), nullable=False)
    clinical_remarks: Mapped[str] = mapped_column(Text, nullable=False)
    is_signed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    reviewed_at: Mapped[str] = mapped_column(String(64), nullable=False)

    screening: Mapped[ScreeningSession] = relationship(back_populates="doctor_review")


class ReferralRecord(Base):
    __tablename__ = "referrals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    screening_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("screening_sessions.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    priority: Mapped[str] = mapped_column(String(32), nullable=False, default="REFERABLE_DR")
    facility_name: Mapped[str] = mapped_column(
        String(200), nullable=False, default="Navsari District Civil Hospital - Tele-Retina Unit"
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    due_date: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    followups_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    sms_history_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )

    screening: Mapped[ScreeningSession] = relationship(back_populates="referral")


class GeneratedReport(Base):
    __tablename__ = "generated_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    screening_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("screening_sessions.id", ondelete="CASCADE"), index=True, nullable=False
    )
    report_code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    language: Mapped[str] = mapped_column(String(16), nullable=False, default="en")
    disclaimer_included: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )

    screening: Mapped[ScreeningSession] = relationship(back_populates="reports")
