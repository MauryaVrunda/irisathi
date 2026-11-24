"""FastAPI backend bridge for IRISaathi (PS000001) database, patient records, and PDF reports."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import text

from backend.services.database_service import DatabaseService, seed_synthetic_data
from backend.services.report_service import LANGUAGE_METADATA, generate_screening_pdf

MEDICAL_DISCLAIMER = (
    "IRISaathi is an AI-assisted diabetic retinopathy screening and referral support tool. "
    "AI outputs are for clinical decision support only and do NOT replace diagnosis by a qualified ophthalmologist."
)

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]


# ------------------------------------------------------------------
# Pydantic Request Schemas
# ------------------------------------------------------------------


class PatientCreateRequest(BaseModel):
    patient_id: str | None = None
    name: str
    age: int = Field(..., ge=0, le=130)
    gender: str = Field(..., pattern="^(male|female|other)$")
    mobile: str
    village: str
    district: str
    state: str = "Gujarat"
    diabetes_status: str = "diagnosed"
    diabetes_duration_years: float = Field(0.0, ge=0)
    hba1c: float | None = None
    blood_glucose: float | None = None
    previous_dr_history: str = "unknown"
    previous_ophth_visit: str = "never"
    symptoms: list[str] = Field(default_factory=list)
    preferred_eye: str = "both"
    is_anonymous: bool = True
    registration_date: datetime | str | None = None


class RetinalImagePayload(BaseModel):
    file_path: str
    file_name: str
    eye_side: str = "OD"
    resolution: str = "1536 × 1536 px"
    width_px: int | None = None
    height_px: int | None = None
    file_size_label: str | None = None
    file_size_bytes: int | None = None
    mime_type: str = "image/jpeg"
    camera_modality: str = "non_mydriatic_fundus"
    sha256_checksum: str | None = None
    captured_at: datetime | str | None = None


class ImageQualityPayload(BaseModel):
    overall_score: float = Field(..., ge=0, le=100)
    status: str = Field(..., pattern="^(passed|review|failed)$")
    is_gradable: bool | None = None
    metrics: dict[str, Any] = Field(default_factory=dict)
    issues: list[str] = Field(default_factory=list)
    recapture_guidance: str | None = None
    resolution_detail: str | None = None
    assessed_at: datetime | str | None = None


class AIPredictionPayload(BaseModel):
    dr_grade: int = Field(..., ge=0, le=4)
    dr_grade_name: str | None = None
    class_probabilities: dict[str, float] = Field(default_factory=dict)
    confidence_score: float = Field(..., ge=0, le=100)
    model_version: str = "IRISaathi-Ordinal-DR-v3.2"
    referable_dr: bool | None = None
    referral_status: str | None = None
    referral_recommendation: str = ""
    uncertainty_score: float | None = Field(default=None, ge=0, le=1)
    uncertainty_flag: bool | None = None
    lesions: list[dict[str, Any]] = Field(default_factory=list)
    lesion_counts: dict[str, int] = Field(default_factory=dict)
    quadrant_counts: dict[str, int] = Field(default_factory=dict)
    clinical_rationale: str | None = None
    anatomical_distribution: str | None = None
    macular_risk_assessment: str = "low"
    visual_threat_assessment: str | None = None
    clinical_protocol: str | None = None
    recommended_followup_weeks: int | None = None
    processing_time_ms: int | None = None
    is_demo: bool = False
    predicted_at: datetime | str | None = None


class ExplainabilityPayload(BaseModel):
    target_class: int = Field(..., ge=0, le=4)
    heatmap_path: str
    overlay_path: str | None = None
    target_class_label: str | None = None
    method: str = "Grad-CAM++"
    target_layer: str = "ResNet50.Conv5"
    description: str = ""
    saliency_metadata: dict[str, Any] = Field(default_factory=dict)
    generated_at: datetime | str | None = None


class DoctorReviewRequest(BaseModel):
    clinician_id: str
    clinician_name: str
    confirmed_grade: int = Field(..., ge=0, le=4)
    action_pathway: str = Field(
        ...,
        pattern="^(routine_rescreen|primary_care|ophthalmologist_referral|urgent_retina_referral)$",
    )
    clinical_comments: str = ""
    clinician_registration: str | None = None
    final_status: str | None = None
    is_signed: bool = True
    review_date: datetime | str | None = None


class ReferralRequest(BaseModel):
    patient_id: str | None = None
    referral_status: str = Field("pending", pattern="^(not_required|pending|scheduled|completed|cancelled)$")
    priority: str = Field("routine", pattern="^(routine|moderate|high|urgent)$")
    reason: str
    target_facility: str | None = None
    target_specialty: str = "Ophthalmology"
    recommended_within_days: int | None = None
    due_date: datetime | str | None = None
    notes: str | None = None
    follow_up_items: list[dict[str, Any]] = Field(default_factory=list)
    referral_id: int | None = None


class ScreeningCreateRequest(BaseModel):
    screening_id: str | None = None
    patient_id: str | None = None
    patient: PatientCreateRequest | None = None
    eye_side: str = Field("OD", pattern="^(OD|OS|OU)$")
    health_centre: str = "Primary Health Centre (PHC)"
    study_date: datetime | str | None = None
    operator_id: str | None = None
    status: str = "captured"
    upsert: bool = False
    retinal_image: RetinalImagePayload | None = None
    quality_result: ImageQualityPayload | None = None
    ai_prediction: AIPredictionPayload | None = None
    explainability_result: ExplainabilityPayload | None = None
    doctor_review: DoctorReviewRequest | None = None
    referral: ReferralRequest | None = None


class ReportGenerateRequest(BaseModel):
    language: str = Field("en", pattern="^(en|gu|hi)$")


# ------------------------------------------------------------------
# FastAPI Application Factory & Endpoints
# ------------------------------------------------------------------


def create_app(db_url: str | None = None, report_dir: str | Path | None = None) -> FastAPI:
    """Create and configure the IRISaathi FastAPI application."""
    app = FastAPI(
        title="IRISaathi Clinical Records & Reporting API",
        description="SQLite + SQLAlchemy persistence and ReportLab PDF reporting for IRISaathi (PS000001).",
        version="1.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    db_service = DatabaseService(db_url=db_url)
    app.state.db_service = db_service
    app.state.report_dir = Path(report_dir) if report_dir else None

    def get_db(request: Request) -> DatabaseService:
        return request.app.state.db_service

    @app.get("/health")
    def health_check(request: Request) -> dict[str, Any]:
        db = get_db(request)
        try:
            with db.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Database unavailable: {exc}",
            ) from exc

        return {
            "status": "ok",
            "database": "ready",
            "service": "IRISaathi Backend",
            "project": "PS000001",
            "disclaimer": MEDICAL_DISCLAIMER,
        }

    @app.post("/api/seed-demo")
    def seed_demo(request: Request) -> dict[str, Any]:
        db = get_db(request)
        seeded_ids = seed_synthetic_data(db)
        all_sessions = db.list_screening_sessions(limit=500)
        return {
            "seeded_screening_ids": seeded_ids,
            "seeded_count": len(seeded_ids),
            "total_screenings": len(all_sessions),
        }

    @app.get("/api/patients")
    def list_patients(
        request: Request,
        district: str | None = None,
        diabetes_status: str | None = None,
        limit: int = Query(100, ge=1, le=500),
        offset: int = Query(0, ge=0),
    ) -> dict[str, Any]:
        db = get_db(request)
        patients = db.list_patients(
            district=district,
            diabetes_status=diabetes_status,
            limit=limit,
            offset=offset,
        )
        return {"patients": patients, "count": len(patients)}

    @app.post("/api/patients", status_code=status.HTTP_201_CREATED)
    def create_patient(payload: PatientCreateRequest, request: Request) -> dict[str, Any]:
        db = get_db(request)
        if payload.patient_id and db.get_patient(payload.patient_id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Patient '{payload.patient_id}' already exists.",
            )
        try:
            patient = db.create_patient(**payload.model_dump())
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        return {"patient": patient}

    @app.get("/api/screenings")
    def list_screenings(
        request: Request,
        patient_id: str | None = None,
        screening_status: str | None = Query(None, alias="status"),
        dr_grade: int | None = Query(None, ge=0, le=4),
        referable_only: bool = False,
        include_bundle: bool = True,
        limit: int = Query(100, ge=1, le=500),
        offset: int = Query(0, ge=0),
    ) -> dict[str, Any]:
        db = get_db(request)
        sessions = db.list_screening_sessions(
            patient_id=patient_id,
            status=screening_status,
            dr_grade=dr_grade,
            referable_only=referable_only,
            limit=limit,
            offset=offset,
        )
        if include_bundle:
            items = [
                bundle
                for sess in sessions
                if (bundle := db.get_complete_screening_record(sess["screening_id"])) is not None
            ]
        else:
            items = sessions
        return {"screenings": items, "count": len(items)}

    @app.get("/api/screenings/{screening_id}")
    def get_screening(screening_id: str, request: Request) -> dict[str, Any]:
        db = get_db(request)
        bundle = db.get_complete_screening_record(screening_id)
        if not bundle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Screening '{screening_id}' not found.",
            )
        return bundle

    @app.post("/api/screenings", status_code=status.HTTP_201_CREATED)
    def create_or_sync_screening(payload: ScreeningCreateRequest, request: Request) -> dict[str, Any]:
        db = get_db(request)

        # Resolve or create patient
        resolved_patient_id = payload.patient_id or (payload.patient.patient_id if payload.patient else None)
        if payload.patient is not None:
            patient_data = payload.patient.model_dump()
            if resolved_patient_id and db.get_patient(resolved_patient_id):
                update_fields = {k: v for k, v in patient_data.items() if k not in ("patient_id", "registration_date")}
                db.update_patient(resolved_patient_id, **update_fields)
            else:
                created_patient = db.create_patient(**patient_data)
                resolved_patient_id = created_patient["patient_id"]

        if not resolved_patient_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either 'patient_id' or a 'patient' object must be provided.",
            )
        if not db.get_patient(resolved_patient_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient '{resolved_patient_id}' not found.",
            )

        existing_session = db.get_screening_session(payload.screening_id) if payload.screening_id else None
        if existing_session and not payload.upsert:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Screening '{payload.screening_id}' already exists.",
            )

        if existing_session:
            screening_id = existing_session["screening_id"]
            db.update_screening_status(screening_id, payload.status)
        else:
            try:
                created_session = db.create_screening_session(
                    screening_id=payload.screening_id,
                    patient_id=resolved_patient_id,
                    eye_side=payload.eye_side,
                    health_centre=payload.health_centre,
                    study_date=payload.study_date,
                    operator_id=payload.operator_id,
                    status=payload.status,
                )
            except ValueError as exc:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
            screening_id = created_session["screening_id"]

        image_id: int | None = None
        if payload.retinal_image is not None:
            existing_imgs = db.get_retinal_images(screening_id)
            if not existing_imgs:
                img = db.add_retinal_image(screening_id=screening_id, **payload.retinal_image.model_dump())
                image_id = img["image_id"]
            else:
                image_id = existing_imgs[0]["image_id"]

        if payload.quality_result is not None:
            db.upsert_image_quality(
                screening_id=screening_id,
                image_id=image_id,
                **payload.quality_result.model_dump(),
            )

        prediction_id: int | None = None
        if payload.ai_prediction is not None:
            pred = db.upsert_ai_prediction(screening_id=screening_id, **payload.ai_prediction.model_dump())
            prediction_id = pred["prediction_id"]

        if payload.explainability_result is not None:
            existing_exp = db.get_explainability_results(screening_id)
            if not existing_exp:
                db.add_explainability_result(
                    screening_id=screening_id,
                    prediction_id=prediction_id,
                    **payload.explainability_result.model_dump(),
                )

        if payload.doctor_review is not None:
            db.upsert_doctor_review(screening_id=screening_id, **payload.doctor_review.model_dump())

        if payload.referral is not None:
            existing_refs = db.list_referrals(screening_id=screening_id)
            ref_data = payload.referral.model_dump()
            if existing_refs and ref_data.get("referral_id") is None:
                ref_data["referral_id"] = existing_refs[0]["referral_id"]
            db.create_or_update_referral(
                screening_id=screening_id,
                patient_id=resolved_patient_id,
                **ref_data,
            )

        bundle = db.get_complete_screening_record(screening_id)
        return bundle  # type: ignore[return-value]

    @app.post("/api/screenings/{screening_id}/review")
    def submit_doctor_review(
        screening_id: str,
        payload: DoctorReviewRequest,
        request: Request,
    ) -> dict[str, Any]:
        db = get_db(request)
        if not db.get_screening_session(screening_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Screening '{screening_id}' not found.",
            )
        review = db.upsert_doctor_review(screening_id=screening_id, **payload.model_dump())
        bundle = db.get_complete_screening_record(screening_id)
        return {
            "doctor_review": review,
            "screening": bundle,
            "disclaimer": MEDICAL_DISCLAIMER,
        }

    @app.post("/api/screenings/{screening_id}/referral")
    def submit_referral(
        screening_id: str,
        payload: ReferralRequest,
        request: Request,
    ) -> dict[str, Any]:
        db = get_db(request)
        if not db.get_screening_session(screening_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Screening '{screening_id}' not found.",
            )
        ref_data = payload.model_dump()
        if ref_data.get("referral_id") is None:
            existing_refs = db.list_referrals(screening_id=screening_id)
            if existing_refs:
                ref_data["referral_id"] = existing_refs[0]["referral_id"]
        referral = db.create_or_update_referral(screening_id=screening_id, **ref_data)
        bundle = db.get_complete_screening_record(screening_id)
        return {"referral": referral, "screening": bundle}

    @app.post("/api/screenings/{screening_id}/report")
    def generate_report_endpoint(
        screening_id: str,
        request: Request,
        payload: ReportGenerateRequest | None = None,
    ) -> dict[str, Any]:
        db = get_db(request)
        lang = payload.language if payload else "en"
        if lang not in LANGUAGE_METADATA:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported language '{lang}'. Expected one of: en, gu, hi.",
            )
        if not db.get_screening_session(screening_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Screening '{screening_id}' not found.",
            )

        result = generate_screening_pdf(
            db_service=db,
            screening_id=screening_id,
            output_dir=request.app.state.report_dir,
            language=lang,
            persist_record=True,
        )
        return {
            **result,
            "download_url": f"/api/screenings/{screening_id}/report/pdf?language={lang}",
            "disclaimer": MEDICAL_DISCLAIMER,
        }

    @app.get("/api/screenings/{screening_id}/report/pdf")
    def download_report_pdf(
        screening_id: str,
        request: Request,
        language: str = Query("en", pattern="^(en|gu|hi)$"),
    ) -> FileResponse:
        db = get_db(request)
        if not db.get_screening_session(screening_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Screening '{screening_id}' not found.",
            )

        result = generate_screening_pdf(
            db_service=db,
            screening_id=screening_id,
            output_dir=request.app.state.report_dir,
            language=language,
            persist_record=True,
        )
        pdf_path = Path(result["report_path"])
        if not pdf_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Generated PDF file could not be located on disk.",
            )

        return FileResponse(
            path=str(pdf_path),
            media_type="application/pdf",
            filename=pdf_path.name,
            headers={"X-IRISaathi-Disclaimer": MEDICAL_DISCLAIMER},
        )

    return app


app = create_app()
