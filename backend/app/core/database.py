"""SQLAlchemy engine, session factory, schema initialization, and demo seeder."""

from __future__ import annotations

import json
from typing import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import Settings, get_settings
from app.core.models import (
    AIPrediction,
    Base,
    DoctorReview,
    ImageQualityCheck,
    PatientRecord,
    ReferralRecord,
    RetinalImageAsset,
    ScreeningSession,
)

NON_DIAGNOSTIC_DISCLAIMER = (
    "NON-DIAGNOSTIC PROTOTYPE ASSISTIVE TRIAGE OUTPUT — NOT A CLINICAL DIAGNOSIS. "
    "AI predictions and Grad-CAM++ reference overlays are intended solely as "
    "decision-support cues for qualified healthcare professionals."
)


def create_db_engine(database_url: str) -> Engine:
    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    eng = create_engine(database_url, connect_args=connect_args, future=True)

    if database_url.startswith("sqlite"):
        @event.listens_for(eng, "connect")
        def _enable_sqlite_fk(dbapi_connection, _connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    return eng


_default_settings = get_settings()
engine = create_db_engine(_default_settings.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def init_db(target_engine: Engine | None = None) -> None:
    """Create all SQLite tables if they do not exist."""
    Base.metadata.create_all(bind=target_engine or engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_demo_data(db: Session, settings: Settings | None = None) -> int:
    """Insert synthetic demo patients and screening cases if database is empty.

    Returns the number of screening sessions created during this call.
    """
    existing_count = db.query(ScreeningSession).count()
    if existing_count > 0:
        return 0

    demo_cases = [
        {
            "patient": {
                "id": "PAT-2026-X1042",
                "name": "Rameshchandra B. (Synthetic Demo)",
                "age": 54,
                "gender": "male",
                "mobile": "9825471102",
                "village": "Chikhli Khurd",
                "district": "Navsari",
                "state": "Gujarat",
                "diabetes_status": "diagnosed",
                "diabetes_duration_years": 8,
                "hba1c": 7.2,
                "blood_glucose": 148.0,
                "previous_dr_history": "none",
                "previous_ophth_visit": "never",
                "symptoms": ["symptomNone"],
                "preferred_eye": "right",
                "is_anonymous": True,
            },
            "session": {
                "id": "SCR-2026-0042",
                "eye": "OD",
                "health_centre": "Chikhli Primary Health Centre (PHC)",
                "study_date": "2026-09-24 10:15 AM",
                "status": "reviewed",
                "is_demo": True,
            },
            "image": {
                "file_name": "fundus_od_20260924_1015.jpg",
                "file_path": "/src/assets/images/retina_normal_1790485949561.jpg",
                "public_url": "/src/assets/images/retina_normal_1790485949561.jpg",
                "content_type": "image/jpeg",
                "file_size_bytes": 1488978,
                "width_px": 1536,
                "height_px": 1536,
                "source_type": "sample",
            },
            "quality": {
                "overall_score": 94,
                "status": "passed",
                "width_px": 1536,
                "height_px": 1536,
                "mean_brightness": 118.4,
                "contrast_std": 54.2,
                "sharpness_score": 95.0,
                "resolution_detail": "1536 × 1536",
                "checked_at": "2026-09-24T10:15:22Z",
                "metrics": {
                    "fundusDetected": {
                        "id": "fundus",
                        "name": "Fundus Detected",
                        "passed": True,
                        "score": 96,
                        "description": "Uniform circular retinal field with crisp optic disc margins",
                    },
                    "focusSharpness": {
                        "id": "focus",
                        "name": "Focus & Sharpness",
                        "passed": True,
                        "score": 95,
                        "description": "Vessel bifurcations clearly defined; adequate edge variance",
                    },
                    "illumination": {
                        "id": "illumination",
                        "name": "Illumination",
                        "passed": True,
                        "score": 92,
                        "description": "Balanced non-mydriatic exposure across central arcade",
                    },
                    "fieldOfView": {
                        "id": "fov",
                        "name": "Field of View",
                        "passed": True,
                        "score": 94,
                        "description": "Standard posterior pole coverage with foveal center",
                    },
                    "resolution": {
                        "id": "resolution",
                        "name": "Resolution",
                        "passed": True,
                        "score": 93,
                        "description": "Native 1536×1536 matrix adequate for triage review",
                    },
                },
            },
            "ai": {
                "sample_id": "sample-1",
                "predicted_grade": 0,
                "predicted_grade_name": "Grade 0 — No Diabetic Retinopathy",
                "confidence": 94.6,
                "referral_status": "NON_REFERABLE",
                "referral_recommendation": "Routine annual tele-screening at primary health centre. Maintain glycemic control.",
                "probabilities": {"grade0": 94.6, "grade1": 3.8, "grade2": 1.2, "grade3": 0.3, "grade4": 0.1},
                "lesions": [],
                "lesion_counts": {"microaneurysms": 0, "hemorrhages": 0, "hardExudates": 0, "neovascularizations": 0, "total": 0},
                "quadrant_counts": {"superiorTemporal": 0, "superiorNasal": 0, "inferiorTemporal": 0, "inferiorNasal": 0},
                "clinical_rationale": "Synthetic prototype baseline: clear optic disc boundaries and intact macular zone with no flagged vascular lesions.",
                "anatomical_distribution": "No quadrant lesion clusters flagged in prototype screening pass.",
                "macular_risk_assessment": "low",
                "visual_threat_assessment": "Low triage priority based on assistive prototype screening.",
                "clinical_protocol": "Annual dilated or non-mydriatic fundus rescreening at nearest PHC.",
                "recommended_followup_weeks": 52,
                "processing_time_ms": 140,
                "model_identifier": "IRISaathi-Prototype-Triage-v1",
                "gradcam_path": "/src/assets/images/gradcam_normal_1790493692563.jpg",
            },
            "review": {
                "clinician_id": "USR-CL-01",
                "clinician_name": "Dr. Ananya Desai, MS (Ophthalmology)",
                "confirmed_grade": 0,
                "action_pathway": "routine_rescreen",
                "clinical_remarks": "Normal healthy retina on clinician review. Advised routine 12-month follow-up.",
                "is_signed": True,
                "reviewed_at": "2026-09-24 11:30 AM",
            },
            "referral": {
                "priority": "NON_REFERABLE",
                "facility_name": "Chikhli Primary Health Centre (PHC)",
                "status": "not_required",
                "due_date": "2027-09-24",
                "notes": "Routine annual rescreening advised.",
                "followups": [
                    {
                        "id": "fu-01",
                        "title": "Annual Retinal Tele-Screening",
                        "dueDate": "2027-09-24",
                        "interval": "12 Months",
                        "status": "pending",
                        "smsTemplateKey": "fuSmsTemplateRescreen",
                    },
                    {
                        "id": "fu-02",
                        "title": "Quarterly Fasting Glucose & HbA1c Check",
                        "dueDate": "2026-12-24",
                        "interval": "3 Months",
                        "status": "pending",
                        "smsTemplateKey": "fuSmsTemplateHba1c",
                    },
                ],
            },
        },
        {
            "patient": {
                "id": "PAT-2026-X8841",
                "name": "Kamlaben D. (Synthetic Demo)",
                "age": 61,
                "gender": "female",
                "mobile": "9879104523",
                "village": "Vansda Rural Block",
                "district": "Navsari",
                "state": "Gujarat",
                "diabetes_status": "diagnosed",
                "diabetes_duration_years": 12,
                "hba1c": 8.9,
                "blood_glucose": 215.0,
                "previous_dr_history": "mild",
                "previous_ophth_visit": "1_to_2y",
                "symptoms": ["symptomBlurred", "symptomFloaters"],
                "preferred_eye": "both",
                "is_anonymous": True,
            },
            "session": {
                "id": "SCR-2026-0043",
                "eye": "OS",
                "health_centre": "Vansda Community Health Centre (CHC)",
                "study_date": "2026-09-25 02:40 PM",
                "status": "analyzed",
                "is_demo": True,
            },
            "image": {
                "file_name": "fundus_os_20260925_1440.jpg",
                "file_path": "/src/assets/images/retina_moderate_npdr_1790485959942.jpg",
                "public_url": "/src/assets/images/retina_moderate_npdr_1790485959942.jpg",
                "content_type": "image/jpeg",
                "file_size_bytes": 1656750,
                "width_px": 1536,
                "height_px": 1536,
                "source_type": "sample",
            },
            "quality": {
                "overall_score": 91,
                "status": "passed",
                "width_px": 1536,
                "height_px": 1536,
                "mean_brightness": 112.0,
                "contrast_std": 49.8,
                "sharpness_score": 90.0,
                "resolution_detail": "1536 × 1536",
                "checked_at": "2026-09-25T14:40:10Z",
                "metrics": {
                    "fundusDetected": {
                        "id": "fundus",
                        "name": "Fundus Detected",
                        "passed": True,
                        "score": 93,
                        "description": "Circular retinal fundus anatomy captured clearly",
                    },
                    "focusSharpness": {
                        "id": "focus",
                        "name": "Focus & Sharpness",
                        "passed": True,
                        "score": 90,
                        "description": "Retinal vessel branches clearly resolved",
                    },
                    "illumination": {
                        "id": "illumination",
                        "name": "Illumination",
                        "passed": True,
                        "score": 89,
                        "description": "Balanced contrast across macular field",
                    },
                    "fieldOfView": {
                        "id": "fov",
                        "name": "Field of View",
                        "passed": True,
                        "score": 92,
                        "description": "Full vascular arcades and macula within frame",
                    },
                    "resolution": {
                        "id": "resolution",
                        "name": "Resolution",
                        "passed": True,
                        "score": 91,
                        "description": "High spatial resolution adequate for triage review",
                    },
                },
            },
            "ai": {
                "sample_id": "sample-2",
                "predicted_grade": 2,
                "predicted_grade_name": "Grade 2 — Moderate Non-Proliferative DR (Moderate NPDR)",
                "confidence": 68.4,
                "referral_status": "REFERABLE_DR",
                "referral_recommendation": "Ophthalmology referral recommended within 4 to 6 weeks. Prioritized for tele-consultation.",
                "probabilities": {"grade0": 4.2, "grade1": 12.1, "grade2": 68.4, "grade3": 11.8, "grade4": 3.5},
                "lesions": [
                    {"id": 1, "pathology": "microaneurysm", "locationQuadrant": "Superior Temporal", "x": 58.2, "y": 34.5, "confidence": 91.2},
                    {"id": 2, "pathology": "hemorrhage", "locationQuadrant": "Superior Temporal", "x": 66.4, "y": 41.2, "confidence": 89.0},
                    {"id": 3, "pathology": "hard_exudate", "locationQuadrant": "Superior Temporal", "x": 51.5, "y": 44.0, "confidence": 93.6},
                    {"id": 4, "pathology": "hard_exudate", "locationQuadrant": "Inferior Temporal", "x": 49.8, "y": 56.2, "confidence": 90.7},
                ],
                "lesion_counts": {"microaneurysms": 18, "hemorrhages": 11, "hardExudates": 9, "neovascularizations": 0, "total": 38},
                "quadrant_counts": {"superiorTemporal": 19, "superiorNasal": 5, "inferiorTemporal": 12, "inferiorNasal": 2},
                "clinical_rationale": "Synthetic prototype triage flags temporal vascular changes and exudate-like hotspots for specialist confirmation.",
                "anatomical_distribution": "Primary hotspot cluster in Superior Temporal and Inferior Temporal quadrants.",
                "macular_risk_assessment": "moderate",
                "visual_threat_assessment": "Potential macular involvement flagged for specialist slit-lamp/OCT confirmation.",
                "clinical_protocol": "Dilated fundus examination and macular evaluation at District Eye Hospital.",
                "recommended_followup_weeks": 6,
                "processing_time_ms": 180,
                "model_identifier": "IRISaathi-Prototype-Triage-v1",
                "gradcam_path": "/src/assets/images/gradcam_moderate_npdr_1790493664120.jpg",
            },
            "review": None,
            "referral": {
                "priority": "REFERABLE_DR",
                "facility_name": "Navsari District Civil Hospital - Tele-Retina Unit",
                "status": "pending",
                "due_date": "2026-10-25",
                "notes": "Pending clinician review and referral scheduling.",
                "followups": [
                    {
                        "id": "fu-21",
                        "title": "District Hospital Ophthalmology Referral",
                        "dueDate": "2026-10-25",
                        "interval": "4 Weeks",
                        "status": "pending",
                        "smsTemplateKey": "fuSmsTemplateReferral",
                    },
                    {
                        "id": "fu-22",
                        "title": "Fasting Blood Sugar & Blood Pressure Monitoring",
                        "dueDate": "2026-10-02",
                        "interval": "1 Week",
                        "status": "pending",
                        "smsTemplateKey": "fuSmsTemplateGlucose",
                    },
                ],
            },
        },
        {
            "patient": {
                "id": "PAT-2026-X1933",
                "name": "Harishbhai M. (Synthetic Demo)",
                "age": 67,
                "gender": "male",
                "mobile": "9712059341",
                "village": "Bilimora Town Outskirts",
                "district": "Navsari",
                "state": "Gujarat",
                "diabetes_status": "diagnosed",
                "diabetes_duration_years": 18,
                "hba1c": 10.4,
                "blood_glucose": 280.0,
                "previous_dr_history": "moderate",
                "previous_ophth_visit": "more_than_2y",
                "symptoms": ["symptomBlurred", "symptomDarkSpots", "symptomFlashes"],
                "preferred_eye": "right",
                "is_anonymous": True,
            },
            "session": {
                "id": "SCR-2026-0044",
                "eye": "OD",
                "health_centre": "Bilimora Sub-District Hospital",
                "study_date": "2026-09-26 09:30 AM",
                "status": "analyzed",
                "is_demo": True,
            },
            "image": {
                "file_name": "fundus_od_20260926_0930.jpg",
                "file_path": "/src/assets/images/retina_severe_pdr_1790485976558.jpg",
                "public_url": "/src/assets/images/retina_severe_pdr_1790485976558.jpg",
                "content_type": "image/jpeg",
                "file_size_bytes": 1719664,
                "width_px": 1536,
                "height_px": 1536,
                "source_type": "sample",
            },
            "quality": {
                "overall_score": 89,
                "status": "passed",
                "width_px": 1536,
                "height_px": 1536,
                "mean_brightness": 105.2,
                "contrast_std": 46.1,
                "sharpness_score": 88.0,
                "resolution_detail": "1536 × 1536",
                "checked_at": "2026-09-26T09:30:15Z",
                "metrics": {
                    "fundusDetected": {
                        "id": "fundus",
                        "name": "Fundus Detected",
                        "passed": True,
                        "score": 91,
                        "description": "Optic nerve head and vascular arches detected",
                    },
                    "focusSharpness": {
                        "id": "focus",
                        "name": "Focus & Sharpness",
                        "passed": True,
                        "score": 88,
                        "description": "Major vascular features resolved for triage",
                    },
                    "illumination": {
                        "id": "illumination",
                        "name": "Illumination",
                        "passed": True,
                        "score": 87,
                        "description": "Adequate contrast balance across retinal field",
                    },
                    "fieldOfView": {
                        "id": "fov",
                        "name": "Field of View",
                        "passed": True,
                        "score": 90,
                        "description": "Optic disc, arcades, and macula encompassed",
                    },
                    "resolution": {
                        "id": "resolution",
                        "name": "Resolution",
                        "passed": True,
                        "score": 90,
                        "description": "Sufficient pixel density for triage inspection",
                    },
                },
            },
            "ai": {
                "sample_id": "sample-3",
                "predicted_grade": 4,
                "predicted_grade_name": "Grade 4 — Proliferative Diabetic Retinopathy (PDR)",
                "confidence": 74.2,
                "referral_status": "URGENT_REFERRAL",
                "referral_recommendation": "URGENT Vitreoretinal Specialist referral recommended within 1-2 weeks for clinical evaluation.",
                "probabilities": {"grade0": 0.8, "grade1": 1.5, "grade2": 7.9, "grade3": 15.6, "grade4": 74.2},
                "lesions": [
                    {"id": 1, "pathology": "neovascularization", "locationQuadrant": "Superior Nasal", "x": 42.1, "y": 38.5, "confidence": 94.8},
                    {"id": 2, "pathology": "neovascularization", "locationQuadrant": "Superior Temporal", "x": 48.6, "y": 32.1, "confidence": 92.4},
                    {"id": 3, "pathology": "hemorrhage", "locationQuadrant": "Superior Temporal", "x": 62.1, "y": 30.5, "confidence": 95.1},
                    {"id": 4, "pathology": "hemorrhage", "locationQuadrant": "Inferior Temporal", "x": 67.4, "y": 64.2, "confidence": 93.7},
                ],
                "lesion_counts": {"microaneurysms": 42, "hemorrhages": 34, "hardExudates": 26, "neovascularizations": 6, "total": 108},
                "quadrant_counts": {"superiorTemporal": 38, "superiorNasal": 26, "inferiorTemporal": 29, "inferiorNasal": 15},
                "clinical_rationale": "Synthetic prototype triage highlights multi-quadrant vascular anomalies requiring urgent ophthalmologist verification.",
                "anatomical_distribution": "Pan-retinal distribution flagged across all four quadrants.",
                "macular_risk_assessment": "high",
                "visual_threat_assessment": "High triage urgency; prompt specialist confirmation advised.",
                "clinical_protocol": "Urgent tertiary vitreoretinal specialist evaluation.",
                "recommended_followup_weeks": 2,
                "processing_time_ms": 195,
                "model_identifier": "IRISaathi-Prototype-Triage-v1",
                "gradcam_path": "/src/assets/images/gradcam_severe_pdr_1790493677922.jpg",
            },
            "review": None,
            "referral": {
                "priority": "URGENT_REFERRAL",
                "facility_name": "Surat Tertiary Vitreoretinal Referral Centre",
                "status": "pending",
                "due_date": "2026-10-03",
                "notes": "Urgent priority queue.",
                "followups": [
                    {
                        "id": "fu-31",
                        "title": "Urgent Vitreoretinal Specialist Consult (Tertiary Hospital)",
                        "dueDate": "2026-10-03",
                        "interval": "1 Week",
                        "status": "pending",
                        "smsTemplateKey": "fuSmsTemplateReferral",
                    },
                    {
                        "id": "fu-32",
                        "title": "Emergency Medical & Glycemic Stabilization",
                        "dueDate": "2026-09-28",
                        "interval": "48 Hours",
                        "status": "pending",
                        "smsTemplateKey": "fuSmsTemplateGlucose",
                    },
                ],
            },
        },
    ]

    created = 0
    for item in demo_cases:
        p = item["patient"]
        patient = db.get(PatientRecord, p["id"])
        if not patient:
            patient = PatientRecord(
                id=p["id"],
                name=p["name"],
                age=p["age"],
                gender=p["gender"],
                mobile=p["mobile"],
                village=p["village"],
                district=p["district"],
                state=p["state"],
                diabetes_status=p["diabetes_status"],
                diabetes_duration_years=p["diabetes_duration_years"],
                hba1c=p["hba1c"],
                blood_glucose=p["blood_glucose"],
                previous_dr_history=p["previous_dr_history"],
                previous_ophth_visit=p["previous_ophth_visit"],
                symptoms_json=json.dumps(p["symptoms"]),
                preferred_eye=p["preferred_eye"],
                is_anonymous=p["is_anonymous"],
            )
            db.add(patient)

        s = item["session"]
        session = ScreeningSession(
            id=s["id"],
            patient_id=p["id"],
            eye=s["eye"],
            health_centre=s["health_centre"],
            study_date=s["study_date"],
            status=s["status"],
            is_demo=s["is_demo"],
        )
        db.add(session)

        img = item["image"]
        db.add(
            RetinalImageAsset(
                screening_id=s["id"],
                file_name=img["file_name"],
                file_path=img["file_path"],
                public_url=img["public_url"],
                content_type=img["content_type"],
                file_size_bytes=img["file_size_bytes"],
                width_px=img["width_px"],
                height_px=img["height_px"],
                source_type=img["source_type"],
            )
        )

        q = item["quality"]
        db.add(
            ImageQualityCheck(
                screening_id=s["id"],
                overall_score=q["overall_score"],
                status=q["status"],
                width_px=q["width_px"],
                height_px=q["height_px"],
                mean_brightness=q["mean_brightness"],
                contrast_std=q["contrast_std"],
                sharpness_score=q["sharpness_score"],
                metrics_json=json.dumps(q["metrics"]),
                resolution_detail=q["resolution_detail"],
                checked_at=q["checked_at"],
            )
        )

        ai = item["ai"]
        db.add(
            AIPrediction(
                screening_id=s["id"],
                is_prototype_output=True,
                is_demo=True,
                sample_id=ai["sample_id"],
                predicted_grade=ai["predicted_grade"],
                predicted_grade_name=ai["predicted_grade_name"],
                confidence=ai["confidence"],
                referral_status=ai["referral_status"],
                referral_recommendation=ai["referral_recommendation"],
                probabilities_json=json.dumps(ai["probabilities"]),
                lesions_json=json.dumps(ai["lesions"]),
                lesion_counts_json=json.dumps(ai["lesion_counts"]),
                quadrant_counts_json=json.dumps(ai["quadrant_counts"]),
                clinical_rationale=ai["clinical_rationale"],
                anatomical_distribution=ai["anatomical_distribution"],
                macular_risk_assessment=ai["macular_risk_assessment"],
                visual_threat_assessment=ai["visual_threat_assessment"],
                clinical_protocol=ai["clinical_protocol"],
                recommended_followup_weeks=ai["recommended_followup_weeks"],
                processing_time_ms=ai["processing_time_ms"],
                model_identifier=ai["model_identifier"],
                disclaimer=NON_DIAGNOSTIC_DISCLAIMER,
                gradcam_path=ai["gradcam_path"],
                gradcam_method="Grad-CAM++ Reference Overlay",
            )
        )

        rev = item["review"]
        if rev:
            db.add(
                DoctorReview(
                    screening_id=s["id"],
                    clinician_id=rev["clinician_id"],
                    clinician_name=rev["clinician_name"],
                    confirmed_grade=rev["confirmed_grade"],
                    action_pathway=rev["action_pathway"],
                    clinical_remarks=rev["clinical_remarks"],
                    is_signed=rev["is_signed"],
                    reviewed_at=rev["reviewed_at"],
                )
            )

        ref = item["referral"]
        db.add(
            ReferralRecord(
                screening_id=s["id"],
                priority=ref["priority"],
                facility_name=ref["facility_name"],
                status=ref["status"],
                due_date=ref["due_date"],
                notes=ref["notes"],
                followups_json=json.dumps(ref["followups"]),
                sms_history_json=json.dumps([]),
            )
        )
        created += 1

    db.commit()
    return created
