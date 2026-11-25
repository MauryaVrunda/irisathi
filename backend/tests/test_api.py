"""API integration tests for health, patients, screenings, reviews, referrals, and PDFs."""

from __future__ import annotations

import json

from fastapi.testclient import TestClient

from tests.conftest import make_synthetic_fundus_bytes


def test_health_and_cors_headers(client: TestClient) -> None:
    res = client.get(
        "/api/health",
        headers={"Origin": "http://localhost:5173"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["database"] == "ok"
    assert res.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_seed_demo_is_idempotent_and_lists_records(client: TestClient) -> None:
    res1 = client.post("/api/screenings/seed-demo")
    assert res1.status_code == 200
    assert res1.json()["seeded_count"] == 3

    res2 = client.post("/api/screenings/seed-demo")
    assert res2.status_code == 200
    assert res2.json()["seeded_count"] == 0
    assert res2.json()["total_screenings"] == 3

    list_res = client.get("/api/screenings")
    assert list_res.status_code == 200
    assert len(list_res.json()) == 3


def test_patient_crud_endpoints(client: TestClient) -> None:
    payload = {
        "id": "PAT-API-100",
        "name": "Meena P.",
        "age": 58,
        "gender": "female",
        "mobile": "9812345678",
        "village": "Gandevi",
        "district": "Navsari",
        "state": "Gujarat",
    }
    create_res = client.post("/api/patients", json=payload)
    assert create_res.status_code == 201
    assert create_res.json()["id"] == "PAT-API-100"

    get_res = client.get("/api/patients/PAT-API-100")
    assert get_res.status_code == 200
    assert get_res.json()["village"] == "Gandevi"


def test_quality_check_endpoint(client: TestClient) -> None:
    png_bytes = make_synthetic_fundus_bytes(size=(512, 512), sharp=True)
    ok_res = client.post(
        "/api/screenings/quality-check",
        files={"image": ("fundus.png", png_bytes, "image/png")},
    )
    assert ok_res.status_code == 200
    assert ok_res.json()["status"] == "passed"
    assert ok_res.json()["width_px"] == 512

    bad_res = client.post(
        "/api/screenings/quality-check",
        files={"image": ("bad.txt", b"hello", "text/plain")},
    )
    assert bad_res.status_code == 400


def test_full_screening_review_referral_and_pdf_flow(client: TestClient) -> None:
    png_bytes = make_synthetic_fundus_bytes(size=(640, 640), sharp=True)
    patient_payload = {
        "id": "PAT-FLOW-01",
        "name": "Suresh K.",
        "age": 62,
        "gender": "male",
        "mobile": "9898012345",
        "village": "Vansda",
        "diabetes_status": "diagnosed",
        "diabetes_duration_years": 14,
        "hba1c": 9.2,
    }

    create_res = client.post(
        "/api/screenings",
        data={
            "patient_json": json.dumps(patient_payload),
            "eye": "OS",
            "health_centre": "Vansda CHC",
            "screening_id": "SCR-FLOW-01",
        },
        files={"image": ("retinal_os.png", png_bytes, "image/png")},
    )
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["id"] == "SCR-FLOW-01"
    assert created["image"]["file_path"].startswith("app/storage/uploads/SCR-FLOW-01_")
    assert created["ai_result"]["is_prototype_output"] is True
    assert "non-diagnostic" in created["ai_result"]["disclaimer"].lower()
    assert created["ai_result"]["gradcam_path"].startswith("/uploads/SCR-FLOW-01_")

    # Search filter
    search_res = client.get("/api/screenings", params={"search": "Vansda", "eye": "OS"})
    assert search_res.status_code == 200
    assert len(search_res.json()) == 1

    # Submit doctor review
    review_res = client.put(
        "/api/screenings/SCR-FLOW-01/review",
        json={
            "clinician_id": "USR-CL-01",
            "clinician_name": "Dr. Ananya Desai, MS",
            "confirmed_grade": 2,
            "action_pathway": "ophthalmologist_referral",
            "clinical_remarks": "Reviewed fundus image and confirmed referral.",
            "is_signed": True,
        },
    )
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "reviewed"
    assert review_res.json()["doctor_review"]["confirmed_grade"] == 2

    # Update referral
    ref_res = client.patch(
        "/api/screenings/SCR-FLOW-01/referral",
        json={"status": "scheduled", "facility_name": "Navsari Civil Hospital"},
    )
    assert ref_res.status_code == 200
    assert ref_res.json()["referral"]["status"] == "scheduled"

    # Log SMS
    sms_res = client.post(
        "/api/screenings/SCR-FLOW-01/sms",
        json={"message_text": "Visit district hospital.", "language": "en"},
    )
    assert sms_res.status_code == 200
    assert len(sms_res.json()["referral"]["sms_sent_history"]) == 1

    # Download PDF report
    pdf_res = client.get("/api/screenings/SCR-FLOW-01/report/pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"].startswith("application/pdf")
    assert pdf_res.content.startswith(b"%PDF-")

    # Delete screening
    del_res = client.delete("/api/screenings/SCR-FLOW-01")
    assert del_res.status_code == 204
    missing_res = client.get("/api/screenings/SCR-FLOW-01")
    assert missing_res.status_code == 404
