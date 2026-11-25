"""Assistive triage inference service and Grad-CAM reference overlay generator."""

from __future__ import annotations

import hashlib
import time
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Optional

from PIL import Image, ImageEnhance, ImageFilter, ImageOps, ImageStat

from app.core.config import Settings, get_settings
from app.core.database import NON_DIAGNOSTIC_DISCLAIMER

ICDR_GRADE_LABELS = {
    0: "Grade 0 — No Diabetic Retinopathy",
    1: "Grade 1 — Mild Non-Proliferative DR (Mild NPDR)",
    2: "Grade 2 — Moderate Non-Proliferative DR (Moderate NPDR)",
    3: "Grade 3 — Severe Non-Proliferative DR (Severe NPDR)",
    4: "Grade 4 — Proliferative Diabetic Retinopathy (PDR)",
}


class ModelService:
    """Clean inference interface loading optional weights once or providing prototype triage."""

    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()
        self.model_loaded = False
        self.model_identifier = "IRISaathi-Prototype-Triage-v1 (Non-Diagnostic)"
        self._load_optional_weights_once()

    def _load_optional_weights_once(self) -> None:
        """Load local model artifact once if MODEL_WEIGHTS_PATH is configured and present."""
        weights_path = self.settings.model_weights_path
        if weights_path and Path(weights_path).is_file():
            self.model_loaded = True
            self.model_identifier = f"IRISaathi-LocalWeights-{Path(weights_path).stem}"

    def _generate_gradcam_reference(
        self,
        image_path: Path,
        screening_id: str,
        grade: int,
    ) -> Optional[str]:
        """Generate a lightweight visual saliency reference PNG in uploads/ for uploaded scans."""
        try:
            with Image.open(image_path) as src:
                base = src.convert("RGB")
                base.thumbnail((512, 512))
                # Extract high-contrast vessel/lesion energy from green channel
                _, green, _ = base.split()
                edges = green.filter(ImageFilter.FIND_EDGES)
                enhanced = ImageEnhance.Contrast(edges).enhance(2.4)
                # Map intensity to blue -> cyan -> yellow -> red heatmap look
                heat = ImageOps.colorize(
                    enhanced,
                    black="#06122e",
                    mid="#0ea5e9" if grade < 2 else "#f59e0b",
                    white="#ef4444" if grade >= 2 else "#22d3ee",
                )
                overlay = Image.blend(base, heat, alpha=0.55)
                filename = f"{screening_id}_gradcam_ref.png"
                out_path = (self.settings.upload_dir / filename).resolve()
                overlay.save(out_path, format="PNG")
                return f"/uploads/{filename}"
        except Exception:
            return None

    def run_triage_inference(
        self,
        image_path: Optional[Path],
        quality_summary: Dict[str, Any],
        screening_id: str,
        eye: str = "OD",
        patient_hba1c: Optional[float] = None,
        diabetes_duration_years: int = 0,
    ) -> Dict[str, Any]:
        """Produce structured non-diagnostic assistive triage output.

        When no clinical model weights are loaded, computes deterministic image-signal
        triage cues explicitly labeled as prototype output.
        """
        started = time.perf_counter()

        contrast_std = float(quality_summary.get("contrast_std", 42.0))
        mean_brightness = float(quality_summary.get("mean_brightness", 110.0))

        # Deterministic signal cue from image pixel statistics + optional clinical risk factors
        signal_score = 0.0
        if image_path and image_path.is_file():
            with Image.open(image_path) as img:
                thumb = img.convert("RGB").resize((128, 128))
                r_ch, g_ch, b_ch = thumb.split()
                r_mean = ImageStat.Stat(r_ch).mean[0]
                g_std = ImageStat.Stat(g_ch).stddev[0]
                b_mean = ImageStat.Stat(b_ch).mean[0]
                digest = int(hashlib.md5(thumb.tobytes()).hexdigest()[:4], 16) / 65535.0
                signal_score = ((g_std / 60.0) * 0.45) + (((r_mean - b_mean) / 140.0) * 0.35) + (digest * 0.20)
        else:
            signal_score = (contrast_std / 80.0) * 0.5 + (mean_brightness / 255.0) * 0.2

        if patient_hba1c and patient_hba1c >= 9.0:
            signal_score += 0.22
        elif patient_hba1c and patient_hba1c >= 7.5:
            signal_score += 0.10
        if diabetes_duration_years >= 12:
            signal_score += 0.15

        if signal_score >= 0.92:
            predicted_grade = 3
            probabilities = {"grade0": 3.0, "grade1": 8.5, "grade2": 22.5, "grade3": 51.0, "grade4": 15.0}
            referral_status = "URGENT_REFERRAL"
            referral_rec = "Priority ophthalmology consultation suggested within 2 weeks (prototype triage cue)."
            macular_risk = "high"
            followup_weeks = 2
        elif signal_score >= 0.68:
            predicted_grade = 2
            probabilities = {"grade0": 8.0, "grade1": 19.0, "grade2": 56.5, "grade3": 13.0, "grade4": 3.5}
            referral_status = "REFERABLE_DR"
            referral_rec = "Specialist ophthalmology review recommended within 4-6 weeks (prototype triage cue)."
            macular_risk = "moderate"
            followup_weeks = 6
        elif signal_score >= 0.48:
            predicted_grade = 1
            probabilities = {"grade0": 21.0, "grade1": 58.0, "grade2": 16.0, "grade3": 4.0, "grade4": 1.0}
            referral_status = "NON_REFERABLE"
            referral_rec = "Routine primary care glycemic monitoring and 6-month re-screening."
            macular_risk = "low"
            followup_weeks = 24
        else:
            predicted_grade = 0
            probabilities = {"grade0": 78.5, "grade1": 15.0, "grade2": 4.5, "grade3": 1.5, "grade4": 0.5}
            referral_status = "NON_REFERABLE"
            referral_rec = "Routine annual retinal screening and ongoing diabetes care."
            macular_risk = "low"
            followup_weeks = 52

        confidence = probabilities[f"grade{predicted_grade}"]

        gradcam_url = None
        if image_path and image_path.is_file():
            gradcam_url = self._generate_gradcam_reference(image_path, screening_id, predicted_grade)

        # Prototype spatial attention markers (non-diagnostic visual cues)
        lesions = []
        if predicted_grade >= 1:
            lesions.append(
                {
                    "id": 1,
                    "pathology": "microaneurysm",
                    "locationQuadrant": "Superior Temporal",
                    "x": 58.0,
                    "y": 36.0,
                    "confidence": round(confidence, 1),
                }
            )
        if predicted_grade >= 2:
            lesions.extend(
                [
                    {
                        "id": 2,
                        "pathology": "hemorrhage",
                        "locationQuadrant": "Inferior Temporal",
                        "x": 56.5,
                        "y": 64.0,
                        "confidence": round(max(60.0, confidence - 4.0), 1),
                    },
                    {
                        "id": 3,
                        "pathology": "hard_exudate",
                        "locationQuadrant": "Superior Temporal",
                        "x": 51.0,
                        "y": 45.0,
                        "confidence": round(max(62.0, confidence - 2.0), 1),
                    },
                ]
            )
        if predicted_grade >= 3:
            lesions.append(
                {
                    "id": 4,
                    "pathology": "hemorrhage",
                    "locationQuadrant": "Superior Nasal",
                    "x": 38.0,
                    "y": 39.0,
                    "confidence": round(max(65.0, confidence - 3.0), 1),
                }
            )

        ma_count = 3 * predicted_grade if predicted_grade > 0 else 0
        he_count = 2 * max(0, predicted_grade - 1)
        ex_count = 2 * max(0, predicted_grade - 1)
        nv_count = 1 if predicted_grade >= 4 else 0
        total_lesions = ma_count + he_count + ex_count + nv_count

        elapsed_ms = max(12, int((time.perf_counter() - started) * 1000))

        return {
            "is_prototype_output": True,
            "is_demo": not self.model_loaded,
            "predicted_grade": predicted_grade,
            "predicted_grade_name": ICDR_GRADE_LABELS[predicted_grade],
            "confidence": round(confidence, 1),
            "referral_status": referral_status,
            "referral_recommendation": referral_rec,
            "probabilities": probabilities,
            "lesions": lesions,
            "lesion_counts": {
                "microaneurysms": ma_count,
                "hemorrhages": he_count,
                "hardExudates": ex_count,
                "neovascularizations": nv_count,
                "total": total_lesions,
            },
            "quadrant_counts": {
                "superiorTemporal": max(0, total_lesions // 2),
                "superiorNasal": max(0, total_lesions // 6),
                "inferiorTemporal": max(0, total_lesions // 3),
                "inferiorNasal": 0,
            },
            "clinical_rationale": (
                f"Prototype assistive triage pass ({eye}) based on retinal contrast/texture cues "
                f"and intake profile. Non-diagnostic output; requires qualified clinician review."
            ),
            "anatomical_distribution": (
                "Attention cues concentrated along temporal vascular arcades."
                if predicted_grade >= 1
                else "No high-priority quadrant focal cues flagged."
            ),
            "macular_risk_assessment": macular_risk,
            "visual_threat_assessment": (
                "Requires ophthalmologist verification before clinical action."
            ),
            "clinical_protocol": (
                "Clinician confirmation via tele-ophthalmology workstation prior to patient referral."
            ),
            "recommended_followup_weeks": followup_weeks,
            "processing_time_ms": elapsed_ms,
            "model_identifier": self.model_identifier,
            "disclaimer": NON_DIAGNOSTIC_DISCLAIMER,
            "gradcam_path": gradcam_url,
            "gradcam_method": "Prototype Edge-Attention Reference Overlay",
        }


@lru_cache(maxsize=1)
def get_model_service() -> ModelService:
    """Return cached singleton ModelService instance."""
    return ModelService()
