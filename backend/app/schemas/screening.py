"""Pydantic schemas and ORM-to-API serializers for IRISaathi."""

from __future__ import annotations

import json
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field

from app.core.models import ScreeningSession


class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    environment: str
    database: str
    model_identifier: str
    timestamp: str


class PatientIn(BaseModel):
    id: str = Field(..., min_length=2, max_length=64)
    name: str = Field(default="Anonymous Intake", max_length=160)
    age: int = Field(..., ge=1, le=120)
    gender: Literal["male", "female", "other"] = "female"
    mobile: str = Field(..., min_length=6, max_length=24)
    village: str = Field(..., min_length=1, max_length=120)
    district: str = Field(default="Navsari", max_length=120)
    state: str = Field(default="Gujarat", max_length=120)
    diabetes_status: Literal["diagnosed", "suspected", "gestational", "type1"] = "diagnosed"
    diabetes_duration_years: int = Field(default=0, ge=0, le=80)
    hba1c: Optional[float] = Field(default=None, ge=2.0, le=25.0)
    blood_glucose: Optional[float] = Field(default=None, ge=20.0, le=1000.0)
    previous_dr_history: Literal[
        "none", "mild", "moderate", "laser_treatment", "unknown"
    ] = "none"
    previous_ophth_visit: Literal[
        "never", "within_6m", "1_to_2y", "more_than_2y"
    ] = "never"
    symptoms: List[str] = Field(default_factory=list)
    eye: Literal["right", "left", "both"] = "right"
    is_anonymous: bool = True


class PatientOut(PatientIn):
    screening_count: int = 0


class QualityMetricItem(BaseModel):
    id: str
    name: str
    passed: bool | Literal["review"]
    score: int
    description: str


class QualityCheckOut(BaseModel):
    overall_score: int
    status: Literal["passed", "review", "failed"]
    width_px: int
    height_px: int
    mean_brightness: float
    contrast_std: float
    sharpness_score: float
    resolution_detail: str
    timestamp: str
    metrics: Dict[str, Any] = Field(default_factory=dict)


class ProbabilityDistributionSchema(BaseModel):
    grade0: float
    grade1: float
    grade2: float
    grade3: float
    grade4: float


class LesionSchema(BaseModel):
    id: int
    pathology: Literal["microaneurysm", "hemorrhage", "hard_exudate", "neovascularization"]
    locationQuadrant: Literal[
        "Superior Temporal", "Superior Nasal", "Inferior Temporal", "Inferior Nasal"
    ]
    x: float
    y: float
    confidence: float
    sizePx: Optional[int] = None


class LesionCountsSchema(BaseModel):
    microaneurysms: int
    hemorrhages: int
    hardExudates: int
    neovascularizations: int
    total: int


class QuadrantCountsSchema(BaseModel):
    superiorTemporal: int
    superiorNasal: int
    inferiorTemporal: int
    inferiorNasal: int


class AIPredictionOut(BaseModel):
    is_prototype_output: bool = True
    is_demo: bool = True
    sample_id: Optional[str] = None
    predicted_grade: int
    predicted_grade_name: str
    confidence: float
    referral_status: Literal["NON_REFERABLE", "REFERABLE_DR", "URGENT_REFERRAL"]
    referral_recommendation: str
    probabilities: ProbabilityDistributionSchema
    lesions: List[LesionSchema] = Field(default_factory=list)
    lesion_counts: LesionCountsSchema
    quadrant_counts: QuadrantCountsSchema
    clinical_rationale: str
    anatomical_distribution: str
    macular_risk_assessment: Literal["low", "moderate", "elevated", "high"]
    visual_threat_assessment: str
    clinical_protocol: str
    recommended_followup_weeks: int
    processing_time_ms: int
    model_identifier: str
    disclaimer: str
    gradcam_path: Optional[str] = None
    gradcam_method: str = "Grad-CAM++ Reference Overlay"


