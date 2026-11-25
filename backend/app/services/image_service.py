"""Service for validating and storing retinal fundus images on disk."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from app.core.config import Settings, get_settings
from app.utils.image_utils import (
    ImageValidationError,
    safe_resolve_within,
    sanitize_filename,
    validate_and_inspect_image,
    validate_extension,
)


@dataclass(frozen=True)
class StoredImageInfo:
    file_name: str
    file_path: str
    public_url: str
    content_type: str
    file_size_bytes: int
    width_px: int
    height_px: int
    sha256_hash: str


MIME_BY_EXT = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}


class ImageService:
    """Handles safe storage of uploaded retinal scans in app/storage/uploads."""

    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()
        self.settings.upload_dir.mkdir(parents=True, exist_ok=True)

    def save_upload(
        self,
        content: bytes,
        original_filename: str,
        screening_id: str,
        content_type: Optional[str] = None,
    ) -> StoredImageInfo:
        """Validate and persist an uploaded retinal image file."""
        clean_original = sanitize_filename(original_filename)
        ext = validate_extension(clean_original, self.settings.allowed_extensions)

        rgb_img, width, height, _, sha256_hex = validate_and_inspect_image(
            content, self.settings.max_upload_size_bytes
        )
        rgb_img.close()

        safe_screening = sanitize_filename(screening_id)
        unique_name = f"{safe_screening}_{uuid.uuid4().hex[:8]}{ext}"
        dest_path = safe_resolve_within(self.settings.upload_dir, unique_name)
        dest_path.write_bytes(content)

        rel_path = f"app/storage/uploads/{unique_name}"
        resolved_mime = content_type or MIME_BY_EXT.get(ext, "image/jpeg")

        return StoredImageInfo(
            file_name=clean_original,
            file_path=rel_path,
            public_url=f"/uploads/{unique_name}",
            content_type=resolved_mime,
            file_size_bytes=len(content),
            width_px=width,
            height_px=height,
            sha256_hash=sha256_hex,
        )

    def resolve_local_image(self, stored_path: str) -> Optional[Path]:
        """Resolve a stored file_path safely on disk if it exists locally."""
        if not stored_path:
            return None

        normalized = stored_path.lstrip("/")
        candidates = [
            (self.settings.backend_dir / normalized).resolve(),
            (self.settings.backend_dir.parent / normalized).resolve(),
        ]
        if normalized.startswith(("app/storage/uploads/", "uploads/")):
            candidates.insert(
                0, (self.settings.upload_dir / Path(normalized).name).resolve()
            )
        allowed_roots = [
            self.settings.upload_dir.resolve(),
            (self.settings.backend_dir.parent / "src" / "assets" / "images").resolve(),
        ]

        for candidate in candidates:
            if not candidate.is_file():
                continue
            for root in allowed_roots:
                if candidate == root or root in candidate.parents:
                    return candidate
        return None
