"""Screening session, quality check, review, referral, and PDF report endpoints."""

from __future__ import annotations

import json
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db, seed_demo_data
from app.core.models import ScreeningSession
from app.schemas.screening import (
    DemoSeedResponse,
    DoctorReviewIn,
    PatientIn,
    QualityCheckOut,
    ReferralUpdateIn,
    ScreeningCaseOut,
    SmsLogIn,
    screening_session_to_schema,
)
from app.services.quality_service import QualityService
from app.services.screening_service import ScreeningNotFoundError, ScreeningService
from app.utils.image_utils import (
    ImageValidationError,
    validate_and_inspect_image,
    validate_extension,
)

router = APIRouter(prefix="/screenings", tags=["screenings"])


def get_screening_service() -> ScreeningService:
    return ScreeningService(settings=get_settings())


@router.get("", response_model=List[ScreeningCaseOut])
def list_screenings(
    search: Optional[str] = Query(default=None),
    severity: Optional[int] = Query(default=None, ge=0, le=4),
    referral_status: Optional[str] = Query(default=None),
    eye: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    service: ScreeningService = Depends(get_screening_service),
) -> List[ScreeningCaseOut]:
    """List persisted screening sessions with optional filtering."""
    sessions = service.list_screenings(
        db=db,
        search=search,
        severity=severity,
        referral_status=referral_status,
        eye=eye,
    )
    return [screening_session_to_schema(item) for item in sessions]


@router.post("/seed-demo", response_model=DemoSeedResponse)
def seed_demo_screenings(db: Session = Depends(get_db)) -> DemoSeedResponse:
    """Seed synthetic demo patients and screening sessions if none exist."""
    seeded = seed_demo_data(db)
    total = db.query(ScreeningSession).count()
    msg = (
        f"Seeded {seeded} synthetic demo screening sessions."
        if seeded > 0
        else "Database already contains screening records; no duplicate demo rows inserted."
    )
    return DemoSeedResponse(seeded_count=seeded, total_screenings=total, message=msg)


@router.post("/quality-check", response_model=QualityCheckOut)
async def assess_upload_quality(image: UploadFile = File(...)) -> QualityCheckOut:
    """Perform real image-based quality checks on an uploaded retinal scan."""
    settings = get_settings()
    try:
        filename = image.filename or "retinal_scan.jpg"
        validate_extension(filename, settings.allowed_extensions)
        content = await image.read()
        rgb_img, _, _, _, _ = validate_and_inspect_image(
            content, settings.max_upload_size_bytes
        )
        try:
            quality = QualityService().assess_pil_image(rgb_img)
        finally:
            rgb_img.close()
    except ImageValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return QualityCheckOut(
        overall_score=quality["overall_score"],
        status=quality["status"],
        width_px=quality["width_px"],
        height_px=quality["height_px"],
        mean_brightness=quality["mean_brightness"],
        contrast_std=quality["contrast_std"],
        sharpness_score=quality["sharpness_score"],
        resolution_detail=quality["resolution_detail"],
        timestamp=quality["checked_at"],
        metrics=quality["metrics"],
    )


@router.post("", response_model=ScreeningCaseOut, status_code=status.HTTP_201_CREATED)
async def create_screening(
    patient_json: str = Form(...),
    eye: str = Form(default="OD"),
    health_centre: str = Form(default="Primary Health Centre (PHC)"),
    sample_id: Optional[str] = Form(default=None),
    screening_id: Optional[str] = Form(default=None),
    image: Optional[UploadFile] = File(default=None),
    db: Session = Depends(get_db),
    service: ScreeningService = Depends(get_screening_service),
) -> ScreeningCaseOut:
    """Create a screening session from patient JSON + optional retinal image upload."""
    try:
        raw_patient = json.loads(patient_json)
        patient_data = PatientIn(**raw_patient)
    except (ValueError, ValidationError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid patient_json payload: {exc}",
        ) from exc

    image_bytes: Optional[bytes] = None
    image_filename: Optional[str] = None
    image_content_type: Optional[str] = None
    if image is not None and image.filename:
        image_bytes = await image.read()
        image_filename = image.filename
        image_content_type = image.content_type

    try:
        session = service.create_screening_with_upload(
            db=db,
            patient_payload=patient_data.model_dump(),
            eye=eye,
            health_centre=health_centre,
            image_bytes=image_bytes,
            image_filename=image_filename,
            image_content_type=image_content_type,
            sample_id=sample_id,
            screening_id=screening_id,
        )
    except ImageValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return screening_session_to_schema(session)