class DoctorReviewIn(BaseModel):
    clinician_id: str = Field(default="USR-CL-01", max_length=64)
    clinician_name: str = Field(..., min_length=2, max_length=160)
    confirmed_grade: int = Field(..., ge=0, le=4)
    action_pathway: Literal[
        "routine_rescreen",
        "primary_care",
        "ophthalmologist_referral",
        "urgent_retina_referral",
    ]
    clinical_remarks: str = Field(..., min_length=2, max_length=2000)
    is_signed: bool = True


class DoctorReviewOut(DoctorReviewIn):
    timestamp: str


class ReferralUpdateIn(BaseModel):
    priority: Optional[Literal["NON_REFERABLE", "REFERABLE_DR", "URGENT_REFERRAL"]] = None
    facility_name: Optional[str] = Field(default=None, max_length=200)
    status: Optional[Literal["pending", "scheduled", "completed", "not_required"]] = None
    due_date: Optional[str] = Field(default=None, max_length=32)
    notes: Optional[str] = Field(default=None, max_length=2000)


class FollowUpItemSchema(BaseModel):
    id: str
    title: str
    dueDate: str
    interval: str
    status: Literal["pending", "sent", "completed"]
    smsTemplateKey: str
    lastSentAt: Optional[str] = None


class SmsRecordSchema(BaseModel):
    id: str
    timestamp: str
    mobile: str
    messageText: str
    language: str
    status: Literal["delivered", "simulated"] = "simulated"


class SmsLogIn(BaseModel):
    reminder_id: Optional[str] = None
    message_text: str = Field(..., min_length=1, max_length=500)
    language: str = Field(default="en", max_length=16)


class ReferralOut(BaseModel):
    priority: str
    facility_name: str
    status: str
    due_date: Optional[str] = None
    notes: str = ""
    follow_ups: List[FollowUpItemSchema] = Field(default_factory=list)
    sms_sent_history: List[SmsRecordSchema] = Field(default_factory=list)


class ImageAssetOut(BaseModel):
    file_name: str
    file_path: str
    public_url: str
    content_type: str
    file_size_bytes: int
    width_px: int
    height_px: int
    source_type: str


class ScreeningCaseOut(BaseModel):
    id: str
    study_date: str
    health_centre: str
    eye: Literal["OD", "OS"]
    status: str
    is_demo: bool
    patient: PatientOut
    image: Optional[ImageAssetOut] = None
    quality: Optional[QualityCheckOut] = None
    ai_result: Optional[AIPredictionOut] = None
    doctor_review: Optional[DoctorReviewOut] = None
    referral: Optional[ReferralOut] = None
    report_count: int = 0


class DemoSeedResponse(BaseModel):
    seeded_count: int
    total_screenings: int
    message: str


def _safe_json(raw: Optional[str], fallback: Any) -> Any:
    if not raw:
        return fallback
    try:
        return json.loads(raw)
    except (ValueError, TypeError):
        return fallback


