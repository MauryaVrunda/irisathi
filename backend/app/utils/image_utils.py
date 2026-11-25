"""Image validation, decoding, and safe path resolution utilities."""

from __future__ import annotations

import base64
import hashlib
import io
import re
from pathlib import Path
from typing import Iterable, Tuple

from PIL import Image, UnidentifiedImageError

SAFE_FILENAME_RE = re.compile(r"[^A-Za-z0-9_.-]+")


class ImageValidationError(ValueError):
    """Raised when an uploaded image fails format, size, or path validation."""


def sanitize_filename(filename: str) -> str:
    """Strip directory components and unsafe characters from a filename."""
    base = Path(filename or "retinal_scan.jpg").name
    cleaned = SAFE_FILENAME_RE.sub("_", base).strip("._")
    return cleaned or "retinal_scan.jpg"


def validate_extension(filename: str, allowed_extensions: Iterable[str]) -> str:
    """Validate and return the lowercase file extension."""
    ext = Path(filename).suffix.lower()
    allowed = {e.lower() for e in allowed_extensions}
    if ext not in allowed:
        raise ImageValidationError(
            f"Unsupported image format '{ext or 'none'}'. Allowed formats: {', '.join(sorted(allowed))}."
        )
    return ext


def safe_resolve_within(directory: Path, filename: str) -> Path:
    """Resolve a target file path strictly inside directory, preventing traversal."""
    base_dir = directory.resolve()
    clean_name = sanitize_filename(filename)
    candidate = (base_dir / clean_name).resolve()
    if candidate != base_dir and base_dir not in candidate.parents:
        raise ImageValidationError("Invalid storage path outside allowed upload directory.")
    return candidate


def validate_and_inspect_image(
    content: bytes,
    max_size_bytes: int,
) -> Tuple[Image.Image, int, int, str, str]:
    """Validate byte size and image integrity using Pillow.

    Returns (rgb_image, width, height, pil_format, sha256_hex).
    """
    if not content:
        raise ImageValidationError("Uploaded image file is empty.")
    if len(content) > max_size_bytes:
        max_mb = max_size_bytes / (1024 * 1024)
        raise ImageValidationError(
            f"Image exceeds maximum allowed size of {max_mb:.1f} MB."
        )

    sha256_hex = hashlib.sha256(content).hexdigest()

    try:
        with Image.open(io.BytesIO(content)) as probe:
            pil_format = (probe.format or "JPEG").upper()
            probe.verify()
        img = Image.open(io.BytesIO(content))
        rgb_img = img.convert("RGB")
        width, height = rgb_img.size
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise ImageValidationError("File is not a valid or readable image.") from exc

    if width < 32 or height < 32:
        raise ImageValidationError(
            f"Image dimensions ({width}x{height}) are too small for retinal analysis."
        )

    return rgb_img, width, height, pil_format, sha256_hex


def decode_data_uri(data_uri: str) -> Tuple[bytes, str]:
    """Decode a base64 data URI into raw bytes and suggested extension."""
    if not data_uri.startswith("data:image/"):
        raise ImageValidationError("Expected a valid base64 image data URI.")
    try:
        header, encoded = data_uri.split(",", 1)
        mime = header.split(";")[0].split(":", 1)[1].lower()
        ext_map = {
            "image/jpeg": ".jpg",
            "image/jpg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
        }
        ext = ext_map.get(mime, ".jpg")
        return base64.b64decode(encoded), ext
    except Exception as exc:
        raise ImageValidationError("Malformed base64 image payload.") from exc
