"""Automated tests for IRISaathi SQLite/SQLAlchemy database, CRUD, seeder, and ReportLab PDF generation."""

from __future__ import annotations

import base64
import re
import zlib
from pathlib import Path

import pytest
from sqlalchemy import inspect
from sqlalchemy.exc import IntegrityError

from backend.services.database_service import DatabaseService, seed_synthetic_data
from backend.services.report_service import ReportService


def extract_pdf_text_tokens(pdf_path: Path) -> str:
    """Decode ReportLab PDF content streams (ASCII85 + FlateDecode) to inspect rendered text."""
    raw = pdf_path.read_bytes()
    chunks: list[str] = []
    for match in re.finditer(rb"<<(.*?)>>\s*stream\r?\n(.*?)\r?\n?endstream", raw, flags=re.DOTALL):
        header, stream_data = match.group(1), match.group(2)
        if b"/Subtype /Image" in header:
            continue
        decoded = stream_data
        if b"/ASCII85Decode" in header:
            try:
                decoded = base64.a85decode(decoded.strip(), adobe=True)
            except Exception:
                pass
        if b"/FlateDecode" in header:
            try:
                decoded = zlib.decompress(decoded)
            except zlib.error:
                pass
        chunks.append(decoded.decode("latin-1", errors="ignore"))

    joined = "\n".join(chunks)
    # Unescape PDF escaped parentheses so parenthetical titles like (DECISION SUPPORT ONLY) stay intact
    unescaped = joined.replace(r"\(", "(").replace(r"\)", ")")
    # Also decode ReportLab's ASCII85/raw literal strings; simple match over non-nested Tj/TJ strings
    literals = re.findall(r"\((.*?)\)\s*(?:Tj|'|\"|\])", unescaped)
    if not literals:
        literals = re.findall(r"\(([^()]*)\)", unescaped)
    return " ".join(literals)


@pytest.fixture()
def db_service(tmp_path: Path) -> DatabaseService:
    """Provide an isolated SQLite database per test."""
    db_file = tmp_path / "test_irisaathi.db"
    return DatabaseService(db_url=f"sqlite:///{db_file.as_posix()}")


def test_schema_creation_has_all_nine_tables(db_service: DatabaseService) -> None:
    inspector = inspect(db_service.engine)
    tables = set(inspector.get_table_names())
    expected_tables = {
        "patients",
        "screening_sessions",
        "retinal_images",
        "image_quality_results",
        "ai_predictions",
        "explainability_results",
        "doctor_reviews",
        "referrals",
        "generated_reports",
    }
    assert expected_tables.issubset(tables)


def test_foreign_key_and_check_constraints(db_service: DatabaseService) -> None:
    # Cannot create a screening session for a non-existent patient
    with pytest.raises(ValueError, match="does not exist"):
        db_service.create_screening_session(
            screening_id="SCR-INVALID-01",
            patient_id="PAT-MISSING",
            health_centre="Test PHC",
        )

    patient = db_service.create_patient(
        patient_id="PAT-TEST-001",
        name="Test Synthetic Patient",
        age=55,
        gender="male",
        mobile="9999900001",
        village="Bharuch Rural",
        district="Bharuch",
    )
    session = db_service.create_screening_session(
        screening_id="SCR-TEST-001",
        patient_id=patient["patient_id"],
        eye_side="OD",
        health_centre="Bharuch PHC",
    )

    # DR grade outside 0-4 must fail
    with pytest.raises(ValueError, match="between 0 and 4"):
        db_service.upsert_ai_prediction(
            screening_id=session["screening_id"],
            dr_grade=5,
            class_probabilities={"grade0": 100.0},
            confidence_score=90.0,
            model_version="IRISaathi-Test",
        )

    # Invalid quality status violates SQLite CHECK constraint
    with pytest.raises(IntegrityError):
        db_service.upsert_image_quality(
            screening_id=session["screening_id"],
            overall_score=85.0,
            status="invalid_status",
        )


