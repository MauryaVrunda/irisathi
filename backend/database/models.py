"""Normalized SQLAlchemy ORM models for IRISaathi patient records, screenings, AI outputs, and reports."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def utc_now() -> datetime:
    """Return current timezone-aware UTC timestamp."""
    return datetime.now(timezone.utc)


def _iso(dt: datetime | None) -> str | None:
    """Format a datetime as an ISO-8601 string if present."""
    return dt.isoformat() if dt is not None else None


class Base(DeclarativeBase):
    """Declarative base for all IRISaathi database tables."""


class Patient(Base):
    """Registered or anonymous-intake diabetic screening patient record."""

    __tablename__ = "patients"
    __table_args__ = (
        CheckConstraint("age >= 0 AND age <= 130", name="ck_patients_age_range"),
        CheckConstraint("gender IN ('male', 'female', 'other')", name="ck_patients_gender"),
        CheckConstraint(
            "diabetes_status IN ('diagnosed', 'suspected', 'gestational', 'type1')",
            name="ck_patients_diabetes_status",
        ),
        CheckConstraint("diabetes_duration_years >= 0", name="ck_patients_diabetes_duration"),
        CheckConstraint(
            "previous_dr_history IN ('none', 'mild', 'moderate', 'laser_treatment', 'unknown')",
            name="ck_patients_prev_dr_history",
        ),
        CheckConstraint(
            "previous_ophth_visit IN ('never', 'within_6m', '1_to_2y', 'more_than_2y')",
            name="ck_patients_prev_ophth_visit",
        ),
        CheckConstraint("preferred_eye IN ('right', 'left', 'both')", name="ck_patients_preferred_eye"),
        Index("ix_patients_district_state", "district", "state"),
    )

    patient_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)
    mobile: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    village: Mapped[str] = mapped_column(String(150), nullable=False)
    district: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    state: Mapped[str] = mapped_column(String(100), nullable=False, default="Gujarat")

    diabetes_status: Mapped[str] = mapped_column(String(30), nullable=False, default="diagnosed")
    diabetes_duration_years: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    hba1c: Mapped[float | None] = mapped_column(Float, nullable=True)
    blood_glucose: Mapped[float | None] = mapped_column(Float, nullable=True)
    previous_dr_history: Mapped[str] = mapped_column(String(40), nullable=False, default="unknown")
    previous_ophth_visit: Mapped[str] = mapped_column(String(40), nullable=False, default="never")
    symptoms: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    preferred_eye: Mapped[str] = mapped_column(String(16), nullable=False, default="both")
    is_anonymous: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    registration_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    screening_sessions: Mapped[list[ScreeningSession]] = relationship(
        back_populates="patient", cascade="all, delete-orphan", passive_deletes=True
    )
    referrals: Mapped[list[Referral]] = relationship(
        back_populates="patient", cascade="all, delete-orphan", passive_deletes=True
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "patient_id": self.patient_id,
            "name": self.name,
            "age": self.age,
            "gender": self.gender,
            "mobile": self.mobile,
            "village": self.village,
            "district": self.district,
            "state": self.state,
            "diabetes_status": self.diabetes_status,
            "diabetes_duration_years": self.diabetes_duration_years,
            "hba1c": self.hba1c,
            "blood_glucose": self.blood_glucose,
            "previous_dr_history": self.previous_dr_history,
            "previous_ophth_visit": self.previous_ophth_visit,
            "symptoms": self.symptoms or [],
            "preferred_eye": self.preferred_eye,
            "is_anonymous": self.is_anonymous,
            "registration_date": _iso(self.registration_date),
            "created_at": _iso(self.created_at),
            "updated_at": _iso(self.updated_at),
        }


class ScreeningSession(Base):
    """Individual retinal screening encounter for a patient and eye side."""

    __tablename__ = "screening_sessions"
    __table_args__ = (
        CheckConstraint("eye_side IN ('OD', 'OS', 'OU')", name="ck_screening_eye_side"),
        CheckConstraint(
            "status IN ('captured', 'quality_failed', 'ai_analyzed', 'pending_review', 'reviewed', 'referred', 'completed')",
            name="ck_screening_status",
        ),
        Index("ix_screening_patient_status", "patient_id", "status"),
    )

    screening_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    patient_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False, index=True
    )
    eye_side: Mapped[str] = mapped_column(String(8), nullable=False, default="OD")
    study_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, index=True
    )
    health_centre: Mapped[str] = mapped_column(String(200), nullable=False)
    operator_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="captured", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    patient: Mapped[Patient] = relationship(back_populates="screening_sessions")
    retinal_images: Mapped[list[RetinalImage]] = relationship(
        back_populates="screening_session", cascade="all, delete-orphan", passive_deletes=True
    )
    quality_result: Mapped[ImageQualityResult | None] = relationship(
        back_populates="screening_session", uselist=False, cascade="all, delete-orphan", passive_deletes=True
    )
    ai_prediction: Mapped[AIPrediction | None] = relationship(
        back_populates="screening_session", uselist=False, cascade="all, delete-orphan", passive_deletes=True
    )
    explainability_results: Mapped[list[ExplainabilityResult]] = relationship(
        back_populates="screening_session", cascade="all, delete-orphan", passive_deletes=True
    )
    doctor_review: Mapped[DoctorReview | None] = relationship(
        back_populates="screening_session", uselist=False, cascade="all, delete-orphan", passive_deletes=True
    )
    referrals: Mapped[list[Referral]] = relationship(
        back_populates="screening_session", cascade="all, delete-orphan", passive_deletes=True
    )
    generated_reports: Mapped[list[GeneratedReport]] = relationship(
        back_populates="screening_session", cascade="all, delete-orphan", passive_deletes=True
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "screening_id": self.screening_id,
            "patient_id": self.patient_id,
            "eye_side": self.eye_side,
            "study_date": _iso(self.study_date),
            "health_centre": self.health_centre,
            "operator_id": self.operator_id,
            "status": self.status,
            "created_at": _iso(self.created_at),
            "updated_at": _iso(self.updated_at),
        }


class RetinalImage(Base):
    """File-system/URI reference and capture metadata for a retinal fundus image (no binary blobs)."""

    __tablename__ = "retinal_images"
    __table_args__ = (
        CheckConstraint("eye_side IN ('OD', 'OS')", name="ck_retinal_images_eye_side"),
        CheckConstraint("width_px IS NULL OR width_px > 0", name="ck_retinal_images_width"),
        CheckConstraint("height_px IS NULL OR height_px > 0", name="ck_retinal_images_height"),
        CheckConstraint("file_size_bytes IS NULL OR file_size_bytes >= 0", name="ck_retinal_images_bytes"),
    )

    image_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    screening_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("screening_sessions.screening_id", ondelete="CASCADE"), nullable=False, index=True
    )
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    eye_side: Mapped[str] = mapped_column(String(8), nullable=False, default="OD")
    resolution: Mapped[str] = mapped_column(String(64), nullable=False, default="1536 × 1536 px")
    width_px: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height_px: Mapped[int | None] = mapped_column(Integer, nullable=True)
    file_size_label: Mapped[str | None] = mapped_column(String(32), nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mime_type: Mapped[str] = mapped_column(String(64), nullable=False, default="image/jpeg")
    camera_modality: Mapped[str] = mapped_column(String(64), nullable=False, default="non_mydriatic_fundus")
    sha256_checksum: Mapped[str | None] = mapped_column(String(64), nullable=True)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)

    screening_session: Mapped[ScreeningSession] = relationship(back_populates="retinal_images")

    def to_dict(self) -> dict[str, Any]:
        return {
            "image_id": self.image_id,
            "screening_id": self.screening_id,
            "file_path": self.file_path,
            "file_name": self.file_name,
            "eye_side": self.eye_side,
            "resolution": self.resolution,
            "width_px": self.width_px,
            "height_px": self.height_px,
            "file_size_label": self.file_size_label,
            "file_size_bytes": self.file_size_bytes,
            "mime_type": self.mime_type,
            "camera_modality": self.camera_modality,
            "sha256_checksum": self.sha256_checksum,
            "captured_at": _iso(self.captured_at),
            "created_at": _iso(self.created_at),
        }


class ImageQualityResult(Base):
    """Automated quality gate assessment determining gradability and recapture guidance."""

    __tablename__ = "image_quality_results"
    __table_args__ = (
        CheckConstraint("status IN ('passed', 'review', 'failed')", name="ck_quality_status"),
        CheckConstraint("overall_score >= 0 AND overall_score <= 100", name="ck_quality_overall_score"),
    )

    quality_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    screening_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("screening_sessions.screening_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    image_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("retinal_images.image_id", ondelete="SET NULL"), nullable=True, index=True
    )
    is_gradable: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="passed", index=True)
    overall_score: Mapped[float] = mapped_column(Float, nullable=False)
    metrics: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    issues: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    recapture_guidance: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolution_detail: Mapped[str | None] = mapped_column(String(64), nullable=True)
    assessed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)

    screening_session: Mapped[ScreeningSession] = relationship(back_populates="quality_result")

    def to_dict(self) -> dict[str, Any]:
        return {
            "quality_id": self.quality_id,
            "screening_id": self.screening_id,
            "image_id": self.image_id,
            "is_gradable": self.is_gradable,
            "status": self.status,
            "overall_score": self.overall_score,
            "metrics": self.metrics or {},
            "issues": self.issues or [],
            "recapture_guidance": self.recapture_guidance,
            "resolution_detail": self.resolution_detail,
            "assessed_at": _iso(self.assessed_at),
            "created_at": _iso(self.created_at),
        }


class AIPrediction(Base):
    """AI diabetic retinopathy severity classification (ICDR 0-4) and uncertainty metadata."""

    __tablename__ = "ai_predictions"
    __table_args__ = (
        CheckConstraint("dr_grade >= 0 AND dr_grade <= 4", name="ck_ai_dr_grade_range"),
        CheckConstraint(
            "referral_status IN ('NON_REFERABLE', 'REFERABLE_DR', 'URGENT_REFERRAL')",
            name="ck_ai_referral_status",
        ),
        CheckConstraint(
            "confidence_score >= 0 AND confidence_score <= 100", name="ck_ai_confidence_range"
        ),
        CheckConstraint(
            "uncertainty_score IS NULL OR (uncertainty_score >= 0 AND uncertainty_score <= 1)",
            name="ck_ai_uncertainty_range",
        ),
        CheckConstraint(
            "macular_risk_assessment IN ('low', 'moderate', 'elevated', 'high')",
            name="ck_ai_macular_risk",
        ),
        Index("ix_ai_grade_referable", "dr_grade", "referable_dr"),
    )

    prediction_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    screening_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("screening_sessions.screening_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    dr_grade: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    dr_grade_name: Mapped[str] = mapped_column(String(120), nullable=False)
    class_probabilities: Mapped[dict[str, float]] = mapped_column(JSON, nullable=False, default=dict)
    referable_dr: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    referral_status: Mapped[str] = mapped_column(String(32), nullable=False, default="NON_REFERABLE")
    referral_recommendation: Mapped[str] = mapped_column(Text, nullable=False, default="")
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    uncertainty_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    uncertainty_flag: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    lesions: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False, default=list)
    lesion_counts: Mapped[dict[str, int]] = mapped_column(JSON, nullable=False, default=dict)
    quadrant_counts: Mapped[dict[str, int]] = mapped_column(JSON, nullable=False, default=dict)
    clinical_rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    anatomical_distribution: Mapped[str | None] = mapped_column(Text, nullable=True)
    macular_risk_assessment: Mapped[str] = mapped_column(String(20), nullable=False, default="low")
    visual_threat_assessment: Mapped[str | None] = mapped_column(Text, nullable=True)
    clinical_protocol: Mapped[str | None] = mapped_column(Text, nullable=True)
    recommended_followup_weeks: Mapped[int | None] = mapped_column(Integer, nullable=True)
    processing_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    model_version: Mapped[str] = mapped_column(String(100), nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    predicted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)

    screening_session: Mapped[ScreeningSession] = relationship(back_populates="ai_prediction")
    explainability_results: Mapped[list[ExplainabilityResult]] = relationship(back_populates="ai_prediction")

    def to_dict(self) -> dict[str, Any]:
        return {
            "prediction_id": self.prediction_id,
            "screening_id": self.screening_id,
            "dr_grade": self.dr_grade,
            "dr_grade_name": self.dr_grade_name,
            "class_probabilities": self.class_probabilities or {},
            "referable_dr": self.referable_dr,
            "referral_status": self.referral_status,
            "referral_recommendation": self.referral_recommendation,
            "confidence_score": self.confidence_score,
            "uncertainty_score": self.uncertainty_score,
            "uncertainty_flag": self.uncertainty_flag,
            "lesions": self.lesions or [],
            "lesion_counts": self.lesion_counts or {},
            "quadrant_counts": self.quadrant_counts or {},
            "clinical_rationale": self.clinical_rationale,
            "anatomical_distribution": self.anatomical_distribution,
            "macular_risk_assessment": self.macular_risk_assessment,
            "visual_threat_assessment": self.visual_threat_assessment,
            "clinical_protocol": self.clinical_protocol,
            "recommended_followup_weeks": self.recommended_followup_weeks,
            "processing_time_ms": self.processing_time_ms,
            "model_version": self.model_version,
            "is_demo": self.is_demo,
            "predicted_at": _iso(self.predicted_at),
            "created_at": _iso(self.created_at),
        }


class ExplainabilityResult(Base):
    """Grad-CAM / saliency heatmap references and target class metadata."""

    __tablename__ = "explainability_results"
    __table_args__ = (
        CheckConstraint("target_class >= 0 AND target_class <= 4", name="ck_explain_target_class"),
    )

    explainability_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    screening_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("screening_sessions.screening_id", ondelete="CASCADE"), nullable=False, index=True
    )
    prediction_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("ai_predictions.prediction_id", ondelete="SET NULL"), nullable=True, index=True
    )
    method: Mapped[str] = mapped_column(String(64), nullable=False, default="Grad-CAM++")
    target_layer: Mapped[str] = mapped_column(String(64), nullable=False, default="ResNet50.Conv5")
    target_class: Mapped[int] = mapped_column(Integer, nullable=False)
    target_class_label: Mapped[str] = mapped_column(String(120), nullable=False)
    heatmap_path: Mapped[str] = mapped_column(String(512), nullable=False)
    overlay_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    saliency_metadata: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)

    screening_session: Mapped[ScreeningSession] = relationship(back_populates="explainability_results")
    ai_prediction: Mapped[AIPrediction | None] = relationship(back_populates="explainability_results")

    def to_dict(self) -> dict[str, Any]:
        return {
            "explainability_id": self.explainability_id,
            "screening_id": self.screening_id,
            "prediction_id": self.prediction_id,
            "method": self.method,
            "target_layer": self.target_layer,
            "target_class": self.target_class,
            "target_class_label": self.target_class_label,
            "heatmap_path": self.heatmap_path,
            "overlay_path": self.overlay_path,
            "description": self.description,
            "saliency_metadata": self.saliency_metadata or {},
            "generated_at": _iso(self.generated_at),
            "created_at": _iso(self.created_at),
        }


class DoctorReview(Base):
    """Human-in-the-loop clinician verification, grade override, and clinical comments."""

    __tablename__ = "doctor_reviews"
    __table_args__ = (
        CheckConstraint("confirmed_grade >= 0 AND confirmed_grade <= 4", name="ck_review_confirmed_grade"),
        CheckConstraint(
            "action_pathway IN ('routine_rescreen', 'primary_care', 'ophthalmologist_referral', 'urgent_retina_referral')",
            name="ck_review_action_pathway",
        ),
        CheckConstraint(
            "final_status IN ('pending', 'confirmed', 'overridden', 'signed')",
            name="ck_review_final_status",
        ),
    )

    review_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    screening_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("screening_sessions.screening_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    clinician_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    clinician_name: Mapped[str] = mapped_column(String(200), nullable=False)
    clinician_registration: Mapped[str | None] = mapped_column(String(64), nullable=True)
    confirmed_grade: Mapped[int] = mapped_column(Integer, nullable=False)
    ai_agreement: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    action_pathway: Mapped[str] = mapped_column(String(40), nullable=False, default="routine_rescreen")
    clinical_comments: Mapped[str] = mapped_column(Text, nullable=False, default="")
    final_status: Mapped[str] = mapped_column(String(32), nullable=False, default="confirmed", index=True)
    is_signed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    review_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    screening_session: Mapped[ScreeningSession] = relationship(back_populates="doctor_review")

    def to_dict(self) -> dict[str, Any]:
        return {
            "review_id": self.review_id,
            "screening_id": self.screening_id,
            "clinician_id": self.clinician_id,
            "clinician_name": self.clinician_name,
            "clinician_registration": self.clinician_registration,
            "confirmed_grade": self.confirmed_grade,
            "ai_agreement": self.ai_agreement,
            "action_pathway": self.action_pathway,
            "clinical_comments": self.clinical_comments,
            "final_status": self.final_status,
            "is_signed": self.is_signed,
            "review_date": _iso(self.review_date),
            "created_at": _iso(self.created_at),
            "updated_at": _iso(self.updated_at),
        }


class Referral(Base):
    """Ophthalmology referral tracking, priority, target facility, and follow-up schedule."""

    __tablename__ = "referrals"
    __table_args__ = (
        CheckConstraint(
            "referral_status IN ('not_required', 'pending', 'scheduled', 'completed', 'cancelled')",
            name="ck_referrals_status",
        ),
        CheckConstraint(
            "priority IN ('routine', 'moderate', 'high', 'urgent')",
            name="ck_referrals_priority",
        ),
        Index("ix_referrals_status_priority", "referral_status", "priority"),
    )

    referral_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    screening_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("screening_sessions.screening_id", ondelete="CASCADE"), nullable=False, index=True
    )
    patient_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False, index=True
    )
    referral_status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending", index=True)
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="routine", index=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    target_facility: Mapped[str | None] = mapped_column(String(200), nullable=True)
    target_specialty: Mapped[str] = mapped_column(String(100), nullable=False, default="Ophthalmology")
    recommended_within_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    follow_up_items: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    screening_session: Mapped[ScreeningSession] = relationship(back_populates="referrals")
    patient: Mapped[Patient] = relationship(back_populates="referrals")

    def to_dict(self) -> dict[str, Any]:
        return {
            "referral_id": self.referral_id,
            "screening_id": self.screening_id,
            "patient_id": self.patient_id,
            "referral_status": self.referral_status,
            "priority": self.priority,
            "reason": self.reason,
            "target_facility": self.target_facility,
            "target_specialty": self.target_specialty,
            "recommended_within_days": self.recommended_within_days,
            "due_date": _iso(self.due_date),
            "notes": self.notes,
            "follow_up_items": self.follow_up_items or [],
            "created_at": _iso(self.created_at),
            "updated_at": _iso(self.updated_at),
        }


class GeneratedReport(Base):
    """Metadata and file-path reference for generated PDF screening reports."""

    __tablename__ = "generated_reports"
    __table_args__ = (
        CheckConstraint("language IN ('en', 'gu', 'hi')", name="ck_reports_language"),
        CheckConstraint("report_format IN ('pdf', 'html', 'json')", name="ck_reports_format"),
    )

    report_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    screening_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("screening_sessions.screening_id", ondelete="CASCADE"), nullable=False, index=True
    )
    report_path: Mapped[str] = mapped_column(String(512), nullable=False)
    report_format: Mapped[str] = mapped_column(String(16), nullable=False, default="pdf")
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="en", index=True)
    report_metadata: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    generated_by: Mapped[str] = mapped_column(String(100), nullable=False, default="IRISaathi Report Service")
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)

    screening_session: Mapped[ScreeningSession] = relationship(back_populates="generated_reports")

    def to_dict(self) -> dict[str, Any]:
        return {
            "report_id": self.report_id,
            "screening_id": self.screening_id,
            "report_path": self.report_path,
            "report_format": self.report_format,
            "language": self.language,
            "report_metadata": self.report_metadata or {},
            "generated_by": self.generated_by,
            "generated_at": _iso(self.generated_at),
            "created_at": _iso(self.created_at),
        }
