# IRISaathi | AI-Assisted Diabetic Retinopathy Screening

<p align="center">
  <img src="https://img.shields.io/badge/Smart%20India%20Hackathon-2026-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Healthcare-AI%20Innovation-red?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Status-Prototype-orange?style=for-the-badge" />
</p>

<p align="center">
  <b>Making Retinal Screening More Accessible, Explainable and Reliable</b>
</p>

---

## About IRISaathi

**IRISaathi** is a web-based AI-assisted diabetic retinopathy screening platform designed to support the analysis of retinal fundus images through intelligent image processing, quality assessment, explainable AI and structured screening reports.

Instead of relying solely on a classification result, IRISaathi aims to combine retinal image quality assessment, AI-based severity classification, visual explainability and confidence-aware analysis to provide a more informative screening workflow.

The platform is designed with accessibility in mind, incorporating multilingual patient-friendly explanations and text-to-speech capabilities to make screening results easier to understand.

---

## The Problem

Diabetic Retinopathy (DR) is a diabetes-related eye condition that can affect vision if not detected and managed appropriately.

However, screening challenges include:

- Limited access to retinal screening facilities in underserved areas.
- Dependence on trained eye-care professionals for image interpretation.
- Poor-quality retinal images that may affect AI prediction reliability.
- AI systems that provide predictions without understandable visual explanations.
- Difficulty understanding medical screening reports among patients.
- Limited accessibility to screening information across language barriers.

---

## Our Proposed Solution

IRISaathi introduces an evidence-driven and reliability-aware screening workflow that combines AI classification with image quality assessment, explainability and patient-oriented communication.

The system processes retinal fundus images through a structured pipeline, evaluates technical image suitability, generates model predictions when the image is eligible for analysis, visualizes model attention and provides structured screening information.

The platform aims to support screening workflows, improve result interpretability and facilitate more informed follow-up decisions.

---

## Key Features

### 1. AI-Based Diabetic Retinopathy Classification

- Automated analysis of retinal fundus images using a deep learning model.
- Five-level DR severity classification.
- Structured prediction outputs.
- Designed for integration with a trained classification model.

| Grade | Classification |
|---|---|
| Grade 0 | No DR |
| Grade 1 | Mild NPDR |
| Grade 2 | Moderate NPDR |
| Grade 3 | Severe NPDR |
| Grade 4 | Proliferative DR (PDR) |

<sub>The classification is intended for screening support and requires appropriate clinical validation.</sub>

### 2. Retinal Image Quality Assessment

A quality assessment layer is designed to evaluate whether the uploaded image meets technical requirements before AI analysis.

The quality assessment module is intended to identify image-related issues that may affect the reliability of the screening pipeline.

Potential quality assessment parameters include:

- Image resolution.
- Image clarity and sharpness.
- Illumination and brightness.
- Image integrity and readability.
- Image suitability for further analysis.

<sub>The current preliminary backend checks are not a validated retinal image quality assessment system.</sub>

### 3. Grad-CAM Explainability

IRISaathi is designed to incorporate Grad-CAM (Gradient-weighted Class Activation Mapping) to visualize regions of the retinal image that influence the model's prediction.

- Visual representation of model attention.
- Heatmap-based interpretability.
- Original image and heatmap comparison.
- Designed to improve transparency of AI predictions.

<sub>Grad-CAM highlights model-associated regions and does not establish the presence of a lesion or provide clinical proof.</sub>

### 4. Confidence and Uncertainty Analysis

The system is designed to display model-associated confidence information and support uncertainty-aware screening.

- Probability distribution across supported classes.
- Confidence representation.
- Uncertainty-aware result handling.
- Potential identification of predictions requiring additional review.

<sub>Model confidence is not equivalent to clinical certainty. Uncertainty estimation requires appropriate model design and validation.</sub>

### 5. Comprehensive Screening Report

IRISaathi aims to generate structured screening reports containing relevant screening information.

- Screening classification.
- Severity grade.
- Quality assessment status.
- Model-associated confidence information.
- Explainability visualization, when available.
- Patient-friendly screening explanation.
- Recommended follow-up guidance.
- Screening details and timestamps.

### 6. Multilingual Support

Designed to improve accessibility through multilingual information presentation.

- English.
- Hindi.
- Gujarati.

The language layer is intended to translate patient-oriented explanations and screening information without changing the underlying model output.

### 7. Text-to-Speech (TTS)

Text-to-Speech functionality is designed to convert patient-oriented report explanations into audio.

- Audio-based report explanations.
- Improved accessibility for users with reading difficulties.
- Multilingual audio support, subject to available TTS integration.