def test_full_crud_workflow_and_cascade_delete(db_service: DatabaseService) -> None:
    # 1. Create & update patient
    created_patient = db_service.create_patient(
        patient_id="PAT-CRUD-01",
        name="Asha K. [TEST]",
        age=49,
        gender="female",
        mobile="9876543210",
        village="Jambusar",
        district="Bharuch",
        diabetes_status="diagnosed",
        diabetes_duration_years=6.5,
        hba1c=7.8,
        blood_glucose=172.0,
    )
    assert created_patient["patient_id"] == "PAT-CRUD-01"

    updated_patient = db_service.update_patient("PAT-CRUD-01", hba1c=7.5, age=50)
    assert updated_patient is not None
    assert updated_patient["hba1c"] == 7.5
    assert updated_patient["age"] == 50

    assert len(db_service.list_patients(district="Bharuch")) == 1

    # 2. Screening session + retinal image metadata (no binary blob)
    session = db_service.create_screening_session(
        screening_id="SCR-CRUD-01",
        patient_id="PAT-CRUD-01",
        eye_side="OS",
        health_centre="Jambusar CHC",
    )
    img = db_service.add_retinal_image(
        screening_id=session["screening_id"],
        file_path="src/assets/images/retina_moderate_npdr_1790485959942.jpg",
        file_name="fundus_os_crud.jpg",
        eye_side="OS",
        width_px=1536,
        height_px=1536,
        file_size_bytes=1617920,
    )
    assert img["file_name"] == "fundus_os_crud.jpg"
    assert len(db_service.get_retinal_images("SCR-CRUD-01")) == 1

    # 3. Quality gate assessment
    quality = db_service.upsert_image_quality(
        screening_id="SCR-CRUD-01",
        image_id=img["image_id"],
        overall_score=90.5,
        status="passed",
        resolution_detail="1536 × 1536",
    )
    assert quality["is_gradable"] is True

    # 4. AI prediction + Grad-CAM explainability
    prediction = db_service.upsert_ai_prediction(
        screening_id="SCR-CRUD-01",
        dr_grade=2,
        class_probabilities={"grade0": 5.0, "grade1": 15.0, "grade2": 65.0, "grade3": 12.0, "grade4": 3.0},
        confidence_score=65.0,
        model_version="IRISaathi-Ordinal-DR-v3.2",
        clinical_rationale="Moderate NPDR lesions in temporal arcade.",
    )
    assert prediction["referable_dr"] is True
    assert prediction["uncertainty_flag"] is True
    assert prediction["uncertainty_score"] == pytest.approx(0.35, abs=1e-4)

    explain = db_service.add_explainability_result(
        screening_id="SCR-CRUD-01",
        target_class=2,
        heatmap_path="src/assets/images/gradcam_moderate_npdr_1790493664120.jpg",
        description="Temporal arcade hotspot.",
    )
    assert explain["prediction_id"] == prediction["prediction_id"]

    # 5. Doctor review overrides AI grade 2 -> 3
    review = db_service.upsert_doctor_review(
        screening_id="SCR-CRUD-01",
        clinician_id="USR-CL-02",
        clinician_name="Dr. Rajesh Patel, MS",
        clinician_registration="GMC-44120",
        confirmed_grade=3,
        action_pathway="urgent_retina_referral",
        clinical_comments="Upgraded to Severe NPDR due to 4-quadrant hemorrhages.",
        is_signed=True,
    )
    assert review["ai_agreement"] is False
    assert review["confirmed_grade"] == 3

    # 6. Referral & generated report tracking
    referral = db_service.create_or_update_referral(
        screening_id="SCR-CRUD-01",
        referral_status="scheduled",
        priority="high",
        reason="Severe NPDR confirmed by tele-ophthalmologist.",
        target_facility="Bharuch Civil Eye Hospital",
        recommended_within_days=14,
    )
    assert referral["patient_id"] == "PAT-CRUD-01"
    assert len(db_service.list_referrals(priority="high")) == 1

    bundle = db_service.get_complete_screening_record("SCR-CRUD-01")
    assert bundle is not None
    assert bundle["patient"]["patient_id"] == "PAT-CRUD-01"
    assert bundle["ai_prediction"]["dr_grade"] == 2
    assert bundle["doctor_review"]["confirmed_grade"] == 3
    assert len(bundle["explainability_results"]) == 1
    assert len(bundle["referrals"]) == 1

    # 7. Cascade delete removes patient and dependent records
    assert db_service.delete_patient("PAT-CRUD-01") is True
    assert db_service.get_patient("PAT-CRUD-01") is None
    assert db_service.get_screening_session("SCR-CRUD-01") is None
    assert db_service.list_referrals(patient_id="PAT-CRUD-01") == []


