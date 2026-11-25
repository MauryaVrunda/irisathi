# IRISaathi Backend API

FastAPI + SQLAlchemy (SQLite) backend for the **IRISaathi** tele-ophthalmology assistive retinal screening prototype.

> **Medical Disclaimer:** AI predictions and Grad-CAM++ reference overlays returned by this service are non-diagnostic prototype triage outputs intended solely for decision support and demonstration. All clinical determinations must be made by a qualified ophthalmologist or licensed medical practitioner.

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── health.py
│   │   ├── screening.py
│   │   └── patients.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── cors.py
│   │   ├── database.py
│   │   └── models.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── screening.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── image_service.py
│   │   ├── quality_service.py
│   │   ├── screening_service.py
│   │   └── model_service.py
│   ├── utils/
│   │   ├── __init__.py
│   │   └── image_utils.py
│   └── storage/
│       ├── uploads/
│       └── reports/
├── tests/
├── requirements.txt
├── .env
├── .env.example
└── README.md
```

## Setup & Run

```powershell
cd backend
..\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env -Force
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Key Endpoints

- `GET /api/health` — Service & SQLite health check
- `GET /api/patients`, `POST /api/patients`, `GET /api/patients/{id}` — Patient registry
- `GET /api/screenings`, `POST /api/screenings`, `GET /api/screenings/{id}` — Screening sessions & retinal image upload
- `POST /api/screenings/quality-check` — Real Pillow-based retinal image quality inspection
- `POST /api/screenings/seed-demo` — Idempotent synthetic demo data seeder
- `PUT /api/screenings/{id}/review` — Clinician review & sign-off
- `PATCH /api/screenings/{id}/referral` — Referral status & facility updates
- `GET /api/screenings/{id}/report/pdf` — Downloadable ReportLab clinical PDF report

## Tests

```powershell
cd backend
..\.venv\Scripts\python.exe -m pytest -v
```
