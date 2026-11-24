"""FastAPI integration tests for IRISaathi backend endpoints and ReportLab PDF delivery."""

from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backend.main import create_app
from backend.tests.test_database_and_reports import extract_pdf_text_tokens


@pytest.fixture()
def api_client(tmp_path: Path) -> TestClient:
    """Create a FastAPI TestClient backed by an isolated SQLite DB and report directory."""
    db_file = tmp_path / "api_test.db"
    report_dir = tmp_path / "reports"
    app = create_app(db_url=f"sqlite:///{db_file.as_posix()}", report_dir=report_dir)
    return TestClient(app)


def test_health_and_cors_headers(api_client: TestClient) -> None:
    response = api_client.get(
        "/health",
        headers={"Origin": "http://localhost:3000"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "ready"
    assert data["project"] == "PS000001"
    assert "qualified ophthalmologist" in data["disclaimer"].lower()
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_seed_demo_and_list_endpoints(api_client: TestClient) -> None:
    seed_res = api_client.post("/api/seed-demo")
    assert seed_res.status_code == 200
    seed_payload = seed_res.json()
    assert seed_payload["seeded_count"] == 4
    assert seed_payload["total_screenings"] == 4

    # Idempotent second call
    seed_res_2 = api_client.post("/api/seed-demo")
    assert seed_res_2.status_code == 200
    assert seed_res_2.json()["seeded_count"] == 0

    patients_res = api_client.get("/api/patients")
    assert patients_res.status_code == 200
    assert patients_res.json()["count"] == 4

    screenings_res = api_client.get("/api/screenings")
    assert screenings_res.status_code == 200
    screenings_data = screenings_res.json()
    assert screenings_data["count"] == 4
    ids = {item["screening_session"]["screening_id"] for item in screenings_data["screenings"]}
    assert {"SCR-2026-0042", "SCR-2026-0043", "SCR-2026-0044", "SCR-2026-DEMO-UNGRADABLE"} == ids


def test_patient_screening_review_referral_and_pdf_pipeline(api_client: TestClient) -> None:
    # 1. Create patient via POST /api/patients
    patient_res = api_client.post(
        "/api/patients",
        json={
            "patient_id": "PAT-API-1001",
            "name": "Kiranbhai S. [TEST]",
            "age": 59,
            "gender": "male",
            "mobile": "9876501234",
            "village": "Ankleshwar",
            "district": "Bharuch",
            "state": "Gujarat",
            "diabetes_status": "diagnosed",
            "diabetes_duration_years": 11.0,
            "hba1c": 8.6,
            "blood_glucose": 205.0,
        },
    )
    assert patient_res.status_code == 201
    assert patient_res.json()["patient"]["patient_id"] == "PAT-API-1001"

    # 2. Create full screening bundle via POST /api/screenings
    screening_res = api_client.post(
        "/api/screenings",
        json={
            "screening_id": "SCR-API-1001",
            "patient_id": "PAT-API-1001",
            "eye_side": "OD",
            "health_centre": "Bharuch PHC",
            "status": "pending_review",
            "retinal_image": {
                "file_path": "src/assets/images/retina_moderate_npdr_1790485959942.jpg",
                "file_name": "fundus_od_api.jpg",
                "eye_side": "OD",
                "resolution": "1536 × 1536 px",
            },
            "quality_result": {
                "overall_score": 92.0,
                "status": "passed",
                "resolution_detail": "1536 × 1536",
            },
            "ai_prediction": {
                "dr_grade": 2,
                "class_probabilities": {
                    "grade0": 4.0,
                    "grade1": 14.0,
                    "grade2": 69.0,
                    "grade3": 10.0,
                    "grade4": 3.0,
                },
                "confidence_score": 69.0,
                "model_version": "IRISaathi-Ordinal-DR-v3.2",
                "clinical_rationale": "Multiple microaneurysms and exudates in temporal quadrant.",
            },
            "explainability_result": {
                "target_class": 2,
                "heatmap_path": "src/assets/images/gradcam_moderate_npdr_1790493664120.jpg",
                "overlay_path": "src/assets/images/gradcam_moderate_npdr_1790493664120.jpg",
                "description": "Grad-CAM++ highlights temporal arcade exudates.",
            },
        },
    )
    assert screening_res.status_code == 201
    bundle = screening_res.json()
    assert bundle["screening_session"]["screening_id"] == "SCR-API-1001"
    assert bundle["ai_prediction"]["dr_grade"] == 2
    assert bundle["ai_prediction"]["referable_dr"] is True

    # 3. Clinician human-in-the-loop review
    review_res = api_client.post(
        "/api/screenings/SCR-API-1001/review",
        json={
            "clinician_id": "USR-CL-01",
            "clinician_name": "Dr. Ananya Desai, MS (Ophthalmology)",
            "clinician_registration": "MCI / GMC-58291",
            "confirmed_grade": 2,
            "action_pathway": "ophthalmologist_referral",
            "clinical_comments": "Concur with AI Grade 2 Moderate NPDR. Refer for macular OCT.",
            "is_signed": True,
        },
    )
    assert review_res.status_code == 200
    assert review_res.json()["doctor_review"]["ai_agreement"] is True
    assert review_res.json()["doctor_review"]["is_signed"] is True

    # 4. Referral creation
    referral_res = api_client.post(
        "/api/screenings/SCR-API-1001/referral",
        json={
            "referral_status": "scheduled",
            "priority": "high",
            "reason": "Moderate NPDR with temporal exudates; OCT required.",
            "target_facility": "Bharuch District Eye Hospital",
            "recommended_within_days": 21,
            "notes": "ASHA worker notified.",
        },
    )
    assert referral_res.status_code == 200
    assert referral_res.json()["referral"]["priority"] == "high"
    assert referral_res.json()["screening"]["screening_session"]["status"] == "referred"

    # 5. Generate report metadata + download PDF
    report_meta_res = api_client.post(
        "/api/screenings/SCR-API-1001/report",
        json={"language": "en"},
    )
    assert report_meta_res.status_code == 200
    report_meta = report_meta_res.json()
    assert report_meta["download_url"] == "/api/screenings/SCR-API-1001/report/pdf?language=en"
    assert "qualified ophthalmologist" in report_meta["disclaimer"].lower()

    pdf_res = api_client.get("/api/screenings/SCR-API-1001/report/pdf?language=en")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert pdf_res.content.startswith(b"%PDF")
    assert "qualified ophthalmologist" in pdf_res.headers.get("x-irisaathi-disclaimer", "").lower()

    # Write temp PDF and inspect rendered text tokens
    temp_pdf = Path(report_meta["report_path"])
    assert temp_pdf.is_file()
    rendered_text = extract_pdf_text_tokens(temp_pdf)
    assert "SCR-API-1001" in rendered_text
    assert "PAT-API-1001" in rendered_text
    assert "SECTION A" in rendered_text
    assert "SECTION B" in rendered_text
    assert "qualified ophthalmologist" in rendered_text


def test_not_found_and_conflict_responses(api_client: TestClient) -> None:
    assert api_client.get("/api/screenings/SCR-DOES-NOT-EXIST").status_code == 404
    assert api_client.get("/api/screenings/SCR-DOES-NOT-EXIST/report/pdf").status_code == 404
    assert (
        api_client.post(
            "/api/screenings/SCR-DOES-NOT-EXIST/review",
            json={
                "clinician_id": "USR-1",
                "clinician_name": "Dr. Test",
                "confirmed_grade": 0,
                "action_pathway": "routine_rescreen",
            },
        ).status_code
        == 404
    )
