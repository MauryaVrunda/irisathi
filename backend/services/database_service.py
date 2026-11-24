"""Database CRUD, query helpers, and synthetic demo seeder for IRISaathi."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, joinedload, sessionmaker

from backend.database.connection import (
    create_db_engine,
    create_session_factory,
    get_session,
    init_db,
)
from backend.database.models import (
    AIPrediction,
    DoctorReview,
    ExplainabilityResult,
    GeneratedReport,
    ImageQualityResult,
    Patient,
    Referral,
    RetinalImage,
    ScreeningSession,
    utc_now,
)

DR_GRADE_LABELS: dict[int, str] = {
    0: "Grade 0 — No Diabetic Retinopathy",
    1: "Grade 1 — Mild Non-Proliferative DR (Mild NPDR)",
    2: "Grade 2 — Moderate Non-Proliferative DR (Moderate NPDR)",
    3: "Grade 3 — Severe Non-Proliferative DR (Severe NPDR)",
    4: "Grade 4 — Proliferative Diabetic Retinopathy (PDR)",
}


def _parse_dt(value: datetime | str | None, default: datetime | None = None) -> datetime | None:
    """Coerce an ISO timestamp string or datetime into a timezone-aware UTC datetime."""
    if value is None:
        return default
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    normalized = value.strip()
    if normalized.endswith("Z"):
        normalized = normalized[:-1] + "+00:00"
    dt = datetime.fromisoformat(normalized)
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


class DatabaseService:
    """High-level repository/service layer over IRISaathi SQLite/SQLAlchemy tables."""

    def __init__(self, db_url: str | None = None, engine: Engine | None = None, echo: bool = False) -> None:
        self.engine: Engine = engine or create_db_engine(db_url=db_url, echo=echo)
        init_db(self.engine)
        self.session_factory: sessionmaker[Session] = create_session_factory(self.engine)

    # ------------------------------------------------------------------
    # Patients CRUD
    # ------------------------------------------------------------------

    def create_patient(
        self,
        *,
        patient_id: str | None = None,
        name: str,
        age: int,
        gender: str,
        mobile: str,
        village: str,
        district: str,
        state: str = "Gujarat",
        diabetes_status: str = "diagnosed",
        diabetes_duration_years: float = 0.0,
        hba1c: float | None = None,
        blood_glucose: float | None = None,
        previous_dr_history: str = "unknown",
        previous_ophth_visit: str = "never",
        symptoms: list[str] | None = None,
        preferred_eye: str = "both",
        is_anonymous: bool = True,
        registration_date: datetime | str | None = None,
    ) -> dict[str, Any]:
        """Create and persist a patient record."""
        pid = patient_id or f"PAT-{utc_now().strftime('%Y')}-{uuid4().hex[:6].upper()}"
        with get_session(self.session_factory) as session:
            patient = Patient(
                patient_id=pid,
                name=name,
                age=age,
                gender=gender,
                mobile=mobile,
                village=village,
                district=district,
                state=state,
                diabetes_status=diabetes_status,
                diabetes_duration_years=diabetes_duration_years,
                hba1c=hba1c,
                blood_glucose=blood_glucose,
                previous_dr_history=previous_dr_history,
                previous_ophth_visit=previous_ophth_visit,
                symptoms=symptoms or [],
                preferred_eye=preferred_eye,
                is_anonymous=is_anonymous,
                registration_date=_parse_dt(registration_date, default=utc_now()),
            )
            session.add(patient)
            session.flush()
            return patient.to_dict()

    def get_patient(self, patient_id: str) -> dict[str, Any] | None:
        """Fetch a single patient by patient_id."""
        with get_session(self.session_factory) as session:
            patient = session.get(Patient, patient_id)
            return patient.to_dict() if patient else None

    def list_patients(
        self,
        *,
        district: str | None = None,
        diabetes_status: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """List patients with optional filtering by district and diabetes status."""
        with get_session(self.session_factory) as session:
            stmt = select(Patient).order_by(Patient.registration_date.desc())
            if district:
                stmt = stmt.where(Patient.district == district)
            if diabetes_status:
                stmt = stmt.where(Patient.diabetes_status == diabetes_status)
            stmt = stmt.limit(limit).offset(offset)
            return [p.to_dict() for p in session.scalars(stmt).all()]

    def update_patient(self, patient_id: str, **updates: Any) -> dict[str, Any] | None:
        """Update mutable fields on an existing patient record."""
        allowed = {
            "name",
            "age",
            "gender",
            "mobile",
            "village",
            "district",
            "state",
            "diabetes_status",
            "diabetes_duration_years",
            "hba1c",
            "blood_glucose",
            "previous_dr_history",
            "previous_ophth_visit",
            "symptoms",
            "preferred_eye",
            "is_anonymous",
        }
        with get_session(self.session_factory) as session:
            patient = session.get(Patient, patient_id)
            if not patient:
                return None
            for key, value in updates.items():
                if key in allowed:
                    setattr(patient, key, value)
            session.flush()
            return patient.to_dict()

    def delete_patient(self, patient_id: str) -> bool:
        """Delete a patient and cascade-delete associated sessions and referrals."""
        with get_session(self.session_factory) as session:
            patient = session.get(Patient, patient_id)
            if not patient:
                return False
            session.delete(patient)
            return True

    # ------------------------------------------------------------------
    # Screening Sessions CRUD
    # ------------------------------------------------------------------

    def create_screening_session(
        self,
        *,
        screening_id: str | None = None,
        patient_id: str,
        eye_side: str = "OD",
        health_centre: str,
        study_date: datetime | str | None = None,
        operator_id: str | None = None,
        status: str = "captured",
    ) -> dict[str, Any]:
        """Create a screening session linked to an existing patient."""
        sid = screening_id or f"SCR-{utc_now().strftime('%Y')}-{uuid4().hex[:6].upper()}"
        with get_session(self.session_factory) as session:
            if not session.get(Patient, patient_id):
                raise ValueError(f"Patient '{patient_id}' does not exist.")
            screening = ScreeningSession(
                screening_id=sid,
                patient_id=patient_id,
                eye_side=eye_side,
                study_date=_parse_dt(study_date, default=utc_now()),
                health_centre=health_centre,
                operator_id=operator_id,
                status=status,
            )
            session.add(screening)
            session.flush()
            return screening.to_dict()

    def get_screening_session(self, screening_id: str) -> dict[str, Any] | None:
        """Return basic metadata for a screening session."""
        with get_session(self.session_factory) as session:
            screening = session.get(ScreeningSession, screening_id)
            return screening.to_dict() if screening else None

    def list_screening_sessions(
        self,
        *,
        patient_id: str | None = None,
        status: str | None = None,
        dr_grade: int | None = None,
        referable_only: bool = False,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Query screening sessions by patient, status, DR grade, or referable flag."""
        with get_session(self.session_factory) as session:
            stmt = select(ScreeningSession).order_by(ScreeningSession.study_date.desc())
            if patient_id:
                stmt = stmt.where(ScreeningSession.patient_id == patient_id)
            if status:
                stmt = stmt.where(ScreeningSession.status == status)
            if dr_grade is not None or referable_only:
                stmt = stmt.join(AIPrediction, AIPrediction.screening_id == ScreeningSession.screening_id)
                if dr_grade is not None:
                    stmt = stmt.where(AIPrediction.dr_grade == dr_grade)
                if referable_only:
                    stmt = stmt.where(AIPrediction.referable_dr.is_(True))
            stmt = stmt.limit(limit).offset(offset)
            return [s.to_dict() for s in session.scalars(stmt).all()]

    def update_screening_status(self, screening_id: str, status: str) -> dict[str, Any] | None:
        """Update the workflow status of a screening session."""
        with get_session(self.session_factory) as session:
            screening = session.get(ScreeningSession, screening_id)
            if not screening:
                return None
            screening.status = status
            session.flush()
            return screening.to_dict()

    def delete_screening_session(self, screening_id: str) -> bool:
        """Delete a screening session and its dependent records."""
        with get_session(self.session_factory) as session:
            screening = session.get(ScreeningSession, screening_id)
            if not screening:
                return False
            session.delete(screening)
            return True

    # ------------------------------------------------------------------
    # Retinal Images & Image Quality Results
    # ------------------------------------------------------------------

    def add_retinal_image(
        self,
        *,
        screening_id: str,
        file_path: str,
        file_name: str,
        eye_side: str = "OD",
        resolution: str = "1536 × 1536 px",
        width_px: int | None = None,
        height_px: int | None = None,
        file_size_label: str | None = None,
        file_size_bytes: int | None = None,
        mime_type: str = "image/jpeg",
        camera_modality: str = "non_mydriatic_fundus",
        sha256_checksum: str | None = None,
        captured_at: datetime | str | None = None,
    ) -> dict[str, Any]:
        """Register a retinal image file reference and capture metadata (never raw binary blobs)."""
        with get_session(self.session_factory) as session:
            if not session.get(ScreeningSession, screening_id):
                raise ValueError(f"Screening session '{screening_id}' does not exist.")
            image = RetinalImage(
                screening_id=screening_id,
                file_path=file_path,
                file_name=file_name,
                eye_side=eye_side,
                resolution=resolution,
                width_px=width_px,
                height_px=height_px,
                file_size_label=file_size_label,
                file_size_bytes=file_size_bytes,
                mime_type=mime_type,
                camera_modality=camera_modality,
                sha256_checksum=sha256_checksum,
                captured_at=_parse_dt(captured_at, default=utc_now()),
            )
            session.add(image)
            session.flush()
            return image.to_dict()

    def get_retinal_images(self, screening_id: str) -> list[dict[str, Any]]:
        """List all retinal image references attached to a screening session."""
        with get_session(self.session_factory) as session:
            stmt = select(RetinalImage).where(RetinalImage.screening_id == screening_id)
            return [img.to_dict() for img in session.scalars(stmt).all()]

    def upsert_image_quality(
        self,
        *,
        screening_id: str,
        overall_score: float,
        status: str,
        is_gradable: bool | None = None,
        image_id: int | None = None,
        metrics: dict[str, Any] | None = None,
        issues: list[str] | None = None,
        recapture_guidance: str | None = None,
        resolution_detail: str | None = None,
        assessed_at: datetime | str | None = None,
    ) -> dict[str, Any]:
        """Store or update image quality gate findings for a screening session."""
        gradable = (status != "failed") if is_gradable is None else is_gradable
        with get_session(self.session_factory) as session:
            screening = session.get(ScreeningSession, screening_id)
            if not screening:
                raise ValueError(f"Screening session '{screening_id}' does not exist.")

            existing = session.scalar(
                select(ImageQualityResult).where(ImageQualityResult.screening_id == screening_id)
            )
            parsed_assessed = _parse_dt(assessed_at, default=utc_now())

            if existing:
                existing.image_id = image_id
                existing.is_gradable = gradable
                existing.status = status
                existing.overall_score = overall_score
                existing.metrics = metrics or {}
                existing.issues = issues or []
                existing.recapture_guidance = recapture_guidance
                existing.resolution_detail = resolution_detail
                existing.assessed_at = parsed_assessed
                record = existing
            else:
                record = ImageQualityResult(
                    screening_id=screening_id,
                    image_id=image_id,
                    is_gradable=gradable,
                    status=status,
                    overall_score=overall_score,
                    metrics=metrics or {},
                    issues=issues or [],
                    recapture_guidance=recapture_guidance,
                    resolution_detail=resolution_detail,
                    assessed_at=parsed_assessed,
                )
                session.add(record)

            if not gradable:
                screening.status = "quality_failed"

            session.flush()
            return record.to_dict()

    # ------------------------------------------------------------------
    # AI Predictions & Explainability (Grad-CAM)
    # ------------------------------------------------------------------

    def upsert_ai_prediction(
        self,
        *,
        screening_id: str,
        dr_grade: int,
        class_probabilities: dict[str, float],
        confidence_score: float,
        model_version: str,
        dr_grade_name: str | None = None,
        referable_dr: bool | None = None,
        referral_status: str | None = None,
        referral_recommendation: str = "",
        uncertainty_score: float | None = None,
        uncertainty_flag: bool | None = None,
        lesions: list[dict[str, Any]] | None = None,
        lesion_counts: dict[str, int] | None = None,
        quadrant_counts: dict[str, int] | None = None,
        clinical_rationale: str | None = None,
        anatomical_distribution: str | None = None,
        macular_risk_assessment: str = "low",
        visual_threat_assessment: str | None = None,
        clinical_protocol: str | None = None,
        recommended_followup_weeks: int | None = None,
        processing_time_ms: int | None = None,
        is_demo: bool = False,
        predicted_at: datetime | str | None = None,
    ) -> dict[str, Any]:
        """Insert or update the AI DR grade prediction (0-4) and uncertainty metadata."""
        if dr_grade not in DR_GRADE_LABELS:
            raise ValueError(f"dr_grade must be an integer between 0 and 4, got {dr_grade!r}.")

        is_referable = (dr_grade >= 2) if referable_dr is None else referable_dr
        resolved_ref_status = referral_status or (
            "URGENT_REFERRAL" if dr_grade >= 3 else "REFERABLE_DR" if dr_grade == 2 else "NON_REFERABLE"
        )
        resolved_grade_name = dr_grade_name or DR_GRADE_LABELS[dr_grade]
        resolved_uncertainty = (
            round(max(0.0, min(1.0, 1.0 - (confidence_score / 100.0))), 4)
            if uncertainty_score is None
            else uncertainty_score
        )
        resolved_uncertainty_flag = (confidence_score < 75.0) if uncertainty_flag is None else uncertainty_flag

        with get_session(self.session_factory) as session:
            screening = session.get(ScreeningSession, screening_id)
            if not screening:
                raise ValueError(f"Screening session '{screening_id}' does not exist.")

            existing = session.scalar(select(AIPrediction).where(AIPrediction.screening_id == screening_id))
            parsed_pred_dt = _parse_dt(predicted_at, default=utc_now())

            payload = dict(
                dr_grade=dr_grade,
                dr_grade_name=resolved_grade_name,
                class_probabilities=class_probabilities,
                referable_dr=is_referable,
                referral_status=resolved_ref_status,
                referral_recommendation=referral_recommendation,
                confidence_score=confidence_score,
                uncertainty_score=resolved_uncertainty,
                uncertainty_flag=resolved_uncertainty_flag,
                lesions=lesions or [],
                lesion_counts=lesion_counts or {},
                quadrant_counts=quadrant_counts or {},
                clinical_rationale=clinical_rationale,
                anatomical_distribution=anatomical_distribution,
                macular_risk_assessment=macular_risk_assessment,
                visual_threat_assessment=visual_threat_assessment,
                clinical_protocol=clinical_protocol,
                recommended_followup_weeks=recommended_followup_weeks,
                processing_time_ms=processing_time_ms,
                model_version=model_version,
                is_demo=is_demo,
                predicted_at=parsed_pred_dt,
            )

            if existing:
                for k, v in payload.items():
                    setattr(existing, k, v)
                record = existing
            else:
                record = AIPrediction(screening_id=screening_id, **payload)
                session.add(record)

            if screening.status in ("captured", "quality_failed"):
                screening.status = "pending_review" if (is_referable or resolved_uncertainty_flag) else "ai_analyzed"

            session.flush()
            return record.to_dict()

    def add_explainability_result(
        self,
        *,
        screening_id: str,
        target_class: int,
        heatmap_path: str,
        overlay_path: str | None = None,
        target_class_label: str | None = None,
        prediction_id: int | None = None,
        method: str = "Grad-CAM++",
        target_layer: str = "ResNet50.Conv5",
        description: str = "",
        saliency_metadata: dict[str, Any] | None = None,
        generated_at: datetime | str | None = None,
    ) -> dict[str, Any]:
        """Attach Grad-CAM explainability heatmap/overlay paths and target class metadata."""
        with get_session(self.session_factory) as session:
            if not session.get(ScreeningSession, screening_id):
                raise ValueError(f"Screening session '{screening_id}' does not exist.")
            if prediction_id is None:
                pred = session.scalar(select(AIPrediction).where(AIPrediction.screening_id == screening_id))
                prediction_id = pred.prediction_id if pred else None

            record = ExplainabilityResult(
                screening_id=screening_id,
                prediction_id=prediction_id,
                method=method,
                target_layer=target_layer,
                target_class=target_class,
                target_class_label=target_class_label or DR_GRADE_LABELS.get(target_class, f"Grade {target_class}"),
                heatmap_path=heatmap_path,
                overlay_path=overlay_path,
                description=description,
                saliency_metadata=saliency_metadata or {},
                generated_at=_parse_dt(generated_at, default=utc_now()),
            )
            session.add(record)
            session.flush()
            return record.to_dict()

    def get_explainability_results(self, screening_id: str) -> list[dict[str, Any]]:
        """Fetch all Grad-CAM/explainability results for a screening session."""
        with get_session(self.session_factory) as session:
            stmt = select(ExplainabilityResult).where(ExplainabilityResult.screening_id == screening_id)
            return [item.to_dict() for item in session.scalars(stmt).all()]

    # ------------------------------------------------------------------
    # Doctor Reviews (Human-in-the-Loop)
    # ------------------------------------------------------------------

    def upsert_doctor_review(
        self,
        *,
        screening_id: str,
        clinician_id: str,
        clinician_name: str,
        confirmed_grade: int,
        action_pathway: str,
        clinical_comments: str = "",
        clinician_registration: str | None = None,
        final_status: str | None = None,
        is_signed: bool = True,
        review_date: datetime | str | None = None,
    ) -> dict[str, Any]:
        """Record or update a clinician's human-in-the-loop review and final status."""
        if confirmed_grade not in DR_GRADE_LABELS:
            raise ValueError(f"confirmed_grade must be between 0 and 4, got {confirmed_grade!r}.")

        with get_session(self.session_factory) as session:
            screening = session.get(ScreeningSession, screening_id)
            if not screening:
                raise ValueError(f"Screening session '{screening_id}' does not exist.")

            prediction = session.scalar(select(AIPrediction).where(AIPrediction.screening_id == screening_id))
            ai_agreement = (prediction.dr_grade == confirmed_grade) if prediction else True
            resolved_status = final_status or (
                "signed" if is_signed else ("confirmed" if ai_agreement else "overridden")
            )
            parsed_review_dt = _parse_dt(review_date, default=utc_now())

            existing = session.scalar(select(DoctorReview).where(DoctorReview.screening_id == screening_id))
            if existing:
                existing.clinician_id = clinician_id
                existing.clinician_name = clinician_name
                existing.clinician_registration = clinician_registration
                existing.confirmed_grade = confirmed_grade
                existing.ai_agreement = ai_agreement
                existing.action_pathway = action_pathway
                existing.clinical_comments = clinical_comments
                existing.final_status = resolved_status
                existing.is_signed = is_signed
                existing.review_date = parsed_review_dt
                record = existing
            else:
                record = DoctorReview(
                    screening_id=screening_id,
                    clinician_id=clinician_id,
                    clinician_name=clinician_name,
                    clinician_registration=clinician_registration,
                    confirmed_grade=confirmed_grade,
                    ai_agreement=ai_agreement,
                    action_pathway=action_pathway,
                    clinical_comments=clinical_comments,
                    final_status=resolved_status,
                    is_signed=is_signed,
                    review_date=parsed_review_dt,
                )
                session.add(record)

            screening.status = "reviewed" if is_signed else "pending_review"
            session.flush()
            return record.to_dict()

    def get_doctor_review(self, screening_id: str) -> dict[str, Any] | None:
        """Fetch the clinician review for a screening session."""
        with get_session(self.session_factory) as session:
            review = session.scalar(select(DoctorReview).where(DoctorReview.screening_id == screening_id))
            return review.to_dict() if review else None

    # ------------------------------------------------------------------
    # Referrals
    # ------------------------------------------------------------------

    def create_or_update_referral(
        self,
        *,
        screening_id: str,
        patient_id: str | None = None,
        referral_status: str = "pending",
        priority: str = "routine",
        reason: str,
        target_facility: str | None = None,
        target_specialty: str = "Ophthalmology",
        recommended_within_days: int | None = None,
        due_date: datetime | str | None = None,
        notes: str | None = None,
        follow_up_items: list[dict[str, Any]] | None = None,
        referral_id: int | None = None,
    ) -> dict[str, Any]:
        """Create or update a referral recommendation and follow-up plan."""
        with get_session(self.session_factory) as session:
            screening = session.get(ScreeningSession, screening_id)
            if not screening:
                raise ValueError(f"Screening session '{screening_id}' does not exist.")
            resolved_patient_id = patient_id or screening.patient_id
            parsed_due = _parse_dt(due_date)
            if parsed_due is None and recommended_within_days is not None:
                parsed_due = utc_now() + timedelta(days=recommended_within_days)

            existing = session.get(Referral, referral_id) if referral_id is not None else None
            if existing:
                existing.referral_status = referral_status
                existing.priority = priority
                existing.reason = reason
                existing.target_facility = target_facility
                existing.target_specialty = target_specialty
                existing.recommended_within_days = recommended_within_days
                existing.due_date = parsed_due
                existing.notes = notes
                if follow_up_items is not None:
                    existing.follow_up_items = follow_up_items
                record = existing
            else:
                record = Referral(
                    screening_id=screening_id,
                    patient_id=resolved_patient_id,
                    referral_status=referral_status,
                    priority=priority,
                    reason=reason,
                    target_facility=target_facility,
                    target_specialty=target_specialty,
                    recommended_within_days=recommended_within_days,
                    due_date=parsed_due,
                    notes=notes,
                    follow_up_items=follow_up_items or [],
                )
                session.add(record)

            if referral_status in ("pending", "scheduled") and priority in ("moderate", "high", "urgent"):
                screening.status = "referred"
            elif referral_status == "completed":
                screening.status = "completed"

            session.flush()
            return record.to_dict()

    def list_referrals(
        self,
        *,
        referral_status: str | None = None,
        priority: str | None = None,
        patient_id: str | None = None,
        screening_id: str | None = None,
    ) -> list[dict[str, Any]]:
        """Query referral records by status, priority, patient, or screening."""
        with get_session(self.session_factory) as session:
            stmt = select(Referral).order_by(Referral.created_at.desc())
            if referral_status:
                stmt = stmt.where(Referral.referral_status == referral_status)
            if priority:
                stmt = stmt.where(Referral.priority == priority)
            if patient_id:
                stmt = stmt.where(Referral.patient_id == patient_id)
            if screening_id:
                stmt = stmt.where(Referral.screening_id == screening_id)
            return [r.to_dict() for r in session.scalars(stmt).all()]

    # ------------------------------------------------------------------
    # Generated Reports
    # ------------------------------------------------------------------

    def record_generated_report(
        self,
        *,
        screening_id: str,
        report_path: str,
        language: str = "en",
        report_format: str = "pdf",
        report_metadata: dict[str, Any] | None = None,
        generated_by: str = "IRISaathi Report Service",
        report_id: str | None = None,
        generated_at: datetime | str | None = None,
    ) -> dict[str, Any]:
        """Record a generated screening report reference and metadata in the database."""
        rid = report_id or f"RPT-{screening_id}-{language.upper()}-{uuid4().hex[:6].upper()}"
        with get_session(self.session_factory) as session:
            if not session.get(ScreeningSession, screening_id):
                raise ValueError(f"Screening session '{screening_id}' does not exist.")
            report = GeneratedReport(
                report_id=rid,
                screening_id=screening_id,
                report_path=report_path,
                report_format=report_format,
                language=language,
                report_metadata=report_metadata or {},
                generated_by=generated_by,
                generated_at=_parse_dt(generated_at, default=utc_now()),
            )
            session.add(report)
            session.flush()
            return report.to_dict()

    def list_generated_reports(
        self,
        *,
        screening_id: str | None = None,
        language: str | None = None,
    ) -> list[dict[str, Any]]:
        """List generated report records filtered by screening_id and/or language."""
        with get_session(self.session_factory) as session:
            stmt = select(GeneratedReport).order_by(GeneratedReport.generated_at.desc())
            if screening_id:
                stmt = stmt.where(GeneratedReport.screening_id == screening_id)
            if language:
                stmt = stmt.where(GeneratedReport.language == language)
            return [rep.to_dict() for rep in session.scalars(stmt).all()]

    # ------------------------------------------------------------------
    # Complete Screening Bundle Query (for Reports & Clinician PACS)
    # ------------------------------------------------------------------

    def get_complete_screening_record(self, screening_id: str) -> dict[str, Any] | None:
        """Fetch a complete normalized screening record across all 9 tables."""
        with get_session(self.session_factory) as session:
            stmt = (
                select(ScreeningSession)
                .where(ScreeningSession.screening_id == screening_id)
                .options(
                    joinedload(ScreeningSession.patient),
                    joinedload(ScreeningSession.retinal_images),
                    joinedload(ScreeningSession.quality_result),
                    joinedload(ScreeningSession.ai_prediction),
                    joinedload(ScreeningSession.explainability_results),
                    joinedload(ScreeningSession.doctor_review),
                    joinedload(ScreeningSession.referrals),
                    joinedload(ScreeningSession.generated_reports),
                )
            )
            screening = session.execute(stmt).unique().scalar_one_or_none()
            if not screening:
                return None

            return {
                "screening_session": screening.to_dict(),
                "patient": screening.patient.to_dict() if screening.patient else None,
                "retinal_images": [img.to_dict() for img in screening.retinal_images],
                "image_quality_result": screening.quality_result.to_dict() if screening.quality_result else None,
                "ai_prediction": screening.ai_prediction.to_dict() if screening.ai_prediction else None,
                "explainability_results": [exp.to_dict() for exp in screening.explainability_results],
                "doctor_review": screening.doctor_review.to_dict() if screening.doctor_review else None,
                "referrals": [ref.to_dict() for ref in screening.referrals],
                "generated_reports": [rep.to_dict() for rep in screening.generated_reports],
            }


