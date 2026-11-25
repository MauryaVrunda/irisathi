"""Screening orchestration service and ReportLab PDF clinical report generator."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image as RLImage,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from sqlalchemy.orm import Session, joinedload

from app.core.config import Settings, get_settings
from app.core.database import NON_DIAGNOSTIC_DISCLAIMER
from app.core.models import (
    AIPrediction,
    DoctorReview,
    GeneratedReport,
    ImageQualityCheck,
    PatientRecord,
    ReferralRecord,
    RetinalImageAsset,
    ScreeningSession,
)
from app.services.image_service import ImageService
from app.services.model_service import ICDR_GRADE_LABELS, ModelService, get_model_service
from app.services.quality_service import QualityService

PROMINENT_MEDICAL_DISCLAIMER = (
    "MEDICAL DISCLAIMER (PROTOTYPE DECISION-SUPPORT TOOL): "
    "IRISaathi AI outputs, severity scores, and Grad-CAM++ reference overlays are "
    "non-diagnostic assistive triage aids and MUST NOT be used as a standalone clinical diagnosis. "
    "Final diagnostic grading, treatment, and referral decisions must be made exclusively by a "
    "qualified ophthalmologist or licensed medical practitioner."
)

ACTION_PATHWAY_LABELS = {
    "routine_rescreen": "Routine Annual Tele-Rescreening",
    "primary_care": "Primary Care Glycemic & BP Management",
    "ophthalmologist_referral": "District Hospital Ophthalmology Referral",
    "urgent_retina_referral": "Urgent Tertiary Vitreoretinal Specialist Referral",
}


class ScreeningNotFoundError(LookupError):
    """Raised when a screening session ID does not exist."""


class ScreeningService:
    """Coordinates patient records, image quality checks, AI triage, reviews, referrals, and PDFs."""

    def __init__(
        self,
        settings: Optional[Settings] = None,
        image_service: Optional[ImageService] = None,
        quality_service: Optional[QualityService] = None,
        model_service: Optional[ModelService] = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.image_service = image_service or ImageService(self.settings)
        self.quality_service = quality_service or QualityService()
        self.model_service = model_service or get_model_service()

    def _upsert_patient(self, db: Session, payload: Dict[str, Any]) -> PatientRecord:
        patient_id = payload["id"].strip()
        patient = db.get(PatientRecord, patient_id)
        symptoms_json = json.dumps(payload.get("symptoms", []))

        if patient is None:
            patient = PatientRecord(
                id=patient_id,
                name=payload.get("name") or f"Anonymous Intake ({patient_id})",
                age=int(payload["age"]),
                gender=payload["gender"],
                mobile=payload["mobile"],
                village=payload["village"],
                district=payload.get("district", "Navsari"),
                state=payload.get("state", "Gujarat"),
                diabetes_status=payload.get("diabetes_status", "diagnosed"),
                diabetes_duration_years=int(payload.get("diabetes_duration_years", 0)),
                hba1c=payload.get("hba1c"),
                blood_glucose=payload.get("blood_glucose"),
                previous_dr_history=payload.get("previous_dr_history", "none"),
                previous_ophth_visit=payload.get("previous_ophth_visit", "never"),
                symptoms_json=symptoms_json,
                preferred_eye=payload.get("eye", "right"),
                is_anonymous=bool(payload.get("is_anonymous", True)),
            )
            db.add(patient)
        else:
            patient.name = payload.get("name") or patient.name
            patient.age = int(payload["age"])
            patient.gender = payload["gender"]
            patient.mobile = payload["mobile"]
            patient.village = payload["village"]
            patient.district = payload.get("district", patient.district)
            patient.state = payload.get("state", patient.state)
            patient.diabetes_status = payload.get("diabetes_status", patient.diabetes_status)
            patient.diabetes_duration_years = int(
                payload.get("diabetes_duration_years", patient.diabetes_duration_years)
            )
            patient.hba1c = payload.get("hba1c", patient.hba1c)
            patient.blood_glucose = payload.get("blood_glucose", patient.blood_glucose)
            patient.previous_dr_history = payload.get(
                "previous_dr_history", patient.previous_dr_history
            )
            patient.previous_ophth_visit = payload.get(
                "previous_ophth_visit", patient.previous_ophth_visit
            )
            patient.symptoms_json = symptoms_json
            patient.preferred_eye = payload.get("eye", patient.preferred_eye)
            patient.is_anonymous = bool(payload.get("is_anonymous", patient.is_anonymous))

        db.flush()
        return patient

    def create_screening_with_upload(
        self,
        db: Session,
        patient_payload: Dict[str, Any],
        eye: str = "OD",
        health_centre: str = "Primary Health Centre (PHC)",
        image_bytes: Optional[bytes] = None,
        image_filename: Optional[str] = None,
        image_content_type: Optional[str] = None,
        sample_id: Optional[str] = None,
        screening_id: Optional[str] = None,
    ) -> ScreeningSession:
        """Create a screening session, optionally save uploaded image, run quality + prototype triage."""
        patient = self._upsert_patient(db, patient_payload)

        scr_id = screening_id or f"SCR-2026-{uuid.uuid4().hex[:6].upper()}"
        normalized_eye = "OS" if eye.upper() in {"OS", "LEFT"} else "OD"
        now_display = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

        session = ScreeningSession(
            id=scr_id,
            patient_id=patient.id,
            eye=normalized_eye,
            health_centre=health_centre or "Primary Health Centre (PHC)",
            study_date=now_display,
            status="created",
            is_demo=(image_bytes is None),
        )
        db.add(session)
        db.flush()

        local_image_path: Optional[Path] = None

        if image_bytes is not None and image_filename:
            stored = self.image_service.save_upload(
                content=image_bytes,
                original_filename=image_filename,
                screening_id=scr_id,
                content_type=image_content_type,
            )
            db.add(
                RetinalImageAsset(
                    screening_id=scr_id,
                    file_name=stored.file_name,
                    file_path=stored.file_path,
                    public_url=stored.public_url,
                    content_type=stored.content_type,
                    file_size_bytes=stored.file_size_bytes,
                    width_px=stored.width_px,
                    height_px=stored.height_px,
                    sha256_hash=stored.sha256_hash,
                    source_type="upload",
                )
            )
            local_image_path = self.image_service.resolve_local_image(stored.file_path)
        else:
            sample_map = {
                "sample-1": (
                    "retina_normal_1790485949561.jpg",
                    "/src/assets/images/retina_normal_1790485949561.jpg",
                    "/src/assets/images/gradcam_normal_1790493692563.jpg",
                ),
                "sample-3": (
                    "retina_severe_pdr_1790485976558.jpg",
                    "/src/assets/images/retina_severe_pdr_1790485976558.jpg",
                    "/src/assets/images/gradcam_severe_pdr_1790493677922.jpg",
                ),
            }
            fname, asset_path, _ = sample_map.get(
                sample_id or "sample-2",
                (
                    "retina_moderate_npdr_1790485959942.jpg",
                    "/src/assets/images/retina_moderate_npdr_1790485959942.jpg",
                    "/src/assets/images/gradcam_moderate_npdr_1790493664120.jpg",
                ),
            )
            resolved = self.image_service.resolve_local_image(asset_path)
            local_image_path = resolved
            db.add(
                RetinalImageAsset(
                    screening_id=scr_id,
                    file_name=fname,
                    file_path=asset_path,
                    public_url=asset_path,
                    content_type="image/jpeg",
                    file_size_bytes=resolved.stat().st_size if resolved else 0,
                    width_px=1536,
                    height_px=1536,
                    source_type="sample",
                )
            )

        # Quality assessment
        if local_image_path and local_image_path.is_file():
            quality = self.quality_service.assess_image_file(local_image_path)
        else:
            quality = {
                "overall_score": 88,
                "status": "review",
                "width_px": 1536,
                "height_px": 1536,
                "mean_brightness": 110.0,
                "contrast_std": 45.0,
                "sharpness_score": 12.0,
                "resolution_detail": "1536 × 1536",
                "checked_at": datetime.now(timezone.utc).isoformat(),
                "metrics": {},
            }

        db.add(
            ImageQualityCheck(
                screening_id=scr_id,
                overall_score=quality["overall_score"],
                status=quality["status"],
                width_px=quality["width_px"],
                height_px=quality["height_px"],
                mean_brightness=quality["mean_brightness"],
                contrast_std=quality["contrast_std"],
                sharpness_score=quality["sharpness_score"],
                metrics_json=json.dumps(quality["metrics"]),
                resolution_detail=quality["resolution_detail"],
                checked_at=quality["checked_at"],
            )
        )

        # Assistive AI prototype inference
        ai = self.model_service.run_triage_inference(
            image_path=local_image_path,
            quality_summary=quality,
            screening_id=scr_id,
            eye=normalized_eye,
            patient_hba1c=patient.hba1c,
            diabetes_duration_years=patient.diabetes_duration_years,
        )

        # Preserve sample gradcam asset path when running on bundled sample images
        gradcam_path = ai["gradcam_path"]
        if image_bytes is None and sample_id in {"sample-1", "sample-2", "sample-3"}:
            gradcam_map = {
                "sample-1": "/src/assets/images/gradcam_normal_1790493692563.jpg",
                "sample-2": "/src/assets/images/gradcam_moderate_npdr_1790493664120.jpg",
                "sample-3": "/src/assets/images/gradcam_severe_pdr_1790493677922.jpg",
            }
            gradcam_path = gradcam_map[sample_id]

        db.add(
            AIPrediction(
                screening_id=scr_id,
                is_prototype_output=True,
                is_demo=ai["is_demo"],
                sample_id=sample_id,
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
                gradcam_path=gradcam_path,
                gradcam_method=ai["gradcam_method"],
            )
        )

        due_dt = (
            datetime.now(timezone.utc) + timedelta(weeks=ai["recommended_followup_weeks"])
        ).strftime("%Y-%m-%d")
        followups = [
            {
                "id": f"fu-{uuid.uuid4().hex[:6]}",
                "title": (
                    "Specialist Ophthalmology Referral"
                    if ai["predicted_grade"] >= 2
                    else "Routine Retinal Re-Screening"
                ),
                "dueDate": due_dt,
                "interval": f"{ai['recommended_followup_weeks']} Weeks",
                "status": "pending",
                "smsTemplateKey": (
                    "fuSmsTemplateReferral"
                    if ai["predicted_grade"] >= 2
                    else "fuSmsTemplateRescreen"
                ),
            }
        ]
        db.add(
            ReferralRecord(
                screening_id=scr_id,
                priority=ai["referral_status"],
                facility_name="Navsari District Civil Hospital - Tele-Retina Unit",
                status="pending" if ai["predicted_grade"] >= 2 else "not_required",
                due_date=due_dt,
                notes="Auto-created assistive triage referral record.",
                followups_json=json.dumps(followups),
                sms_history_json=json.dumps([]),
            )
        )

        session.status = "analyzed"
        db.commit()
        return self.get_screening(db, scr_id)

    def get_screening(self, db: Session, screening_id: str) -> ScreeningSession:
        session = (
            db.query(ScreeningSession)
            .execution_options(populate_existing=True)
            .options(
                joinedload(ScreeningSession.patient),
                joinedload(ScreeningSession.image_asset),
                joinedload(ScreeningSession.quality_check),
                joinedload(ScreeningSession.ai_prediction),
                joinedload(ScreeningSession.doctor_review),
                joinedload(ScreeningSession.referral),
                joinedload(ScreeningSession.reports),
            )
            .filter(ScreeningSession.id == screening_id)
            .first()
        )
        if not session:
            raise ScreeningNotFoundError(f"Screening session '{screening_id}' not found.")
        return session

    def list_screenings(
        self,
        db: Session,
        search: Optional[str] = None,
        severity: Optional[int] = None,
        referral_status: Optional[str] = None,
        eye: Optional[str] = None,
        limit: int = 100,
    ) -> List[ScreeningSession]:
        query = (
            db.query(ScreeningSession)
            .execution_options(populate_existing=True)
            .options(
                joinedload(ScreeningSession.patient),
                joinedload(ScreeningSession.image_asset),
                joinedload(ScreeningSession.quality_check),
                joinedload(ScreeningSession.ai_prediction),
                joinedload(ScreeningSession.doctor_review),
                joinedload(ScreeningSession.referral),
                joinedload(ScreeningSession.reports),
            )
            .order_by(ScreeningSession.created_at.desc())
        )
        sessions = query.limit(limit).all()

        results: List[ScreeningSession] = []
        term = (search or "").strip().lower()
        for item in sessions:
            if term:
                haystack = " ".join(
                    [
                        item.id,
                        item.patient.id,
                        item.patient.name,
                        item.patient.village,
                        item.patient.mobile,
                    ]
                ).lower()
                if term not in haystack:
                    continue
            if severity is not None:
                if not item.ai_prediction or item.ai_prediction.predicted_grade != severity:
                    continue
            if referral_status and referral_status != "all":
                grade = item.ai_prediction.predicted_grade if item.ai_prediction else 0
                if referral_status == "referable" and grade < 2:
                    continue
                if referral_status == "non_referable" and grade >= 2:
                    continue
                if referral_status in {"NON_REFERABLE", "REFERABLE_DR", "URGENT_REFERRAL"}:
                    if not item.ai_prediction or item.ai_prediction.referral_status != referral_status:
                        continue
            if eye and eye.lower() != "all":
                if item.eye.lower() != eye.lower():
                    continue
            results.append(item)

        return results

    def submit_doctor_review(
        self,
        db: Session,
        screening_id: str,
        clinician_id: str,
        clinician_name: str,
        confirmed_grade: int,
        action_pathway: str,
        clinical_remarks: str,
        is_signed: bool = True,
    ) -> ScreeningSession:
        session = self.get_screening(db, screening_id)
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

        if session.doctor_review is None:
            review = DoctorReview(
                screening_id=screening_id,
                clinician_id=clinician_id,
                clinician_name=clinician_name,
                confirmed_grade=confirmed_grade,
                action_pathway=action_pathway,
                clinical_remarks=clinical_remarks,
                is_signed=is_signed,
                reviewed_at=now_str,
            )
            session.doctor_review = review
            db.add(review)
        else:
            session.doctor_review.clinician_id = clinician_id
            session.doctor_review.clinician_name = clinician_name
            session.doctor_review.confirmed_grade = confirmed_grade
            session.doctor_review.action_pathway = action_pathway
            session.doctor_review.clinical_remarks = clinical_remarks
            session.doctor_review.is_signed = is_signed
            session.doctor_review.reviewed_at = now_str

        if session.referral:
            if action_pathway == "urgent_retina_referral":
                session.referral.priority = "URGENT_REFERRAL"
                session.referral.status = "scheduled"
            elif action_pathway == "ophthalmologist_referral":
                session.referral.priority = "REFERABLE_DR"
                session.referral.status = "scheduled"
            elif action_pathway == "routine_rescreen":
                session.referral.priority = "NON_REFERABLE"
                session.referral.status = "not_required"

        session.status = "reviewed"
        db.commit()
        return self.get_screening(db, screening_id)

    def update_referral(
        self,
        db: Session,
        screening_id: str,
        priority: Optional[str] = None,
        facility_name: Optional[str] = None,
        status: Optional[str] = None,
        due_date: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> ScreeningSession:
        session = self.get_screening(db, screening_id)
        if session.referral is None:
            session.referral = ReferralRecord(screening_id=screening_id)
            db.add(session.referral)

        if priority is not None:
            session.referral.priority = priority
        if facility_name is not None:
            session.referral.facility_name = facility_name
        if status is not None:
            session.referral.status = status
        if due_date is not None:
            session.referral.due_date = due_date
        if notes is not None:
            session.referral.notes = notes

        db.commit()
        return self.get_screening(db, screening_id)

    def log_sms(
        self,
        db: Session,
        screening_id: str,
        reminder_id: Optional[str],
        message_text: str,
        language: str,
    ) -> ScreeningSession:
        session = self.get_screening(db, screening_id)
        if session.referral is None:
            session.referral = ReferralRecord(screening_id=screening_id)
            db.add(session.referral)
            db.flush()

        history = json.loads(session.referral.sms_history_json or "[]")
        history.insert(
            0,
            {
                "id": f"SMS-{uuid.uuid4().hex[:8].upper()}",
                "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
                "mobile": session.patient.mobile,
                "messageText": message_text,
                "language": language,
                "status": "simulated",
            },
        )
        session.referral.sms_history_json = json.dumps(history)

        followups = json.loads(session.referral.followups_json or "[]")
        if reminder_id:
            for item in followups:
                if item.get("id") == reminder_id:
                    item["status"] = "sent"
                    item["lastSentAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        session.referral.followups_json = json.dumps(followups)

        db.commit()
        return self.get_screening(db, screening_id)

    def delete_screening(self, db: Session, screening_id: str) -> None:
        session = self.get_screening(db, screening_id)
        db.delete(session)
        db.commit()

    def generate_pdf_report(
        self,
        db: Session,
        screening_id: str,
        language: str = "en",
    ) -> Tuple[Path, str]:
        """Generate a ReportLab clinical PDF separating AI output from doctor review."""
        session = self.get_screening(db, screening_id)
        self.settings.report_dir.mkdir(parents=True, exist_ok=True)

        report_code = f"RPT-{session.id}-{uuid.uuid4().hex[:6].upper()}"
        file_name = f"{session.id}_clinical_report.pdf"
        pdf_path = (self.settings.report_dir / file_name).resolve()

        self._render_reportlab_pdf(session, pdf_path, report_code)

        db.add(
            GeneratedReport(
                screening_id=session.id,
                report_code=report_code,
                file_name=file_name,
                file_path=f"app/storage/reports/{file_name}",
                language=language,
                disclaimer_included=True,
            )
        )
        db.commit()
        return pdf_path, file_name

    def _render_reportlab_pdf(
        self,
        session: ScreeningSession,
        pdf_path: Path,
        report_code: str,
    ) -> None:
        """Render structured ReportLab PDF with separate AI and Doctor sections + disclaimer."""
        doc = SimpleDocTemplate(
            str(pdf_path),
            pagesize=A4,
            leftMargin=16 * mm,
            rightMargin=16 * mm,
            topMargin=14 * mm,
            bottomMargin=14 * mm,
            title=f"IRISaathi Screening Report - {session.id}",
        )
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "IrisTitle",
            parent=styles["Heading1"],
            fontSize=16,
            textColor=colors.HexColor("#0f172a"),
            spaceAfter=4,
        )
        section_style = ParagraphStyle(
            "IrisSection",
            parent=styles["Heading2"],
            fontSize=11,
            textColor=colors.HexColor("#1e3a8a"),
            spaceBefore=8,
            spaceAfter=4,
        )
        body_style = ParagraphStyle(
            "IrisBody",
            parent=styles["Normal"],
            fontSize=9,
            leading=12.5,
            textColor=colors.HexColor("#1e293b"),
        )
        disclaimer_style = ParagraphStyle(
            "IrisDisclaimer",
            parent=styles["Normal"],
            fontSize=8.5,
            leading=11.5,
            textColor=colors.HexColor("#7f1d1d"),
        )

        elements: List[Any] = []

        # Header
        elements.append(
            Paragraph("IRISaathi — Tele-Ophthalmology Retinal Screening Report", title_style)
        )
        elements.append(
            Paragraph(
                f"Report Code: <b>{report_code}</b> &nbsp;|&nbsp; Study ID: <b>{session.id}</b> "
                f"&nbsp;|&nbsp; Date: {session.study_date} &nbsp;|&nbsp; Centre: {session.health_centre}",
                body_style,
            )
        )
        elements.append(Spacer(1, 6))

        # Prominent Medical Disclaimer Box
        disclaimer_table = Table(
            [[Paragraph(f"<b>{PROMINENT_MEDICAL_DISCLAIMER}</b>", disclaimer_style)]],
            colWidths=[178 * mm],
        )
        disclaimer_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fef2f2")),
                    ("BOX", (0, 0), (-1, -1), 1.0, colors.HexColor("#dc2626")),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ]
            )
        )
        elements.append(disclaimer_table)
        elements.append(Spacer(1, 8))

        # 1. Patient & Image Quality Summary
        p = session.patient
        q = session.quality_check
        elements.append(Paragraph("1. Patient Profile & Image Quality Assessment", section_style))
        patient_rows = [
            ["Patient ID", p.id, "Name", p.name],
            ["Age / Gender", f"{p.age} yrs / {p.gender.upper()}", "Eye Screened", session.eye],
            ["Village / District", f"{p.village}, {p.district}", "Mobile", f"+91 {p.mobile}"],
            [
                "Diabetes Status",
                f"{p.diabetes_status} ({p.diabetes_duration_years} yrs)",
                "HbA1c / Glucose",
                f"{p.hba1c or 'N/A'}% / {p.blood_glucose or 'N/A'} mg/dL",
            ],
            [
                "Image Quality Score",
                f"{q.overall_score}% ({q.status.upper()})" if q else "N/A",
                "Dimensions / Sharpness",
                f"{q.resolution_detail} | Sharpness {q.sharpness_score:.1f}" if q else "N/A",
            ],
        ]
        patient_table = Table(patient_rows, colWidths=[34 * mm, 55 * mm, 34 * mm, 55 * mm])
        patient_table.setStyle(
            TableStyle(
                [
                    ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                    ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f1f5f9")),
                    ("BACKGROUND", (2, 0), (2, -1), colors.HexColor("#f1f5f9")),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        elements.append(patient_table)
        elements.append(Spacer(1, 6))

        # Optional embedded fundus & Grad-CAM images
        img_cells: List[Any] = []
        img_labels: List[str] = []
        if session.image_asset:
            fundus_path = self.image_service.resolve_local_image(session.image_asset.file_path)
            if fundus_path and fundus_path.is_file():
                img_cells.append(RLImage(str(fundus_path), width=52 * mm, height=52 * mm))
                img_labels.append(f"Original Fundus ({session.eye})")
        if session.ai_prediction and session.ai_prediction.gradcam_path:
            gradcam_rel = session.ai_prediction.gradcam_path
            if gradcam_rel.startswith("/uploads/"):
                gradcam_rel = f"app/storage{gradcam_rel}"
            gradcam_file = self.image_service.resolve_local_image(gradcam_rel)
            if gradcam_file and gradcam_file.is_file():
                img_cells.append(RLImage(str(gradcam_file), width=52 * mm, height=52 * mm))
                img_labels.append("Grad-CAM++ Reference Overlay")

        if img_cells:
            media_table = Table([img_labels, img_cells], colWidths=[89 * mm] * len(img_cells))
            media_table.setStyle(
                TableStyle(
                    [
                        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                        ("FONTSIZE", (0, 0), (-1, 0), 8),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#334155")),
                        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                        ("TOPPADDING", (0, 0), (-1, -1), 4),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ]
                )
            )
            elements.append(media_table)
            elements.append(Spacer(1, 6))

        # 2. SEPARATE SECTION: Assistive AI Prototype Output
        ai = session.ai_prediction
        elements.append(
            Paragraph(
                "2. Assistive AI Prototype Output (Non-Diagnostic Screening Aid)",
                section_style,
            )
        )
        if ai:
            ai_rows = [
                ["Output Classification", Paragraph("<b>PROTOTYPE ASSISTIVE TRIAGE OUTPUT (NON-DIAGNOSTIC)</b>", body_style)],
                ["AI Model Identifier", Paragraph(ai.model_identifier, body_style)],
                ["Suggested ICDR Grade", Paragraph(ai.predicted_grade_name, body_style)],
                ["Prototype Score / Confidence", f"{ai.confidence:.1f}%"],
                ["AI Triage Suggestion", Paragraph(f"{ai.referral_status} — {ai.referral_recommendation}", body_style)],
                ["AI Rationale", Paragraph(ai.clinical_rationale, body_style)],
            ]
        else:
            ai_rows = [["Status", "No AI triage output recorded."]]

        ai_table = Table(ai_rows, colWidths=[48 * mm, 130 * mm])
        ai_table.setStyle(
            TableStyle(
                [
                    ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#fffbeb")),
                    ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#fef3c7")),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#fcd34d")),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        elements.append(ai_table)
        elements.append(Spacer(1, 8))

        # 3. SEPARATE SECTION: Doctor / Clinician Review & Referral
        rev = session.doctor_review
        ref = session.referral
        elements.append(
            Paragraph(
                "3. Doctor Review, Clinical Sign-Off & Referral Decision",
                section_style,
            )
        )
        if rev:
            confirmed_label = ICDR_GRADE_LABELS.get(rev.confirmed_grade, f"Grade {rev.confirmed_grade}")
            pathway_label = ACTION_PATHWAY_LABELS.get(rev.action_pathway, rev.action_pathway)
            doc_rows = [
                ["Verification Status", Paragraph("<b>SIGNED &amp; VERIFIED BY CLINICIAN</b>" if rev.is_signed else "DRAFT", body_style)],
                ["Reviewing Doctor", Paragraph(rev.clinician_name, body_style)],
                ["Confirmed Clinical Grade", Paragraph(confirmed_label, body_style)],
                ["Clinical Action Pathway", Paragraph(pathway_label, body_style)],
                ["Doctor Remarks", Paragraph(rev.clinical_remarks, body_style)],
                ["Reviewed Timestamp", rev.reviewed_at],
            ]
        else:
            doc_rows = [
                ["Verification Status", Paragraph("<b>PENDING CLINICIAN REVIEW</b>", body_style)],
                ["Reviewing Doctor", "Not yet signed by an ophthalmologist"],
                ["Confirmed Clinical Grade", "Pending medical verification"],
                ["Doctor Remarks", Paragraph("Awaiting clinician review in IRISaathi PACS workstation.", body_style)],
            ]

        if ref:
            doc_rows.append(
                [
                    "Referral Status",
                    Paragraph(
                        f"{ref.status.upper()} | Priority: {ref.priority} | Facility: {ref.facility_name}",
                        body_style,
                    ),
                ]
            )

        doc_table = Table(doc_rows, colWidths=[48 * mm, 130 * mm])
        doc_table.setStyle(
            TableStyle(
                [
                    ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#eff6ff")),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#93c5fd")),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        elements.append(doc_table)
        elements.append(Spacer(1, 10))

        elements.append(
            Paragraph(
                "Disclaimer: This report separates automated prototype screening cues from "
                "clinician verification. Only signed clinician determinations constitute medical advice.",
                disclaimer_style,
            )
        )

        doc.build(elements)
