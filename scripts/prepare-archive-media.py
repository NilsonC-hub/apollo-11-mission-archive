"""Build the reviewed Sprint 2 Archive evidence derivatives.

Requires Python 3.11+, Pillow 12.1.1, and PyMuPDF 1.28.0. The input hashes
are pinned before Pillow or PyMuPDF opens a file so the decompression-limit
override applies only to the reviewed NASA source bytes.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import fitz
from PIL import Image, ImageOps, __version__ as pillow_version


ROOT = Path(__file__).resolve().parents[1]
DELIVERY_ROOT = ROOT / "public/missions/apollo11/images"
DERIVED_ROOT = ROOT / "assets/derived/images"
REPORT_PATH = ROOT / "docs/audit/SPRINT-2-ARCHIVE-MEDIA-PROCESSING.json"

SOURCE_IMAGES = (
    {
        "id": "a11-s69-38660",
        "path": "assets/raw/images/NASA-A11-S69-38660.jpg",
        "sha256": "c85615b525b909e7ea405be4772bad0da5940cbed1ec299735ff191800cdabe9",
        "widths": (480, 800),
    },
    {
        "id": "a11-s69-39525",
        "path": "assets/raw/images/NASA-A11-S69-39525.jpg",
        "sha256": "e8f3f5c220ba1146f51e43b9944a79dc2d30c9db262cd973a36b18387ab5d45a",
        "widths": (480, 960, 1440),
    },
    {
        "id": "a11-s69-39961",
        "path": "assets/raw/images/NASA-A11-S69-39961.jpg",
        "sha256": "15fedded2f4c0be7347cc1820592a04cb87a2b319653922574ec6c21cc9f0b2d",
        "widths": (480, 960, 1440),
    },
)

MISSION_REPORT = {
    "path": "assets/raw/NASA-A11-MR.pdf",
    "sha256": "3314d99654ebb2ac3e3ef0ab70a84be9519a5f071cf1362118b2b20a6f161dea",
    "pdf_page": 334,
    "printed_page": "A-10",
    "render_path": "assets/derived/images/NASA-A11-MR-p334-A-10.png",
    "render_scale": 2.25,
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def checked_path(relative_path: str, expected_sha256: str) -> Path:
    path = ROOT / relative_path
    actual = sha256(path)
    if actual != expected_sha256:
        raise RuntimeError(f"Source hash mismatch for {relative_path}: {actual}")
    return path


def file_record(path: Path, image: Image.Image, image_format: str) -> dict[str, object]:
    return {
        "localPath": path.relative_to(ROOT).as_posix(),
        "sha256": sha256(path),
        "bytes": path.stat().st_size,
        "width": image.width,
        "height": image.height,
        "format": image_format,
    }


def render_document_page() -> dict[str, object]:
    pdf_path = checked_path(MISSION_REPORT["path"], MISSION_REPORT["sha256"])
    render_path = ROOT / MISSION_REPORT["render_path"]
    render_path.parent.mkdir(parents=True, exist_ok=True)
    document = fitz.open(pdf_path)
    page_index = int(MISSION_REPORT["pdf_page"]) - 1
    if not 0 <= page_index < len(document):
        raise RuntimeError("Configured Mission Report PDF page is out of range")
    page = document[page_index]
    scale = float(MISSION_REPORT["render_scale"])
    pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), colorspace=fitz.csRGB, alpha=False)
    pixmap.save(render_path)
    document.close()
    with Image.open(render_path) as image:
        record = file_record(render_path, image, "png")
    return {
        **record,
        "sourceDocument": MISSION_REPORT["path"],
        "sourceDocumentSha256": MISSION_REPORT["sha256"],
        "pdfPage": MISSION_REPORT["pdf_page"],
        "printedPage": MISSION_REPORT["printed_page"],
        "renderScale": scale,
    }


def save_variant(source: Image.Image, output: Path, width: int, image_format: str) -> dict[str, object]:
    height = round(source.height * width / source.width)
    resized = source.resize((width, height), Image.Resampling.LANCZOS)
    output.parent.mkdir(parents=True, exist_ok=True)
    icc_profile = source.info.get("icc_profile")
    if image_format == "webp":
        resized.save(output, "WEBP", quality=84, method=6, icc_profile=icc_profile)
    else:
        resized.save(
            output,
            "JPEG",
            quality=88,
            optimize=True,
            progressive=True,
            subsampling="4:4:4" if "mission-report" in output.name else "4:2:0",
            icc_profile=icc_profile,
        )
    record = file_record(output, resized, image_format)
    record["publicPath"] = "/" + output.relative_to(ROOT / "public").as_posix()
    return record


def build_delivery(
    media_id: str,
    source_path: Path,
    widths: tuple[int, ...],
) -> tuple[dict[str, object], list[dict[str, object]]]:
    with Image.open(source_path) as opened:
        source = ImageOps.exif_transpose(opened)
        source.load()
        if source.mode != "RGB":
            source = source.convert("RGB")
        source_record = file_record(source_path, source, opened.format.lower().replace("jpeg", "jpeg"))
        available_widths = tuple(width for width in widths if width <= source.width)
        if len(available_widths) < 2:
            raise RuntimeError(f"{media_id} requires at least two non-upscaled delivery widths")
        delivery: list[dict[str, object]] = []
        for width in available_widths:
            delivery.append(
                save_variant(source, DELIVERY_ROOT / f"{media_id}-{width}.webp", width, "webp")
            )
        fallback_width = available_widths[-1]
        delivery.append(
            save_variant(
                source,
                DELIVERY_ROOT / f"{media_id}-{fallback_width}.jpg",
                fallback_width,
                "jpeg",
            )
        )
    return source_record, delivery


def main() -> None:
    Image.MAX_IMAGE_PIXELS = None
    DELIVERY_ROOT.mkdir(parents=True, exist_ok=True)
    DERIVED_ROOT.mkdir(parents=True, exist_ok=True)

    report: dict[str, object] = {
        "schemaVersion": 1,
        "tools": {"python": "3.11+", "pillow": pillow_version, "pymupdf": fitz.version[0]},
        "policy": {
            "crop": "none; full source frame/full PDF page retained",
            "colorOrTonalAdjustment": "none",
            "resize": "Lanczos downsample only; no upscaling",
            "delivery": "responsive WebP plus local JPEG fallback",
        },
        "items": [],
    }

    for item in SOURCE_IMAGES:
        source_path = checked_path(item["path"], item["sha256"])
        source_record, delivery = build_delivery(item["id"], source_path, item["widths"])
        report["items"].append(
            {"id": item["id"], "raw": source_record, "delivery": delivery}
        )

    rendered_page = render_document_page()
    document_source, document_delivery = build_delivery(
        "a11-mission-report-p334-a10",
        ROOT / str(rendered_page["localPath"]),
        (480, 960, 1400),
    )
    report["items"].append(
        {
            "id": "a11-mission-report-p334-a10",
            "renderedPage": {**document_source, **rendered_page},
            "delivery": document_delivery,
        }
    )

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"Prepared {len(report['items'])} Archive media records")
    print(REPORT_PATH.relative_to(ROOT).as_posix())


if __name__ == "__main__":
    main()