def seed_synthetic_data(db_service: DatabaseService) -> list[str]:
    """
    Populate the database with clearly labelled synthetic/demo screening records
    aligned with src/services/sampleData.ts (plus one ungradable quality-rejected case).
    Idempotent: existing synthetic IDs are skipped without error.
    """
    seeded_ids: list[str] = []

    synthetic_cases = [
        {
            "patient": {
                "patient_id": "PAT-2026-X1042",
                "name": "Rameshchandra B. [SYNTHETIC DEMO]",
                "age": 54,
                "gender": "male",
                "mobile": "9825471102",
                "village": "Chikhli Khurd",
                "district": "Navsari",
                "state": "Gujarat",
                "diabetes_status": "diagnosed",
                "diabetes_duration_years": 8.0,
                "hba1c": 7.2,
                "blood_glucose": 148.0,
                "previous_dr_history": "none",
                "previous_ophth_visit": "never",
                "symptoms": ["symptomNone"],
                "preferred_eye": "right",
                "is_anonymous": True,
                "registration_date": "2026-09-24T10:10:00Z",
            },
            "session": {
                "screening_id": "SCR-2026-0042",
                "eye_side": "OD",
                "study_date": "2026-09-24T10:15:00Z",
                "health_centre": "Chikhli Primary Health Centre (PHC)",
                "operator_id": "OP-CHIKHLI-01",
                "status": "reviewed",
            },
            "image": {
                "file_path": "src/assets/images/retina_normal_1790485949561.jpg",
                "file_name": "fundus_od_20260924_1015.jpg",
                "eye_side": "OD",
                "resolution": "1536 × 1536 px",
                "width_px": 1536,
                "height_px": 1536,
                "file_size_label": "1.42 MB",
                "captured_at": "2026-09-24T10:15:10Z",
            },
            "quality": {
                "overall_score": 94.0,
                "status": "passed",
                "is_gradable": True,
                "resolution_detail": "1536 × 1536",
                "issues": [],
                "recapture_guidance": None,
                "metrics": {
                    "fundusDetected": {"id": "fundus", "name": "Fundus Detected", "passed": True, "score": 96},
                    "focusSharpness": {"id": "focus", "name": "Focus & Sharpness", "passed": True, "score": 95},
                    "illumination": {"id": "illumination", "name": "Illumination", "passed": True, "score": 92},
                    "fieldOfView": {"id": "fov", "name": "Field of View", "passed": True, "score": 94},
                    "resolution": {"id": "resolution", "name": "Resolution", "passed": True, "score": 93},
                },
                "assessed_at": "2026-09-24T10:15:22Z",
            },
            "ai_prediction": {
                "dr_grade": 0,
                "dr_grade_name": "Grade 0 — No Diabetic Retinopathy",
                "confidence_score": 94.6,
                "uncertainty_score": 0.054,
                "uncertainty_flag": False,
                "referable_dr": False,
                "referral_status": "NON_REFERABLE",
                "referral_recommendation": "Routine annual tele-screening at primary health centre. Maintain glycemic control.",
                "class_probabilities": {
                    "grade0": 94.6,
                    "grade1": 3.8,
                    "grade2": 1.2,
                    "grade3": 0.3,
                    "grade4": 0.1,
                },
                "lesions": [],
                "lesion_counts": {"microaneurysms": 0, "hemorrhages": 0, "hardExudates": 0, "neovascularizations": 0, "total": 0},
                "quadrant_counts": {"superiorTemporal": 0, "superiorNasal": 0, "inferiorTemporal": 0, "inferiorNasal": 0},
                "clinical_rationale": "Sharp optic disc boundaries, physiological cup-to-disc ratio, and intact foveal avascular zone with no DR lesions.",
                "anatomical_distribution": "Vascular integrity intact across all four retinal quadrants.",
                "macular_risk_assessment": "low",
                "visual_threat_assessment": "Minimal risk of vision impairment.",
                "clinical_protocol": "Annual non-mydriatic fundus rescreening at nearest PHC.",
                "recommended_followup_weeks": 52,
                "processing_time_ms": 1420,
                "model_version": "IRISaathi-Ordinal-DR-v3.2",
                "is_demo": True,
            },
            "explainability": {
                "target_class": 0,
                "target_class_label": "Grade 0 — No Diabetic Retinopathy",
                "heatmap_path": "src/assets/images/gradcam_normal_1790493692563.jpg",
                "overlay_path": "src/assets/images/gradcam_normal_1790493692563.jpg",
                "description": "Diffuse baseline attention around optic disc and major vascular arcades with no focal lesion hotspots.",
                "saliency_metadata": {"colormap": "jet", "peak_activation": 0.31},
            },
            "doctor_review": {
                "clinician_id": "USR-CL-01",
                "clinician_name": "Dr. Ananya Desai, MS (Ophthalmology)",
                "clinician_registration": "MCI / GMC-58291",
                "confirmed_grade": 0,
                "action_pathway": "routine_rescreen",
                "clinical_comments": "Normal healthy retina. No microaneurysms seen. Advised regular HbA1c testing and routine 12-month rescreening.",
                "final_status": "signed",
                "is_signed": True,
                "review_date": "2026-09-24T11:30:00Z",
            },
            "referral": {
                "referral_status": "not_required",
                "priority": "routine",
                "reason": "No diabetic retinopathy detected; routine annual PHC tele-screening recommended.",
                "target_facility": "Chikhli Primary Health Centre (PHC)",
                "recommended_within_days": 365,
                "notes": "Maintain glycemic control and quarterly HbA1c check.",
                "follow_up_items": [
                    {"id": "fu-01", "title": "Annual Retinal Tele-Screening", "dueDate": "2027-09-24", "interval": "12 Months", "status": "pending"},
                    {"id": "fu-02", "title": "Quarterly Fasting Glucose & HbA1c Check", "dueDate": "2026-12-24", "interval": "3 Months", "status": "pending"},
                ],
            },
        },
        {
            "patient": {
                "patient_id": "PAT-2026-X8841",
                "name": "Kamlaben D. [SYNTHETIC DEMO]",
                "age": 61,
                "gender": "female",
                "mobile": "9879104523",
                "village": "Vansda Rural Block",
                "district": "Navsari",
                "state": "Gujarat",
                "diabetes_status": "diagnosed",
                "diabetes_duration_years": 12.0,
                "hba1c": 8.9,
                "blood_glucose": 215.0,
                "previous_dr_history": "mild",
                "previous_ophth_visit": "1_to_2y",
                "symptoms": ["symptomBlurred", "symptomFloaters"],
                "preferred_eye": "both",
                "is_anonymous": True,
                "registration_date": "2026-09-25T14:35:00Z",
            },
            "session": {
                "screening_id": "SCR-2026-0043",
                "eye_side": "OS",
                "study_date": "2026-09-25T14:40:00Z",
                "health_centre": "Vansda Community Health Centre (CHC)",
                "operator_id": "OP-VANSDA-02",
                "status": "referred",
            },
            "image": {
                "file_path": "src/assets/images/retina_moderate_npdr_1790485959942.jpg",
                "file_name": "fundus_os_20260925_1440.jpg",
                "eye_side": "OS",
                "resolution": "1536 × 1536 px",
                "width_px": 1536,
                "height_px": 1536,
                "file_size_label": "1.58 MB",
                "captured_at": "2026-09-25T14:40:05Z",
            },
            "quality": {
                "overall_score": 91.0,
                "status": "passed",
                "is_gradable": True,
                "resolution_detail": "1536 × 1536",
                "issues": [],
                "recapture_guidance": None,
                "metrics": {
                    "fundusDetected": {"id": "fundus", "name": "Fundus Detected", "passed": True, "score": 93},
                    "focusSharpness": {"id": "focus", "name": "Focus & Sharpness", "passed": True, "score": 90},
                    "illumination": {"id": "illumination", "name": "Illumination", "passed": True, "score": 89},
                    "fieldOfView": {"id": "fov", "name": "Field of View", "passed": True, "score": 92},
                    "resolution": {"id": "resolution", "name": "Resolution", "passed": True, "score": 91},
                },
                "assessed_at": "2026-09-25T14:40:10Z",
            },
            "ai_prediction": {
                "dr_grade": 2,
                "dr_grade_name": "Grade 2 — Moderate Non-Proliferative DR (Moderate NPDR)",
                "confidence_score": 68.4,
                "uncertainty_score": 0.316,
                "uncertainty_flag": True,
                "referable_dr": True,
                "referral_status": "REFERABLE_DR",
                "referral_recommendation": "Ophthalmology referral recommended within 4 to 6 weeks. High priority tele-consultation.",
                "class_probabilities": {
                    "grade0": 4.2,
                    "grade1": 12.1,
                    "grade2": 68.4,
                    "grade3": 11.8,
                    "grade4": 3.5,
                },
                "lesions": [
                    {"id": 1, "pathology": "microaneurysm", "locationQuadrant": "Superior Temporal", "x": 58.2, "y": 34.5, "confidence": 91.2},
                    {"id": 4, "pathology": "hemorrhage", "locationQuadrant": "Superior Temporal", "x": 66.4, "y": 41.2, "confidence": 89.0},
                    {"id": 7, "pathology": "hard_exudate", "locationQuadrant": "Superior Temporal", "x": 51.5, "y": 44.0, "confidence": 93.6},
                ],
                "lesion_counts": {"microaneurysms": 18, "hemorrhages": 11, "hardExudates": 9, "neovascularizations": 0, "total": 38},
                "quadrant_counts": {"superiorTemporal": 19, "superiorNasal": 5, "inferiorTemporal": 12, "inferiorNasal": 2},
                "clinical_rationale": "Multiple microaneurysms, blot hemorrhages, and hard exudates along temporal arcades; uncertainty elevated between Moderate and Severe NPDR.",
                "anatomical_distribution": "Highest lesion density in Superior Temporal (50%) and Inferior Temporal (31%) zones.",
                "macular_risk_assessment": "moderate",
                "visual_threat_assessment": "Hard exudates near foveal center; OCT evaluation advised for CSME.",
                "clinical_protocol": "Dilated slit-lamp fundus exam and Macular OCT at District Eye Hospital.",
                "recommended_followup_weeks": 6,
                "processing_time_ms": 1680,
                "model_version": "IRISaathi-Ordinal-DR-v3.2",
                "is_demo": True,
            },
            "explainability": {
                "target_class": 2,
                "target_class_label": "Grade 2 — Moderate NPDR",
                "heatmap_path": "src/assets/images/gradcam_moderate_npdr_1790493664120.jpg",
                "overlay_path": "src/assets/images/gradcam_moderate_npdr_1790493664120.jpg",
                "description": "High Grad-CAM++ saliency along Superior and Inferior Temporal arcades corresponding to hard exudate and hemorrhage clusters.",
                "saliency_metadata": {"colormap": "jet", "peak_activation": 0.87},
            },
            "doctor_review": None,
            "referral": {
                "referral_status": "pending",
                "priority": "high",
                "reason": "Referable Moderate NPDR with temporal hard exudates near macula; specialist confirmation required.",
                "target_facility": "District Eye Hospital, Navsari",
                "recommended_within_days": 28,
                "notes": "Pending tele-ophthalmologist review; prioritize OCT screening.",
                "follow_up_items": [
                    {"id": "fu-21", "title": "District Hospital Ophthalmology Referral", "dueDate": "2026-10-25", "interval": "4 Weeks", "status": "pending"},
                ],
            },
        },
        {
            "patient": {
                "patient_id": "PAT-2026-X1933",
                "name": "Harishbhai M. [SYNTHETIC DEMO]",
                "age": 67,
                "gender": "male",
                "mobile": "9712059341",
                "village": "Bilimora Town Outskirts",
                "district": "Navsari",
                "state": "Gujarat",
                "diabetes_status": "diagnosed",
                "diabetes_duration_years": 18.0,
                "hba1c": 10.4,
                "blood_glucose": 280.0,
                "previous_dr_history": "moderate",
                "previous_ophth_visit": "more_than_2y",
                "symptoms": ["symptomBlurred", "symptomDarkSpots", "symptomFlashes"],
                "preferred_eye": "right",
                "is_anonymous": True,
                "registration_date": "2026-09-26T09:20:00Z",
            },
            "session": {
                "screening_id": "SCR-2026-0044",
                "eye_side": "OD",
                "study_date": "2026-09-26T09:30:00Z",
                "health_centre": "Bilimora Sub-District Hospital",
                "operator_id": "OP-BILIMORA-01",
                "status": "referred",
            },
            "image": {
                "file_path": "src/assets/images/retina_severe_pdr_1790485976558.jpg",
                "file_name": "fundus_od_20260926_0930.jpg",
                "eye_side": "OD",
                "resolution": "1536 × 1536 px",
                "width_px": 1536,
                "height_px": 1536,
                "file_size_label": "1.64 MB",
                "captured_at": "2026-09-26T09:30:08Z",
            },
            "quality": {
                "overall_score": 89.0,
                "status": "passed",
                "is_gradable": True,
                "resolution_detail": "1536 × 1536",
                "issues": [],
                "recapture_guidance": None,
                "metrics": {
                    "fundusDetected": {"id": "fundus", "name": "Fundus Detected", "passed": True, "score": 91},
                    "focusSharpness": {"id": "focus", "name": "Focus & Sharpness", "passed": True, "score": 88},
                    "illumination": {"id": "illumination", "name": "Illumination", "passed": True, "score": 87},
                    "fieldOfView": {"id": "fov", "name": "Field of View", "passed": True, "score": 90},
                    "resolution": {"id": "resolution", "name": "Resolution", "passed": True, "score": 90},
                },
                "assessed_at": "2026-09-26T09:30:15Z",
            },
            "ai_prediction": {
                "dr_grade": 4,
                "dr_grade_name": "Grade 4 — Proliferative Diabetic Retinopathy (PDR)",
                "confidence_score": 74.2,
                "uncertainty_score": 0.258,
                "uncertainty_flag": True,
                "referable_dr": True,
                "referral_status": "URGENT_REFERRAL",
                "referral_recommendation": "URGENT Vitreoretinal Specialist referral required within 1-2 weeks. High risk of vision loss.",
                "class_probabilities": {
                    "grade0": 0.8,
                    "grade1": 1.5,
                    "grade2": 7.9,
                    "grade3": 15.6,
                    "grade4": 74.2,
                },
                "lesions": [
                    {"id": 1, "pathology": "neovascularization", "locationQuadrant": "Superior Nasal", "x": 42.1, "y": 38.5, "confidence": 94.8},
                    {"id": 3, "pathology": "hemorrhage", "locationQuadrant": "Superior Temporal", "x": 62.1, "y": 30.5, "confidence": 95.1},
                ],
                "lesion_counts": {"microaneurysms": 42, "hemorrhages": 34, "hardExudates": 26, "neovascularizations": 6, "total": 108},
                "quadrant_counts": {"superiorTemporal": 38, "superiorNasal": 26, "inferiorTemporal": 29, "inferiorNasal": 15},
                "clinical_rationale": "Neovascularization elsewhere (NVE) and near disc (NVD) with multi-quadrant flame hemorrhages indicating severe retinal ischemia.",
                "anatomical_distribution": "Pan-retinal involvement across all four quadrants with preretinal vascular fronds.",
                "macular_risk_assessment": "high",
                "visual_threat_assessment": "Imminent threat to central vision due to proliferative traction and vitreous hemorrhage risk.",
                "clinical_protocol": "Urgent tertiary vitreoretinal center referral for PRP laser therapy / anti-VEGF evaluation.",
                "recommended_followup_weeks": 2,
                "processing_time_ms": 1890,
                "model_version": "IRISaathi-Ordinal-DR-v3.2",
                "is_demo": True,
            },
            "explainability": {
                "target_class": 4,
                "target_class_label": "Grade 4 — Proliferative Diabetic Retinopathy (PDR)",
                "heatmap_path": "src/assets/images/gradcam_severe_pdr_1790493677922.jpg",
                "overlay_path": "src/assets/images/gradcam_severe_pdr_1790493677922.jpg",
                "description": "Intense focal Grad-CAM++ activation on neovascular fronds near optic disc and dense multi-quadrant hemorrhages.",
                "saliency_metadata": {"colormap": "jet", "peak_activation": 0.96},
            },
            "doctor_review": {
                "clinician_id": "USR-CL-01",
                "clinician_name": "Dr. Ananya Desai, MS (Ophthalmology)",
                "clinician_registration": "MCI / GMC-58291",
                "confirmed_grade": 4,
                "action_pathway": "urgent_retina_referral",
                "clinical_comments": "Confirmed PDR with neovascular fronds and extensive hemorrhage. Urgent tertiary vitreoretinal referral initiated.",
                "final_status": "signed",
                "is_signed": True,
                "review_date": "2026-09-26T10:15:00Z",
            },
            "referral": {
                "referral_status": "scheduled",
                "priority": "urgent",
                "reason": "Proliferative Diabetic Retinopathy (PDR) confirmed; urgent PRP laser / anti-VEGF evaluation required.",
                "target_facility": "Tertiary Vitreoretinal Center, Surat Civil / Bharuch",
                "target_specialty": "Vitreoretinal Surgery",
                "recommended_within_days": 7,
                "notes": "Patient contacted via local ASHA worker and SMS alert.",
                "follow_up_items": [
                    {"id": "fu-31", "title": "Urgent Vitreoretinal Specialist Consult", "dueDate": "2026-10-03", "interval": "1 Week", "status": "sent"},
                ],
            },
        },
        {
            "patient": {
                "patient_id": "PAT-2026-DEMO-QG",
                "name": "Meenaben P. [SYNTHETIC DEMO - UNGRADABLE]",
                "age": 58,
                "gender": "female",
                "mobile": "9800011223",
                "village": "Ankleshwar Rural",
                "district": "Bharuch",
                "state": "Gujarat",
                "diabetes_status": "suspected",
                "diabetes_duration_years": 3.0,
                "hba1c": None,
                "blood_glucose": 162.0,
                "previous_dr_history": "unknown",
                "previous_ophth_visit": "never",
                "symptoms": ["symptomBlurred"],
                "preferred_eye": "left",
                "is_anonymous": True,
                "registration_date": "2026-09-27T08:45:00Z",
            },
            "session": {
                "screening_id": "SCR-2026-DEMO-UNGRADABLE",
                "eye_side": "OS",
                "study_date": "2026-09-27T08:50:00Z",
                "health_centre": "Bharuch District Mobile Screening Unit",
                "operator_id": "OP-BHARUCH-03",
                "status": "quality_failed",
            },
            "image": {
                "file_path": "src/assets/images/retina_normal_1790485949561.jpg",
                "file_name": "fundus_os_20260927_0850_blur.jpg",
                "eye_side": "OS",
                "resolution": "512 × 512 px",
                "width_px": 512,
                "height_px": 512,
                "file_size_label": "0.38 MB",
                "captured_at": "2026-09-27T08:50:05Z",
            },
            "quality": {
                "overall_score": 48.0,
                "status": "failed",
                "is_gradable": False,
                "resolution_detail": "512 × 512",
                "issues": ["low_sharpness", "severe_underexposure", "off_center_fov"],
                "recapture_guidance": "Darken screening room, ask patient to fixate on central target, clean camera lens, and recapture non-mydriatic fundus image.",
                "metrics": {
                    "fundusDetected": {"id": "fundus", "name": "Fundus Detected", "passed": True, "score": 72},
                    "focusSharpness": {"id": "focus", "name": "Focus & Sharpness", "passed": False, "score": 38},
                    "illumination": {"id": "illumination", "name": "Illumination", "passed": False, "score": 42},
                    "fieldOfView": {"id": "fov", "name": "Field of View", "passed": False, "score": 50},
                    "resolution": {"id": "resolution", "name": "Resolution", "passed": False, "score": 45},
                },
                "assessed_at": "2026-09-27T08:50:12Z",
            },
            "ai_prediction": None,
            "explainability": None,
            "doctor_review": None,
            "referral": None,
        },
    ]

    for item in synthetic_cases:
        pid = item["patient"]["patient_id"]
        sid = item["session"]["screening_id"]

        if not db_service.get_patient(pid):
            db_service.create_patient(**item["patient"])

        if not db_service.get_screening_session(sid):
            db_service.create_screening_session(patient_id=pid, **item["session"])
            img = db_service.add_retinal_image(screening_id=sid, **item["image"])
            db_service.upsert_image_quality(screening_id=sid, image_id=img["image_id"], **item["quality"])

            if item["ai_prediction"] is not None:
                pred = db_service.upsert_ai_prediction(screening_id=sid, **item["ai_prediction"])
                if item["explainability"] is not None:
                    db_service.add_explainability_result(
                        screening_id=sid, prediction_id=pred["prediction_id"], **item["explainability"]
                    )
            if item["doctor_review"] is not None:
                db_service.upsert_doctor_review(screening_id=sid, **item["doctor_review"])
            if item["referral"] is not None:
                db_service.create_or_update_referral(screening_id=sid, patient_id=pid, **item["referral"])

            # Restore explicit final session status after helper transitions
            db_service.update_screening_status(sid, item["session"]["status"])
            seeded_ids.append(sid)

    return seeded_ids
