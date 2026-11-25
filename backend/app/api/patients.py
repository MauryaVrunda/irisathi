"""Patient management API endpoints."""

from __future__ import annotations

import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.models import PatientRecord
from app.schemas.screening import PatientIn, PatientOut

router = APIRouter(prefix="/patients", tags=["patients"])


def _patient_to_out(record: PatientRecord) -> PatientOut:
    symptoms = []
    try:
        symptoms = json.loads(record.symptoms_json or "[]")
    except ValueError:
        symptoms = []
    return PatientOut(
        id=record.id,
        name=record.name,
        age=record.age,
        gender=record.gender,  # type: ignore[arg-type]
        mobile=record.mobile,
        village=record.village,
        district=record.district,
        state=record.state,
        diabetes_status=record.diabetes_status,  # type: ignore[arg-type]
        diabetes_duration_years=record.diabetes_duration_years,
        hba1c=record.hba1c,
        blood_glucose=record.blood_glucose,
        previous_dr_history=record.previous_dr_history,  # type: ignore[arg-type]
        previous_ophth_visit=record.previous_ophth_visit,  # type: ignore[arg-type]
        symptoms=symptoms,
        eye=record.preferred_eye,  # type: ignore[arg-type]
        is_anonymous=record.is_anonymous,
        screening_count=len(record.screenings) if record.screenings is not None else 0,
    )


@router.get("", response_model=List[PatientOut])
def list_patients(
    search: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
) -> List[PatientOut]:
    """List registered patients with optional search across ID, name, village, or mobile."""
    records = (
        db.query(PatientRecord)
        .options(joinedload(PatientRecord.screenings))
        .order_by(PatientRecord.created_at.desc())
        .all()
    )
    term = (search or "").strip().lower()
    if term:
        records = [
            r
            for r in records
            if term in f"{r.id} {r.name} {r.village} {r.mobile}".lower()
        ]
    return [_patient_to_out(r) for r in records]


@router.post("", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
def upsert_patient(payload: PatientIn, db: Session = Depends(get_db)) -> PatientOut:
    """Create or update a patient profile."""
    existing = db.get(PatientRecord, payload.id)
    if existing is None:
        existing = PatientRecord(
            id=payload.id,
            name=payload.name,
            age=payload.age,
            gender=payload.gender,
            mobile=payload.mobile,
            village=payload.village,
            district=payload.district,
            state=payload.state,
            diabetes_status=payload.diabetes_status,
            diabetes_duration_years=payload.diabetes_duration_years,
            hba1c=payload.hba1c,
            blood_glucose=payload.blood_glucose,
            previous_dr_history=payload.previous_dr_history,
            previous_ophth_visit=payload.previous_ophth_visit,
            symptoms_json=json.dumps(payload.symptoms),
            preferred_eye=payload.eye,
            is_anonymous=payload.is_anonymous,
        )
        db.add(existing)
    else:
        existing.name = payload.name
        existing.age = payload.age
        existing.gender = payload.gender
        existing.mobile = payload.mobile
        existing.village = payload.village
        existing.district = payload.district
        existing.state = payload.state
        existing.diabetes_status = payload.diabetes_status
        existing.diabetes_duration_years = payload.diabetes_duration_years
        existing.hba1c = payload.hba1c
        existing.blood_glucose = payload.blood_glucose
        existing.previous_dr_history = payload.previous_dr_history
        existing.previous_ophth_visit = payload.previous_ophth_visit
        existing.symptoms_json = json.dumps(payload.symptoms)
        existing.preferred_eye = payload.eye
        existing.is_anonymous = payload.is_anonymous

    db.commit()
    db.refresh(existing)
    return _patient_to_out(existing)


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: str, db: Session = Depends(get_db)) -> PatientOut:
    """Retrieve a single patient record by ID."""
    record = (
        db.query(PatientRecord)
        .options(joinedload(PatientRecord.screenings))
        .filter(PatientRecord.id == patient_id)
        .first()
    )
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{patient_id}' not found.",
        )
    return _patient_to_out(record)