@router.get("/{screening_id}", response_model=ScreeningCaseOut)
def get_screening(
    screening_id: str,
    db: Session = Depends(get_db),
    service: ScreeningService = Depends(get_screening_service),
) -> ScreeningCaseOut:
    """Retrieve a single screening session with quality, AI output, review, and referral."""
    try:
        session = service.get_screening(db, screening_id)
    except ScreeningNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return screening_session_to_schema(session)


@router.put("/{screening_id}/review", response_model=ScreeningCaseOut)
def submit_doctor_review(
    screening_id: str,
    payload: DoctorReviewIn,
    db: Session = Depends(get_db),
    service: ScreeningService = Depends(get_screening_service),
) -> ScreeningCaseOut:
    """Persist clinician verification, grade override/confirmation, and remarks."""
    try:
        session = service.submit_doctor_review(
            db=db,
            screening_id=screening_id,
            clinician_id=payload.clinician_id,
            clinician_name=payload.clinician_name,
            confirmed_grade=payload.confirmed_grade,
            action_pathway=payload.action_pathway,
            clinical_remarks=payload.clinical_remarks,
            is_signed=payload.is_signed,
        )
    except ScreeningNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return screening_session_to_schema(session)


@router.patch("/{screening_id}/referral", response_model=ScreeningCaseOut)
def update_screening_referral(
    screening_id: str,
    payload: ReferralUpdateIn,
    db: Session = Depends(get_db),
    service: ScreeningService = Depends(get_screening_service),
) -> ScreeningCaseOut:
    """Update referral status, priority, target facility, due date, or notes."""
    try:
        session = service.update_referral(
            db=db,
            screening_id=screening_id,
            priority=payload.priority,
            facility_name=payload.facility_name,
            status=payload.status,
            due_date=payload.due_date,
            notes=payload.notes,
        )
    except ScreeningNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return screening_session_to_schema(session)


@router.post("/{screening_id}/sms", response_model=ScreeningCaseOut)
def log_patient_sms(
    screening_id: str,
    payload: SmsLogIn,
    db: Session = Depends(get_db),
    service: ScreeningService = Depends(get_screening_service),
) -> ScreeningCaseOut:
    """Record a simulated follow-up SMS transmission in the screening referral log."""
    try:
        session = service.log_sms(
            db=db,
            screening_id=screening_id,
            reminder_id=payload.reminder_id,
            message_text=payload.message_text,
            language=payload.language,
        )
    except ScreeningNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return screening_session_to_schema(session)


@router.get("/{screening_id}/report/pdf")
def download_screening_pdf(
    screening_id: str,
    language: str = Query(default="en"),
    db: Session = Depends(get_db),
    service: ScreeningService = Depends(get_screening_service),
) -> FileResponse:
    """Generate and stream a downloadable ReportLab PDF clinical screening report."""
    try:
        pdf_path, file_name = service.generate_pdf_report(
            db=db, screening_id=screening_id, language=language
        )
    except ScreeningNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=file_name,
    )


@router.delete("/{screening_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_screening(
    screening_id: str,
    db: Session = Depends(get_db),
    service: ScreeningService = Depends(get_screening_service),
) -> None:
    """Delete a screening session and its associated child records."""
    try:
        service.delete_screening(db, screening_id)
    except ScreeningNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