### 8. Screening History

The platform is designed to maintain screening records for reviewing previous screening sessions.

- Screening record overview.
- Previous screening results.
- Date-based record organization.
- Screening result comparison, where supported.

### 9. District-Level Analytics

A planned analytics module to visualize screening-related statistics for aggregated screening data.

- Screening distribution.
- Severity distribution.
- Regional screening statistics.
- Aggregated screening trends.

<sub>Analytics depend on available, appropriately handled data and are not currently claimed to represent real-world epidemiological statistics.</sub>

### 10. Web-Based Accessibility

- Browser-based application.
- Responsive interface.
- Image upload workflow.
- Structured screening interface.
- Backend API integration.
- Designed for future deployment in screening environments.

---

## System Approach

IRISaathi follows a modular architecture that separates the frontend, backend processing, AI inference and report presentation.

### Workflow

1. **Image Upload:** The user uploads a retinal fundus image through the web interface.
2. **Image Validation:** The backend validates the uploaded file, image format and basic technical properties.
3. **Quality Assessment:** The image is evaluated against supported technical quality checks.
4. **AI Analysis:** Eligible images are passed to the integrated deep learning model.
5. **Classification:** The model generates a supported DR severity prediction.
6. **Explainability:** Grad-CAM is applied when supported by the integrated model.
7. **Confidence and Uncertainty:** Model-associated confidence and uncertainty information are processed where implemented.
8. **Report Generation:** Screening information is assembled into a structured response.
9. **Accessibility Layer:** The result can be presented in the selected language and converted into speech where supported.
10. **Review and History:** Screening records and summaries can be made available through the application as those modules are implemented.

---

## Technical Architecture

The platform uses a frontend-backend architecture with a modular AI integration layer.

### Frontend

The frontend provides the user interface for:

- Image upload.
- Screening workflow.
- Result presentation.
- Quality status.
- Prediction visualization.
- Report generation and presentation.
- Multilingual interactions.
- Screening history and dashboard modules.

### Backend

The backend is responsible for:

- API request handling.
- Image upload processing.
- Image validation.
- Preliminary quality checks.
- Screening workflow orchestration.
- AI model integration.
- Structured API responses.

### AI Processing Layer

The AI processing layer is designed to handle:

- Retinal image preprocessing.
- Deep learning inference.
- DR severity classification.
- Class probability outputs, where supported.
- Grad-CAM integration.
- Confidence and uncertainty-related processing.

### Reporting and Accessibility Layer

Designed to handle:

- Structured screening report data.
- Patient-friendly explanation.
- Language-specific content.
- Text-to-speech integration.
- Screening result presentation.

---

## Technology Stack

### Frontend

<p>
  <img src="https://img.shields.io/badge/React-2026?style=flat&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/TypeScript-2026?style=flat&logo=typescript&logoColor=3178C6" />
  <img src="https://img.shields.io/badge/Vite-2026?style=flat&logo=vite&logoColor=646CFF" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-2026?style=flat&logo=tailwindcss&logoColor=06B6D4" />
</p>

| Technology | Purpose |
|---|---|
| React | Building the user interface |
| TypeScript | Type-safe frontend development |
| Vite | Development server and build tool |
| Tailwind CSS | Styling and responsive UI development |
| JavaScript | Client-side application logic |

### Backend

<p>
  <img src="https://img.shields.io/badge/Python-2026?style=flat&logo=python&logoColor=3776AB" />
  <img src="https://img.shields.io/badge/FastAPI-2026?style=flat&logo=fastapi&logoColor=009688" />
  <img src="https://img.shields.io/badge/Uvicorn-2026?style=flat&logo=gunicorn&logoColor=green" />
</p>

| Technology | Purpose |
|---|---|
| Python | Backend development and AI integration |
| FastAPI | API development |
| Uvicorn | ASGI server |
| Pydantic | API data validation |
| Pydantic Settings | Configuration management |

### Image Processing

<p>
  <img src="https://img.shields.io/badge/OpenCV-2026?style=flat&logo=opencv&logoColor=white" />
  <img src="https://img.shields.io/badge/NumPy-2026?style=flat&logo=numpy&logoColor=013243" />
  <img src="https://img.shields.io/badge/Pillow-2026?style=flat" />
</p>

| Technology | Purpose |
|---|---|
| OpenCV | Image processing and image analysis |
| NumPy | Numerical operations |
| Pillow | Image loading and validation |

### AI and Machine Learning

<p>
  <img src="https://img.shields.io/badge/PyTorch-2026?style=flat&logo=pytorch&logoColor=EE4C2C" />
  <img src="https://img.shields.io/badge/Matplotlib-2026?style=flat&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/MATLAB-2026?style=flat&logo=mathworks&logoColor=orange" />