def test_seed_synthetic_data_and_queries(db_service: DatabaseService) -> None:
    first_run = seed_synthetic_data(db_service)
    assert len(first_run) == 4
    assert set(first_run) == {
        "SCR-2026-0042",
        "SCR-2026-0043",
        "SCR-2026-0044",
        "SCR-2026-DEMO-UNGRADABLE",
    }

    # Calling seeder again must be idempotent
    second_run = seed_synthetic_data(db_service)
    assert second_run == []

    referable = db_service.list_screening_sessions(referable_only=True)
    assert {item["screening_id"] for item in referable} == {"SCR-2026-0043", "SCR-2026-0044"}

    grade4 = db_service.list_screening_sessions(dr_grade=4)
    assert [item["screening_id"] for item in grade4] == ["SCR-2026-0044"]

    failed_qg = db_service.list_screening_sessions(status="quality_failed")
    assert [item["screening_id"] for item in failed_qg] == ["SCR-2026-DEMO-UNGRADABLE"]


def test_pdf_report_generation_for_all_workflow_states(
    db_service: DatabaseService, tmp_path: Path
) -> None:
    seed_synthetic_data(db_service)
    report_service = ReportService(db_service=db_service, output_dir=tmp_path / "reports")

    # 1. Grade 4 Urgent PDR with Grad-CAM preview & signed doctor review
    res_pdr = report_service.generate_pdf_report("SCR-2026-0044", language="en")
    pdf_pdr = Path(res_pdr["report_path"])
    assert pdf_pdr.is_file()
    assert pdf_pdr.read_bytes().startswith(b"%PDF")
    assert res_pdr["file_size_bytes"] > 5000
    assert res_pdr["database_record"] is not None

    pdf_text = extract_pdf_text_tokens(pdf_pdr)
    assert "SCR-2026-0044" in pdf_text
    assert "PAT-2026-X1933" in pdf_text
    assert "SECTION A" in pdf_text
    assert "SECTION B" in pdf_text
    assert "Grad-CAM" in pdf_text
    assert "qualified ophthalmologist" in pdf_text

    # 2. Grade 2 Moderate NPDR pending doctor review, Gujarati metadata variant
    res_mod = report_service.generate_pdf_report("SCR-2026-0043", language="gu")
    pdf_mod = Path(res_mod["report_path"])
    assert pdf_mod.is_file()
    assert pdf_mod.read_bytes().startswith(b"%PDF")
    mod_text = extract_pdf_text_tokens(pdf_mod)
    assert "PENDING TELE-OPHTHALMOLOGIST REVIEW" in mod_text

    # 3. Ungradable Quality-Failed case without AI prediction, Hindi metadata variant
    res_qg = report_service.generate_pdf_report("SCR-2026-DEMO-UNGRADABLE", language="hi")
    pdf_qg = Path(res_qg["report_path"])
    assert pdf_qg.is_file()
    assert pdf_qg.read_bytes().startswith(b"%PDF")
    qg_text = extract_pdf_text_tokens(pdf_qg)
    assert "UNGRADABLE" in qg_text

    # Verify generated_reports persistence
    stored_reports = db_service.list_generated_reports()
    assert len(stored_reports) == 3
    assert len(db_service.list_generated_reports(screening_id="SCR-2026-0044")) == 1
