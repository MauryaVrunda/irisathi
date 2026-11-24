"""ReportLab PDF report generator for IRISaathi diabetic retinopathy screenings."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Image as RLImage
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from backend.database.models import utc_now
from backend.services.database_service import DR_GRADE_LABELS, DatabaseService

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_REPORT_DIR = Path(__file__).resolve().parents[1] / "generated_reports"

LANGUAGE_METADATA: dict[str, dict[str, str]] = {
    "en": {
        "label": "English (EN)",
        "report_title": "TELE-OPHTHALMOLOGY DIABETIC RETINOPATHY SCREENING REPORT",
        "subtitle": "IRISaathi — Intelligent Retinal Imaging & Explainable AI Screening System",
        "disclaimer_heading": "MEDICAL & CLINICAL DISCLAIMER",
        "disclaimer_body": (
            "IRISaathi is an AI-assisted diabetic retinopathy screening and referral support tool. "
            "AI outputs, severity grades, confidence scores, and Grad-CAM heatmaps are provided strictly "
            "for clinical decision support and triage, and are NOT a replacement for a comprehensive eye "
            "examination and medical diagnosis by a qualified ophthalmologist."
        ),
    },
    "gu": {
        "label": "Gujarati (GU) — Bilingual Clinical Summary",
        "report_title": "TELE-OPHTHALMOLOGY DIABETIC RETINOPATHY SCREENING REPORT [GU]",
        "subtitle": "IRISaathi — Rural Tele-Ophthalmology Screening (Gujarat Primary Health Network)",
        "disclaimer_heading": "MEDICAL & CLINICAL DISCLAIMER (GUJARAT SCREENING)",
        "disclaimer_body": (
            "IRISaathi is a screening and referral support tool (AI-assisted decision support only). "
            "Final diagnosis, treatment decisions, and ophthalmic management must be confirmed by a "
            "qualified ophthalmologist. [Gujarati patient counseling sheet available via SMS/PHC.]"
        ),
    },
    "hi": {
        "label": "Hindi (HI) — Bilingual Clinical Summary",
        "report_title": "TELE-OPHTHALMOLOGY DIABETIC RETINOPATHY SCREENING REPORT [HI]",
        "subtitle": "IRISaathi — Rural Tele-Ophthalmology Screening (National Primary Health Network)",
        "disclaimer_heading": "MEDICAL & CLINICAL DISCLAIMER (HINDI SCREENING)",
        "disclaimer_body": (
            "IRISaathi is a screening and referral support tool (AI-assisted decision support only). "
            "Final diagnosis, treatment decisions, and ophthalmic management must be confirmed by a "
            "qualified ophthalmologist. [Hindi patient counseling sheet available via SMS/PHC.]"
        ),
    },
}


def _safe_text(value: Any, fallback: str = "N/A") -> str:
    """Escape XML-sensitive characters and coerce values for ReportLab Paragraph rendering."""
    if value is None or value == "":
        return fallback
    text = str(value)
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _resolve_asset_path(raw_path: str | None) -> Path | None:
    """Resolve an image path on disk, supporting repo-relative '/src/...' and relative paths."""
    if not raw_path:
        return None
    candidate = Path(raw_path)
    if candidate.is_file():
        return candidate
    trimmed = raw_path.lstrip("/\\")
    repo_candidate = REPO_ROOT / trimmed
    if repo_candidate.is_file():
        return repo_candidate
    return None


def _grade_badge_color(grade: int | None) -> colors.Color:
    if grade is None:
        return colors.HexColor("#475569")
    if grade == 0:
        return colors.HexColor("#047857")
    if grade == 1:
        return colors.HexColor("#0F766E")
    if grade == 2:
        return colors.HexColor("#B45309")
    if grade == 3:
        return colors.HexColor("#C2410C")
    return colors.HexColor("#BE123C")


class ReportService:
    """Generates clinical PDF screening reports using ReportLab."""

    def __init__(
        self,
        db_service: DatabaseService | None = None,
        output_dir: str | Path | None = None,
    ) -> None:
        self.db_service = db_service
        self.output_dir = Path(output_dir) if output_dir else DEFAULT_REPORT_DIR
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate_pdf_report(
        self,
        screening_id: str | None = None,
        *,
        record: dict[str, Any] | None = None,
        output_path: str | Path | None = None,
        language: str = "en",
        persist_record: bool = True,
    ) -> dict[str, Any]:
        """
        Generate a downloadable PDF screening report from either a database screening_id
        or an explicit complete screening record dictionary.
        """
        lang = language.lower() if language else "en"
        if lang not in LANGUAGE_METADATA:
            raise ValueError(f"Unsupported report language '{language}'. Expected one of: en, gu, hi.")

        if record is None:
            if not screening_id or not self.db_service:
                raise ValueError("Provide either 'record' or both 'screening_id' and a DatabaseService instance.")
            record = self.db_service.get_complete_screening_record(screening_id)
            if not record:
                raise ValueError(f"Screening session '{screening_id}' was not found.")

        session_info = record.get("screening_session") or {}
        resolved_sid = screening_id or session_info.get("screening_id") or "UNKNOWN-SCREENING"

        if output_path:
            pdf_path = Path(output_path)
            pdf_path.parent.mkdir(parents=True, exist_ok=True)
        else:
            pdf_path = self.output_dir / f"IRISaathi_Report_{resolved_sid}_{lang.upper()}.pdf"

        self._build_pdf_document(pdf_path=pdf_path, record=record, language=lang)

        file_size = pdf_path.stat().st_size if pdf_path.exists() else 0
        metadata = {
            "file_size_bytes": file_size,
            "language_label": LANGUAGE_METADATA[lang]["label"],
            "has_ai_prediction": bool(record.get("ai_prediction")),
            "has_explainability": bool(record.get("explainability_results")),
            "has_doctor_review": bool(record.get("doctor_review")),
            "project": "IRISaathi (PS000001)",
        }

        db_report: dict[str, Any] | None = None
        if persist_record and self.db_service is not None and session_info.get("screening_id"):
            db_report = self.db_service.record_generated_report(
                screening_id=session_info["screening_id"],
                report_path=str(pdf_path),
                language=lang,
                report_format="pdf",
                report_metadata=metadata,
            )

        return {
            "report_path": str(pdf_path),
            "screening_id": resolved_sid,
            "language": lang,
            "file_size_bytes": file_size,
            "metadata": metadata,
            "database_record": db_report,
        }

    def _build_pdf_document(self, *, pdf_path: Path, record: dict[str, Any], language: str) -> None:
        lang_cfg = LANGUAGE_METADATA[language]
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            "IRI_Title",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#0F172A"),
            spaceAfter=2,
        )
        subtitle_style = ParagraphStyle(
            "IRI_Subtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#475569"),
        )
        section_header_style = ParagraphStyle(
            "IRI_SectionHeader",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=13,
            textColor=colors.HexColor("#0F172A"),
            spaceBefore=6,
            spaceAfter=4,
        )
        body_style = ParagraphStyle(
            "IRI_Body",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11.5,
            textColor=colors.HexColor("#1E293B"),
        )
        small_muted_style = ParagraphStyle(
            "IRI_SmallMuted",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=10,
            textColor=colors.HexColor("#64748B"),
        )
        disclaimer_style = ParagraphStyle(
            "IRI_Disclaimer",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#7F1D1D"),
        )

        patient = record.get("patient") or {}
        session_info = record.get("screening_session") or {}
        images = record.get("retinal_images") or []
        quality = record.get("image_quality_result") or {}
        ai_pred = record.get("ai_prediction")
        explain_list = record.get("explainability_results") or []
        doctor_review = record.get("doctor_review")
        referrals = record.get("referrals") or []

        generated_ts = utc_now().strftime("%Y-%m-%d %H:%M:%S UTC")

        doc = SimpleDocTemplate(
            str(pdf_path),
            pagesize=A4,
            leftMargin=14 * mm,
            rightMargin=14 * mm,
            topMargin=12 * mm,
            bottomMargin=12 * mm,
            title=f"IRISaathi Screening Report - {session_info.get('screening_id', '')}",
            author="IRISaathi Tele-Ophthalmology System",
        )

        story: list[Any] = []

        # ------------------------------------------------------------------
        # 1. Header & Screening Metadata
        # ------------------------------------------------------------------
        header_table = Table(
            [
                [
                    Paragraph(
                        f"<b>IRISaathi</b> · {_safe_text(lang_cfg['report_title'])}<br/>"
                        f"<font size='8' color='#475569'>{_safe_text(lang_cfg['subtitle'])}</font>",
                        title_style,
                    ),
                    Paragraph(
                        f"<b>Screening ID:</b> {_safe_text(session_info.get('screening_id'))}<br/>"
                        f"<b>Study Date:</b> {_safe_text(session_info.get('study_date'))}<br/>"
                        f"<b>Centre:</b> {_safe_text(session_info.get('health_centre'))}<br/>"
                        f"<b>Generated:</b> {generated_ts} · <b>Lang:</b> {language.upper()}",
                        small_muted_style,
                    ),
                ]
            ],
            colWidths=[112 * mm, 70 * mm],
        )
        header_table.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LINEBELOW", (0, 0), (-1, -1), 1.5, colors.HexColor("#0F172A")),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        story.append(header_table)
        story.append(Spacer(1, 5 * mm))

        # ------------------------------------------------------------------
        # 2. Patient Information & Diabetes History
        # ------------------------------------------------------------------
        story.append(Paragraph("1. PATIENT PROFILE & SCREENING METADATA", section_header_style))
        hba1c_val = f"{patient.get('hba1c')}%" if patient.get("hba1c") is not None else "N/A"
        glucose_val = f"{patient.get('blood_glucose')} mg/dL" if patient.get("blood_glucose") is not None else "N/A"
        patient_rows = [
            [
                Paragraph(f"<b>Patient ID:</b> {_safe_text(patient.get('patient_id'))}", body_style),
                Paragraph(f"<b>Name / Intake:</b> {_safe_text(patient.get('name'))}", body_style),
                Paragraph(
                    f"<b>Age / Gender:</b> {_safe_text(patient.get('age'))} yrs / {_safe_text(patient.get('gender')).upper()}",
                    body_style,
                ),
            ],
            [
                Paragraph(
                    f"<b>Location:</b> {_safe_text(patient.get('village'))}, {_safe_text(patient.get('district'))}, {_safe_text(patient.get('state'))}",
                    body_style,
                ),
                Paragraph(
                    f"<b>Diabetes:</b> {_safe_text(patient.get('diabetes_status'))} ({_safe_text(patient.get('diabetes_duration_years'))} yrs)",
                    body_style,
                ),
                Paragraph(f"<b>Eye Examined:</b> {_safe_text(session_info.get('eye_side'))}", body_style),
            ],
            [
                Paragraph(f"<b>HbA1c / Glucose:</b> {hba1c_val} / {glucose_val}", body_style),
                Paragraph(
                    f"<b>Prior Eye Exam:</b> {_safe_text(patient.get('previous_ophth_visit'))}", body_style
                ),
                Paragraph(
                    f"<b>Session Status:</b> {_safe_text(session_info.get('status')).upper()}", body_style
                ),
            ],
        ]
        patient_table = Table(patient_rows, colWidths=[61 * mm, 64 * mm, 57 * mm])
        patient_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                    ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#CBD5E1")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#E2E8F0")),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        story.append(patient_table)
        story.append(Spacer(1, 4 * mm))

        # ------------------------------------------------------------------
        # 3. Retinal Image Quality Gate Status
        # ------------------------------------------------------------------
        story.append(Paragraph("2. RETINAL IMAGE QUALITY ASSESSMENT", section_header_style))
        if quality:
            gradable_label = "GRADABLE" if quality.get("is_gradable") else "UNGRADABLE (RECAPTURE REQUIRED)"
            q_status = str(quality.get("status", "unknown")).upper()
            q_score = quality.get("overall_score", "N/A")
            issues = ", ".join(quality.get("issues") or []) or "None detected"
            guidance = quality.get("recapture_guidance") or "Image meets minimum quality threshold for AI screening."
            q_badge_bg = colors.HexColor("#ECFDF5") if quality.get("is_gradable") else colors.HexColor("#FEF2F2")

            quality_table = Table(
                [
                    [
                        Paragraph(f"<b>Gradability:</b> {gradable_label}", body_style),
                        Paragraph(f"<b>Status:</b> {q_status}", body_style),
                        Paragraph(f"<b>Quality Score:</b> {q_score}%", body_style),
                    ],
                    [
                        Paragraph(f"<b>Detected Issues:</b> {_safe_text(issues)}", body_style),
                        Paragraph(f"<b>Recapture Guidance:</b> {_safe_text(guidance)}", body_style),
                        Paragraph(f"<b>Resolution:</b> {_safe_text(quality.get('resolution_detail'))}", body_style),
                    ],
                ],
                colWidths=[65 * mm, 75 * mm, 42 * mm],
            )
            quality_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), q_badge_bg),
                        ("BACKGROUND", (0, 1), (-1, 1), colors.white),
                        ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#CBD5E1")),
                        ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#E2E8F0")),
                        ("TOPPADDING", (0, 0), (-1, -1), 4),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                        ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ]
                )
            )
            story.append(quality_table)
        else:
            story.append(Paragraph("No automated image quality record attached to this session.", body_style))
        story.append(Spacer(1, 4 * mm))

        # ------------------------------------------------------------------
        # 4. SECTION A: AI-GENERATED SCREENING OUTPUT (Clearly Separated)
        # ------------------------------------------------------------------
        story.append(
            Paragraph(
                "3. SECTION A — AI-GENERATED SCREENING OUTPUT (DECISION SUPPORT ONLY — NOT A DIAGNOSIS)",
                section_header_style,
            )
        )
        if ai_pred:
            dr_grade = ai_pred.get("dr_grade")
            grade_name = ai_pred.get("dr_grade_name") or DR_GRADE_LABELS.get(dr_grade, f"Grade {dr_grade}")
            conf = ai_pred.get("confidence_score")
            conf_str = f"{conf:.1f}%" if isinstance(conf, (int, float)) else "N/A"
            unc_score = ai_pred.get("uncertainty_score")
            unc_str = f"{unc_score:.3f}" if isinstance(unc_score, (int, float)) else "N/A"
            unc_flag = "ELEVATED UNCERTAINTY (Review Recommended)" if ai_pred.get("uncertainty_flag") else "Nominal"
            ref_flag = "YES — REFERABLE DR" if ai_pred.get("referable_dr") else "NO — NON-REFERABLE"
            probs = ai_pred.get("class_probabilities") or {}

            ai_summary_table = Table(
                [
                    [
                        Paragraph(
                            f"<b>AI Predicted DR Severity (ICDR 0-4):</b><br/>"
                            f"<font size='10'><b>{_safe_text(grade_name)}</b></font>",
                            body_style,
                        ),
                        Paragraph(
                            f"<b>Referable DR Flag:</b> {ref_flag}<br/>"
                            f"<b>Referral Status:</b> {_safe_text(ai_pred.get('referral_status'))}",
                            body_style,
                        ),
                    ],
                    [
                        Paragraph(
                            f"<b>AI Confidence:</b> {conf_str}<br/>"
                            f"<b>Uncertainty Score:</b> {unc_str} ({unc_flag})",
                            body_style,
                        ),
                        Paragraph(
                            f"<b>Model Version:</b> {_safe_text(ai_pred.get('model_version'))}<br/>"
                            f"<b>Macular Risk:</b> {_safe_text(ai_pred.get('macular_risk_assessment')).upper()}",
                            body_style,
                        ),
                    ],
                    [
                        Paragraph(
                            f"<b>Class Probabilities:</b> "
                            f"G0 (No DR): {probs.get('grade0', 0):.1f}% | "
                            f"G1 (Mild): {probs.get('grade1', 0):.1f}% | "
                            f"G2 (Mod): {probs.get('grade2', 0):.1f}% | "
                            f"G3 (Sev): {probs.get('grade3', 0):.1f}% | "
                            f"G4 (PDR): {probs.get('grade4', 0):.1f}%",
                            body_style,
                        ),
                        "",
                    ],
                    [
                        Paragraph(
                            f"<b>AI Clinical Rationale:</b> {_safe_text(ai_pred.get('clinical_rationale'))}",
                            body_style,
                        ),
                        "",
                    ],
                ],
                colWidths=[96 * mm, 86 * mm],
            )
            ai_summary_table.setStyle(
                TableStyle(
                    [
                        ("SPAN", (0, 2), (1, 2)),
                        ("SPAN", (0, 3), (1, 3)),
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EFF6FF")),
                        ("BOX", (0, 0), (-1, -1), 0.9, _grade_badge_color(dr_grade)),
                        ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
                        ("TOPPADDING", (0, 0), (-1, -1), 4),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                        ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ]
                )
            )
            story.append(ai_summary_table)
        else:
            story.append(
                Paragraph(
                    "AI diagnostic inference was not executed (e.g., blocked by Quality Gate or pending processing).",
                    body_style,
                )
            )
        story.append(Spacer(1, 4 * mm))

        # ------------------------------------------------------------------
        # 5. Retinal Image & Grad-CAM Explainability Evidence
        # ------------------------------------------------------------------
        story.append(Paragraph("4. RETINAL FUNDUS & GRAD-CAM EXPLAINABILITY EVIDENCE", section_header_style))
        primary_img = images[0] if images else {}
        primary_exp = explain_list[0] if explain_list else {}

        fundus_disk_path = _resolve_asset_path(primary_img.get("file_path"))
        gradcam_disk_path = _resolve_asset_path(
            primary_exp.get("overlay_path") or primary_exp.get("heatmap_path")
        )

        fundus_cell: Any = (
            RLImage(str(fundus_disk_path), width=46 * mm, height=46 * mm, kind="proportional")
            if fundus_disk_path
            else Paragraph(
                f"<i>Image file reference:</i><br/>{_safe_text(primary_img.get('file_path'))}", small_muted_style
            )
        )
        gradcam_cell: Any = (
            RLImage(str(gradcam_disk_path), width=46 * mm, height=46 * mm, kind="proportional")
            if gradcam_disk_path
            else Paragraph(
                f"<i>Grad-CAM file reference:</i><br/>{_safe_text(primary_exp.get('heatmap_path'))}",
                small_muted_style,
            )
        )

        evidence_table = Table(
            [
                [
                    Paragraph(
                        f"<b>Original Fundus Image ({_safe_text(primary_img.get('eye_side', session_info.get('eye_side')))})</b>",
                        body_style,
                    ),
                    Paragraph(
                        f"<b>Grad-CAM Explainability ({_safe_text(primary_exp.get('method', 'Grad-CAM++'))})</b>",
                        body_style,
                    ),
                ],
                [fundus_cell, gradcam_cell],
                [
                    Paragraph(
                        f"File: {_safe_text(primary_img.get('file_name'))}<br/>"
                        f"Path: {_safe_text(primary_img.get('file_path'))}",
                        small_muted_style,
                    ),
                    Paragraph(
                        f"Target Class: {_safe_text(primary_exp.get('target_class_label'))}<br/>"
                        f"Path: {_safe_text(primary_exp.get('heatmap_path'))}<br/>"
                        f"Description: {_safe_text(primary_exp.get('description'))}",
                        small_muted_style,
                    ),
                ],
            ],
            colWidths=[91 * mm, 91 * mm],
        )
        evidence_table.setStyle(
            TableStyle(
                [
                    ("ALIGN", (0, 1), (-1, 1), "CENTER"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
                    ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#CBD5E1")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#E2E8F0")),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        story.append(evidence_table)
        story.append(Spacer(1, 4 * mm))

        # ------------------------------------------------------------------
        # 6. SECTION B: CLINICIAN-CONFIRMED FINDINGS & REFERRAL (Human-in-the-Loop)
        # ------------------------------------------------------------------
        story.append(
            Paragraph(
                "5. SECTION B — DOCTOR-CONFIRMED FINDINGS & REFERRAL RECOMMENDATION (HUMAN-IN-THE-LOOP)",
                section_header_style,
            )
        )
        if doctor_review:
            conf_grade = doctor_review.get("confirmed_grade")
            conf_grade_label = DR_GRADE_LABELS.get(conf_grade, f"Grade {conf_grade}")
            agreement_text = "Confirmed AI Grade" if doctor_review.get("ai_agreement") else "Clinician Overrode AI Grade"
            review_rows = [
                [
                    Paragraph(
                        f"<b>Review Status:</b> {_safe_text(doctor_review.get('final_status')).upper()} "
                        f"({'Signed' if doctor_review.get('is_signed') else 'Unsigned'})",
                        body_style,
                    ),
                    Paragraph(
                        f"<b>Clinician Decision:</b> {agreement_text}<br/>"
                        f"<b>Confirmed Grade:</b> {_safe_text(conf_grade_label)}",
                        body_style,
                    ),
                ],
                [
                    Paragraph(
                        f"<b>Reviewing Doctor:</b> {_safe_text(doctor_review.get('clinician_name'))}<br/>"
                        f"<b>Registration:</b> {_safe_text(doctor_review.get('clinician_registration'))}",
                        body_style,
                    ),
                    Paragraph(
                        f"<b>Action Pathway:</b> {_safe_text(doctor_review.get('action_pathway'))}<br/>"
                        f"<b>Review Date:</b> {_safe_text(doctor_review.get('review_date'))}",
                        body_style,
                    ),
                ],
                [
                    Paragraph(
                        f"<b>Clinician Comments:</b> {_safe_text(doctor_review.get('clinical_comments'))}",
                        body_style,
                    ),
                    "",
                ],
            ]
        else:
            review_rows = [
                [
                    Paragraph(
                        "<b>Review Status:</b> PENDING TELE-OPHTHALMOLOGIST REVIEW",
                        body_style,
                    ),
                    Paragraph(
                        "<b>Confirmed Grade:</b> Not yet confirmed by a qualified clinician.",
                        body_style,
                    ),
                ],
                [
                    Paragraph(
                        "<b>Clinician Comments:</b> Awaiting human-in-the-loop verification before final clinical sign-off.",
                        body_style,
                    ),
                    "",
                ],
            ]

        primary_ref = referrals[0] if referrals else None
        if primary_ref:
            review_rows.append(
                [
                    Paragraph(
                        f"<b>Referral Status:</b> {_safe_text(primary_ref.get('referral_status')).upper()} · "
                        f"<b>Priority:</b> {_safe_text(primary_ref.get('priority')).upper()}<br/>"
                        f"<b>Target Facility:</b> {_safe_text(primary_ref.get('target_facility'))}",
                        body_style,
                    ),
                    Paragraph(
                        f"<b>Referral Reason:</b> {_safe_text(primary_ref.get('reason'))}<br/>"
                        f"<b>Notes:</b> {_safe_text(primary_ref.get('notes'))}",
                        body_style,
                    ),
                ]
            )
        else:
            review_rows.append(
                [
                    Paragraph("<b>Referral Recommendation:</b> No active referral recorded.", body_style),
                    Paragraph("Follow standard screening or recapture workflow.", body_style),
                ]
            )

        review_table = Table(review_rows, colWidths=[91 * mm, 91 * mm])
        review_table_styles = [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#ECFDF5") if doctor_review else colors.HexColor("#FFFBEB")),
            ("BOX", (0, 0), (-1, -1), 0.9, colors.HexColor("#0F766E") if doctor_review else colors.HexColor("#D97706")),
            ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ]
        if doctor_review:
            review_table_styles.append(("SPAN", (0, 2), (1, 2)))
        else:
            review_table_styles.append(("SPAN", (0, 1), (1, 1)))
        review_table.setStyle(TableStyle(review_table_styles))
        story.append(review_table)
        story.append(Spacer(1, 5 * mm))

        # ------------------------------------------------------------------
        # 7. Explicit Medical Disclaimer
        # ------------------------------------------------------------------
        disclaimer_table = Table(
            [
                [
                    Paragraph(
                        f"<b>{_safe_text(lang_cfg['disclaimer_heading'])}:</b> "
                        f"{_safe_text(lang_cfg['disclaimer_body'])}",
                        disclaimer_style,
                    )
                ],
                [
                    Paragraph(
                        "IRISaathi · Seva First Innovation Challenge 2026 (PS000001) · "
                        "Government Engineering College, Bharuch, Gujarat",
                        small_muted_style,
                    )
                ],
            ],
            colWidths=[182 * mm],
        )
        disclaimer_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#FEF2F2")),
                    ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#DC2626")),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        story.append(disclaimer_table)

        doc.build(story)
