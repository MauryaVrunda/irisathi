"""Unit tests for image utilities, quality checks, model service, and PDF reports."""

from __future__ import annotations

from pathlib import Path

import pytest

from app.core.config import Settings
from app.services.image_service import ImageService
from app.services.model_service import ModelService
from app.services.quality_service import QualityService
from app.services.screening_service import ScreeningService
from app.utils.image_utils import ImageValidationError, safe_resolve_within
from tests.conftest import make_synthetic_fundus_bytes


def test_image_service_saves_and_validates(test_settings: Settings) -> None:
    service = ImageService(settings=test_settings)
    png_bytes = make_synthetic_fundus_bytes(size=(512, 512), sharp=True, image_format="PNG")

    saved = service.save_upload(
        content=png_bytes,
        original_filename="../../retinal_scan.png",
        screening_id="SCR-TEST-01",
    )

    assert saved.file_name == "retinal_scan.png"
    assert saved.width_px == 512
    assert saved.height_px == 512
    assert saved.file_path.startswith("app/storage/uploads/SCR-TEST-01_")
    assert (test_settings.upload_dir / Path(saved.file_path).name).is_file()


def test_image_service_rejects_invalid_extension_and_payload(test_settings: Settings) -> None:
    service = ImageService(settings=test_settings)

    with pytest.raises(ImageValidationError):
        service.save_upload(b"not-an-image", "notes.txt", "SCR-TEST-02")

    with pytest.raises(ImageValidationError):
        service.save_upload(b"corrupt-bytes", "scan.jpg", "SCR-TEST-03")


def test_safe_resolve_within_prevents_traversal(tmp_path: Path) -> None:
    resolved = safe_resolve_within(tmp_path, "../../etc/passwd.png")
    assert resolved.parent == tmp_path.resolve()


def test_quality_service_distinguishes_sharp_vs_blank(test_settings: Settings) -> None:
    img_service = ImageService(settings=test_settings)
    quality_service = QualityService()

    sharp_bytes = make_synthetic_fundus_bytes(size=(640, 640), sharp=True)
    sharp_info = img_service.save_upload(sharp_bytes, "sharp.png", "SCR-Q-1")
    sharp_path = test_settings.upload_dir / Path(sharp_info.file_path).name
    sharp_q = quality_service.assess_image_file(sharp_path)

    dark_bytes = make_synthetic_fundus_bytes(size=(128, 128), sharp=False)
    dark_info = img_service.save_upload(dark_bytes, "dark.png", "SCR-Q-2")
    dark_path = test_settings.upload_dir / Path(dark_info.file_path).name
    dark_q = quality_service.assess_image_file(dark_path)

    assert sharp_q["width_px"] == 640
    assert sharp_q["overall_score"] > dark_q["overall_score"]
    assert sharp_q["sharpness_score"] > dark_q["sharpness_score"]
    assert dark_q["sharpness_score"] == 0.0
    assert sharp_q["status"] == "passed"
    assert dark_q["status"] == "failed"


def test_model_service_returns_non_diagnostic_prototype_output(test_settings: Settings) -> None:
    img_service = ImageService(settings=test_settings)
    model_service = ModelService(settings=test_settings)
    png_bytes = make_synthetic_fundus_bytes(size=(512, 512), sharp=True)
    saved = img_service.save_upload(png_bytes, "fundus.png", "SCR-M-1")
    img_path = test_settings.upload_dir / Path(saved.file_path).name

    result = model_service.run_triage_inference(
        image_path=img_path,
        quality_summary={"contrast_std": 45.0, "mean_brightness": 115.0},
        screening_id="SCR-M-1",
    )

    assert result["is_prototype_output"] is True
    assert "non-diagnostic" in result["disclaimer"].lower()
    assert 0 <= result["predicted_grade"] <= 4
    assert result["gradcam_path"] is not None
    assert (test_settings.upload_dir / Path(result["gradcam_path"]).name).is_file()


def test_screening_service_generates_reportlab_pdf(test_settings: Settings, db_session) -> None:
    service = ScreeningService(
        settings=test_settings,
        model_service=ModelService(settings=test_settings),
    )
    png_bytes = make_synthetic_fundus_bytes(size=(512, 512), sharp=True)

    session = service.create_screening_with_upload(
        db=db_session,
        patient_payload={
            "id": "PAT-UNIT-01",
            "name": "Test Patient",
            "age": 55,
            "gender": "female",
            "mobile": "9876543210",
            "village": "Chikhli",
        },
        eye="OD",
        image_bytes=png_bytes,
        image_filename="eye.png",
        screening_id="SCR-PDF-01",
    )
    service.submit_doctor_review(
        db=db_session,
        screening_id=session.id,
        clinician_id="USR-CL-01",
        clinician_name="Dr. Ananya Desai",
        confirmed_grade=session.ai_prediction.predicted_grade,
        action_pathway="ophthalmologist_referral",
        clinical_remarks="Confirmed for specialist follow-up.",
    )

    pdf_path, file_name = service.generate_pdf_report(db=db_session, screening_id=session.id)
    assert file_name == "SCR-PDF-01_clinical_report.pdf"
    assert pdf_path.is_file()
    raw_pdf = pdf_path.read_bytes()
    assert raw_pdf.startswith(b"%PDF-")
    assert len(raw_pdf) > 1500