</p>

| Technology | Purpose |
|---|---|
| PyTorch | Deep learning model integration, subject to model implementation |
| Matplotlib | Visualization of supported analysis results |
| Grad-CAM | Explainability integration, when implemented |
| MATLAB / Simulink | Research and system optimization approach |

### Tools

<p>
  <img src="https://img.shields.io/badge/Git-2026?style=flat&logo=git&logoColor=F05032" />
  <img src="https://img.shields.io/badge/GitHub-2026?style=flat&logo=github&logoColor=white" />
  <img src="https://img.shields.io/badge/VS_Code-2026?style=flat&logo=visualstudiocode&logoColor=007ACC" />
</p>

| Tool | Purpose |
|---|---|
| Git | Version control |
| GitHub | Repository management and collaboration |
| VS Code | Development environment |

---

## API Overview

The backend exposes REST API endpoints through FastAPI.

### Health Check

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend availability |

### Screening Analysis

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/screenings/analyze` | Accept and process a retinal fundus image |

### Request Format

The screening endpoint accepts an image through multipart form data.

| Parameter | Type | Description |
|---|---|---|
| `file` | File | Retinal fundus image |

### Screening Response Design

The screening response is designed to include structured information such as:

- Screening status.
- Quality assessment status.
- Prediction status.
- Predicted grade and label, when inference is available.
- Probability values, when supported.
- Error or integration status.

Actual response fields depend on the implemented backend schema and integrated model.

### API Documentation

FastAPI provides interactive API documentation.

- Swagger UI: `/docs`
- ReDoc: `/redoc`

---

## Installation and Setup

### Prerequisites

- Python 3.10+
- Node.js
- npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/IRISaathi.git
cd IRISaathi
```

Replace `YOUR-USERNAME` with the actual GitHub username or organization.

### 2. Frontend Setup

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at the local address displayed by Vite.

### 3. Backend Setup

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment:

#### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

#### Linux / macOS

```bash
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the backend server:

```bash
uvicorn app.main:app --reload
```

Backend address:

```text
http://127.0.0.1:8000
```

### 4. Access API Documentation

```text
http://127.0.0.1:8000/docs
```

---

## Future Scope

- Integration of the trained diabetic retinopathy classification model.
- Improved retinal image quality assessment.
- Validated confidence calibration and uncertainty estimation.
- Grad-CAM visual explainability integration.
- Secure database integration.
- Patient record management.
- Screening history and report storage.
- Multilingual text-to-speech integration.
- Clinical validation and evaluation.
- Deployment and scalability improvements.
- Integration with appropriate healthcare workflows, subject to requirements and validation.

---

## Impact and Benefits

- **Accessibility:** A web-based screening interface designed to make retinal image analysis more accessible.
- **Interpretability:** Explainability mechanisms intended to provide insight into model-associated image regions.
- **Reliability Awareness:** Quality assessment and uncertainty-aware design intended to encourage cautious interpretation.
- **Patient Communication:** Multilingual explanations and speech-based accessibility.
- **Workflow Support:** Structured screening outputs for further review.
- **Scalability Potential:** Modular architecture for future integration and deployment.

---

## Limitations

- The platform is a prototype and is not a validated clinical diagnostic system.
- AI performance depends on the model, dataset, preprocessing and validation methodology.
- Preliminary technical image checks do not establish retinal image clinical quality.
- Grad-CAM, uncertainty estimation, database features and other modules may be pending integration.
- Model predictions must not be treated as confirmed medical diagnoses.
- Real-world deployment requires appropriate clinical validation, privacy safeguards, security and regulatory review.

---

## Disclaimer

IRISaathi is an AI-assisted diabetic retinopathy screening prototype developed for research, innovation and demonstration purposes.

It is not intended to replace ophthalmologists, professional medical examinations or clinical diagnosis. Any screening result should be reviewed by a qualified healthcare professional.

---

## Project Information

| Field | Details |
|---|---|
| Project Name | IRISaathi |
| Hackathon | Smart India Hackathon 2026 |
| Problem Statement | PS-38 |
| Domain | Healthcare / Artificial Intelligence |
| Application Type | Web Application |
| Frontend | React, TypeScript, Vite |
| Backend | Python, FastAPI |
| AI Domain | Retinal Image Analysis |
| Primary Objective | AI-assisted diabetic retinopathy screening |

---

<p align="center">
  <b>IRISaathi</b><br/>
  <i>Technology that supports accessibility, transparency and informed screening.</i>
</p>

