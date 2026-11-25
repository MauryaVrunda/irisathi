"""Real image-based retinal quality assessment service."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

from PIL import Image, ImageFilter, ImageStat

from app.utils.image_utils import ImageValidationError


class QualityService:
    """Computes objective image quality metrics (dimensions, brightness, contrast, sharpness)."""

    def assess_image_file(self, image_path: Path) -> Dict[str, Any]:
        """Run quality checks on a saved image file."""
        if not image_path.is_file():
            raise ImageValidationError(f"Image file not found: {image_path}")
        with Image.open(image_path) as img:
            return self.assess_pil_image(img)

    def assess_pil_image(self, image: Image.Image) -> Dict[str, Any]:
        """Compute dimensions, brightness, contrast, blur/sharpness, and fundus FOV cues."""
        rgb = image.convert("RGB")
        width_px, height_px = rgb.size

        # Downsample copy for fast, consistent signal metrics without modifying original
        sample = rgb.copy()
        sample.thumbnail((512, 512))
        sw, sh = sample.size

        gray = sample.convert("L")
        gray_stat = ImageStat.Stat(gray)
        mean_brightness = float(gray_stat.mean[0])
        contrast_std = float(gray_stat.stddev[0])

        # Green channel carries strongest retinal vessel contrast
        _, green, _ = sample.split()
        # Discrete 4-neighbor Laplacian edge magnitude approximation
        laplacian_kernel = ImageFilter.Kernel(
            size=(3, 3),
            kernel=[0, 1, 0, 1, -4, 1, 0, 1, 0],
            scale=1,
            offset=128,
        )
        edge_img = green.filter(laplacian_kernel)
        # Exclude the 2px unfiltered border produced by ImageFilter.Kernel
        if sw > 6 and sh > 6:
            edge_img = edge_img.crop((2, 2, sw - 2, sh - 2))
        edge_stat = ImageStat.Stat(edge_img)
        # Stddev around 128 directly measures spatial edge / focus sharpness
        raw_sharpness = float(edge_stat.stddev[0])

        # Center vs corner luminance to detect circular fundus geometry vs flat/blank frame
        cx0, cy0 = max(0, sw // 4), max(0, sh // 4)
        cx1, cy1 = min(sw, (3 * sw) // 4), min(sh, (3 * sh) // 4)
        center_crop = gray.crop((cx0, cy0, cx1, cy1))
        center_mean = float(ImageStat.Stat(center_crop).mean[0])

        corner_size = max(8, min(sw, sh) // 10)
        tl_corner = gray.crop((0, 0, corner_size, corner_size))
        corner_mean = float(ImageStat.Stat(tl_corner).mean[0])

        # Score 1: Resolution
        min_dim = min(width_px, height_px)
        if min_dim >= 1024:
            resolution_score = 98
        elif min_dim >= 512:
            resolution_score = 88
        elif min_dim >= 256:
            resolution_score = 72
        else:
            resolution_score = 45

        # Score 2: Sharpness / Blur (raw_sharpness < 3.0 indicates heavy blur/flat image)
        if raw_sharpness >= 10.0:
            sharpness_score = min(97, round(82 + min(15.0, (raw_sharpness - 10.0) * 1.1)))
        elif raw_sharpness >= 5.0:
            sharpness_score = round(68 + (raw_sharpness - 5.0) * 2.8)
        else:
            sharpness_score = max(25, round(raw_sharpness * 12))

        # Score 3: Illumination (target balanced mean brightness ~45-205 and contrast >= 18)
        if 45.0 <= mean_brightness <= 205.0 and contrast_std >= 20.0:
            brightness_penalty = abs(mean_brightness - 115.0) * 0.15
            contrast_bonus = min(15.0, (contrast_std - 20.0) * 0.35)
            illumination_score = max(70, min(96, round(85 + contrast_bonus - brightness_penalty)))
        elif 25.0 <= mean_brightness <= 230.0 and contrast_std >= 10.0:
            illumination_score = 68
        else:
            illumination_score = 40

        # Score 4: Fundus geometry & Field of View
        has_fundus_geometry = center_mean > 30.0 and contrast_std >= 14.0
        has_circular_falloff = has_fundus_geometry and (corner_mean < center_mean or center_mean > 40.0)
        fundus_score = 94 if has_circular_falloff else (80 if has_fundus_geometry else 45)
        fov_score = 92 if has_circular_falloff else (76 if has_fundus_geometry else 50)

        overall_score = round(
            fundus_score * 0.20
            + sharpness_score * 0.30
            + illumination_score * 0.20
            + fov_score * 0.15
            + resolution_score * 0.15
        )

        if overall_score >= 78 and sharpness_score >= 60 and illumination_score >= 60:
            status = "passed"
        elif overall_score >= 58:
            status = "review"
        else:
            status = "failed"

        checked_at = datetime.now(timezone.utc).isoformat()
        resolution_detail = f"{width_px} × {height_px}"

        metrics = {
            "fundusDetected": {
                "id": "fundus_detected",
                "name": "Fundus Detected",
                "passed": fundus_score >= 75,
                "score": fundus_score,
                "description": (
                    f"Center luminance {center_mean:.1f}, contrast std {contrast_std:.1f}"
                ),
            },
            "focusSharpness": {
                "id": "focus_sharpness",
                "name": "Focus & Sharpness",
                "passed": sharpness_score >= 70,
                "score": sharpness_score,
                "description": f"Green-channel Laplacian edge std: {raw_sharpness:.2f}",
            },
            "illumination": {
                "id": "illumination",
                "name": "Illumination",
                "passed": illumination_score >= 70,
                "score": illumination_score,
                "description": f"Mean brightness {mean_brightness:.1f}/255, contrast {contrast_std:.1f}",
            },
            "fieldOfView": {
                "id": "field_of_view",
                "name": "Field of View",
                "passed": fov_score >= 75,
                "score": fov_score,
                "description": f"Center-to-margin luminance ratio ({center_mean:.1f} vs {corner_mean:.1f})",
            },
            "resolution": {
                "id": "resolution",
                "name": "Resolution",
                "passed": resolution_score >= 70,
                "score": resolution_score,
                "description": f"Native pixel matrix {width_px} x {height_px} px",
            },
        }

        return {
            "overall_score": overall_score,
            "status": status,
            "width_px": width_px,
            "height_px": height_px,
            "mean_brightness": round(mean_brightness, 2),
            "contrast_std": round(contrast_std, 2),
            "sharpness_score": round(raw_sharpness, 2),
            "resolution_detail": resolution_detail,
            "checked_at": checked_at,
            "metrics": metrics,
        }
