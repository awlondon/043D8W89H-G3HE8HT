from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from PIL import Image
import pytesseract
import io
import re

app = FastAPI(title="OCR Service")


class ShapeItem(BaseModel):
    barSize: str = Field(..., description="Rebar bar size, e.g. #5")
    cutLength: float = Field(..., gt=0, description="Target length in inches")
    bendAngles: List[float] = Field(default_factory=list, description="Sequence of bend angles")
    quantity: int = Field(..., gt=0, description="Number of pieces")
    confidence: float = Field(..., ge=0, le=1, description="Confidence score from OCR")

    @validator("bendAngles", each_item=True)
    def validate_angles(cls, value: float) -> float:
        if value < 0 or value > 180:
            raise ValueError("bend angles must be between 0 and 180 degrees")
        return round(value, 2)


class ParseResult(BaseModel):
    projectName: Optional[str]
    lineItems: List[ShapeItem]
    warnings: List[str] = Field(default_factory=list)


def _extract_text(image_bytes: bytes) -> str:
    try:
        image = Image.open(io.BytesIO(image_bytes))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=422, detail=f"Unable to read image: {exc}")

    try:
        data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
        words = [word for word, conf in zip(data.get("text", []), data.get("conf", [])) if word.strip() and conf != "-1"]
        return " ".join(words)
    except pytesseract.TesseractNotFoundError as exc:
        raise HTTPException(status_code=500, detail="Tesseract OCR binary not found. Install tesseract-ocr.") from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"OCR failed: {exc}")


def _parse_shapes(raw_text: str):
    line_items: List[ShapeItem] = []
    warnings: List[str] = []
    pattern = re.compile(
        r"(?P<bar>#[345678])\s*(?P<length>\d{2,3}(?:\.\d+)?)\s*(?:in|ft|mm|cm)?\s*[xX]\s*(?P<qty>\d+)",
        re.IGNORECASE,
    )
    angle_pattern = re.compile(r"(\d{2,3})\s*deg", re.IGNORECASE)

    for match in pattern.finditer(raw_text):
        bar_size = match.group("bar")
        length = float(match.group("length"))
        quantity = int(match.group("qty"))
        angles = [float(m) for m in angle_pattern.findall(raw_text)]
        confidence = 0.7 if angles else 0.55
        line_items.append(
            ShapeItem(
                barSize=bar_size,
                cutLength=length,
                bendAngles=angles,
                quantity=quantity,
                confidence=confidence,
            )
        )

    if not line_items:
        warnings.append("No recognizable bar schedules were found in the document.")

    project_match = re.search(r"project\s*:?\s*(?P<name>[\w\s-]{3,60})", raw_text, flags=re.IGNORECASE)
    project_name = project_match.group("name").strip() if project_match else None

    return ParseResult(projectName=project_name, lineItems=line_items, warnings=warnings)


@app.post("/parse-job-sheet", response_model=ParseResult)
async def parse_job_sheet(image: UploadFile = File(...)):
    if image.content_type and not image.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Only image uploads are supported")

    contents = await image.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    raw_text = _extract_text(contents)
    return _parse_shapes(raw_text)