def screening_session_to_schema(session: ScreeningSession) -> ScreeningCaseOut:
    """Serialize a ScreeningSession ORM instance into ScreeningCaseOut."""
    p = session.patient
    patient_out = PatientOut(
        id=p.id,
        name=p.name,
        age=p.age,
        gender=p.gender,  # type: ignore[arg-type]
        mobile=p.mobile,
        village=p.village,
        district=p.district,
        state=p.state,
        diabetes_status=p.diabetes_status,  # type: ignore[arg-type]
        diabetes_duration_years=p.diabetes_duration_years,
        hba1c=p.hba1c,
        blood_glucose=p.blood_glucose,
        previous_dr_history=p.previous_dr_history,  # type: ignore[arg-type]
        previous_ophth_visit=p.previous_ophth_visit,  # type: ignore[arg-type]
        symptoms=_safe_json(p.symptoms_json, []),
        eye=p.preferred_eye,  # type: ignore[arg-type]
        is_anonymous=p.is_anonymous,
        screening_count=len(p.screenings) if p.screenings is not None else 0,
    )

    image_out = None
    if session.image_asset:
        img = session.image_asset
        image_out = ImageAssetOut(
            file_name=img.file_name,
            file_path=img.file_path,
            public_url=img.public_url,
            content_type=img.content_type,
            file_size_bytes=img.file_size_bytes,
            width_px=img.width_px,
            height_px=img.height_px,
            source_type=img.source_type,
        )

    quality_out = None
    if session.quality_check:
        q = session.quality_check
        quality_out = QualityCheckOut(
            overall_score=q.overall_score,
            status=q.status,  # type: ignore[arg-type]
            width_px=q.width_px,
            height_px=q.height_px,
            mean_brightness=q.mean_brightness,
            contrast_std=q.contrast_std,
            sharpness_score=q.sharpness_score,
            resolution_detail=q.resolution_detail,
            timestamp=q.checked_at,
            metrics=_safe_json(q.metrics_json, {}),
        )

    ai_out = None
    if session.ai_prediction:
        ai = session.ai_prediction
        probs = _safe_json(
            ai.probabilities_json,
            {"grade0": 100.0, "grade1": 0.0, "grade2": 0.0, "grade3": 0.0, "grade4": 0.0},
        )
        l_counts = _safe_json(
            ai.lesion_counts_json,
            {"microaneurysms": 0, "hemorrhages": 0, "hardExudates": 0, "neovascularizations": 0, "total": 0},
        )
        q_counts = _safe_json(
            ai.quadrant_counts_json,
            {"superiorTemporal": 0, "superiorNasal": 0, "inferiorTemporal": 0, "inferiorNasal": 0},
        )
        ai_out = AIPredictionOut(
            is_prototype_output=ai.is_prototype_output,
            is_demo=ai.is_demo,
            sample_id=ai.sample_id,
            predicted_grade=ai.predicted_grade,
            predicted_grade_name=ai.predicted_grade_name,
            confidence=ai.confidence,
            referral_status=ai.referral_status,  # type: ignore[arg-type]
            referral_recommendation=ai.referral_recommendation,
            probabilities=ProbabilityDistributionSchema(**probs),
            lesions=[LesionSchema(**item) for item in _safe_json(ai.lesions_json, [])],
            lesion_counts=LesionCountsSchema(**l_counts),
            quadrant_counts=QuadrantCountsSchema(**q_counts),
            clinical_rationale=ai.clinical_rationale,
            anatomical_distribution=ai.anatomical_distribution,
            macular_risk_assessment=ai.macular_risk_assessment,  # type: ignore[arg-type]
            visual_threat_assessment=ai.visual_threat_assessment,
            clinical_protocol=ai.clinical_protocol,
            recommended_followup_weeks=ai.recommended_followup_weeks,
            processing_time_ms=ai.processing_time_ms,
            model_identifier=ai.model_identifier,
            disclaimer=ai.disclaimer,
            gradcam_path=ai.gradcam_path,
            gradcam_method=ai.gradcam_method,
        )

    review_out = None
    if session.doctor_review:
        rev = session.doctor_review
        review_out = DoctorReviewOut(
            clinician_id=rev.clinician_id,
            clinician_name=rev.clinician_name,
            confirmed_grade=rev.confirmed_grade,
            action_pathway=rev.action_pathway,  # type: ignore[arg-type]
            clinical_remarks=rev.clinical_remarks,
            is_signed=rev.is_signed,
            timestamp=rev.reviewed_at,
        )

    referral_out = None
    if session.referral:
        ref = session.referral
        referral_out = ReferralOut(
            priority=ref.priority,
            facility_name=ref.facility_name,
            status=ref.status,
            due_date=ref.due_date,
            notes=ref.notes,
            follow_ups=[
                FollowUpItemSchema(**item)
                for item in _safe_json(ref.followups_json, [])
            ],
            sms_sent_history=[
                SmsRecordSchema(**item)
                for item in _safe_json(ref.sms_history_json, [])
            ],
        )

    return ScreeningCaseOut(
        id=session.id,
        study_date=session.study_date,
        health_centre=session.health_centre,
        eye=session.eye,  # type: ignore[arg-type]
        status=session.status,
        is_demo=session.is_demo,
        patient=patient_out,
        image=image_out,
        quality=quality_out,
        ai_result=ai_out,
        doctor_review=review_out,
        referral=referral_out,
        report_count=len(session.reports) if session.reports is not None else 0,
    )
