from pydantic import BaseModel, Field, validator
from typing import List, Optional
import re

ANGLE_PATTERN = re.compile(r"(\d{2,3})\s*deg", re.IGNORECASE)
SHAPE_PATTERN = re.compile(
    r"(?P<bar>#[345678])\s*(?P<length>\d{2,3}(?:\.\d+)?)\s*(?P<unit>in|ft|mm|cm)?\s*(?:[xX]\s*(?P<qty>\d+))?",
    re.IGNORECASE,
)
PROJECT_PATTERN = re.compile(r"project\s*:?\s*(?P<name>[\w\s-]{3,60})", re.IGNORECASE)


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
    overallConfidence: float = Field(..., ge=0, le=1)


def _score_line(has_quantity: bool, mixed_units: bool, angle_ambiguous: bool) -> float:
    confidence = 0.8 if has_quantity else 0.6
    if mixed_units:
        confidence -= 0.1
    if angle_ambiguous:
        confidence -= 0.1
    return max(0.0, min(1.0, round(confidence, 2)))


def parse_shapes(raw_text: str) -> ParseResult:
    line_items: List[ShapeItem] = []
    warnings: List[str] = []

    matches = list(SHAPE_PATTERN.finditer(raw_text))
    detected_units = {match.group("unit").lower() for match in matches if match.group("unit")}
    mixed_units = len(detected_units) > 1
    if mixed_units:
        warnings.append("Mixed units detected in OCR output; verify conversions before cutting.")

    angles = [float(m) for m in ANGLE_PATTERN.findall(raw_text)]
    unique_angles = sorted({angle for angle in angles})
    angle_ambiguous = len(unique_angles) > 1
    if angle_ambiguous:
        warnings.append("Multiple bend angles detected; verify the correct angle per line item.")

    for match in matches:
        bar_size = match.group("bar")
        length = float(match.group("length"))
        qty_raw = match.group("qty")
        quantity = int(qty_raw) if qty_raw else 1
        if not qty_raw:
            warnings.append(f"Missing quantity for {bar_size} {length}; defaulted to 1.")

        confidence = _score_line(bool(qty_raw), mixed_units, angle_ambiguous)
        line_items.append(
            ShapeItem(
                barSize=bar_size,
                cutLength=length,
                bendAngles=unique_angles,
                quantity=quantity,
                confidence=confidence,
            )
        )

    if not line_items:
        warnings.append("No recognizable bar schedules were found in the document.")

    project_match = PROJECT_PATTERN.search(raw_text)
    project_name = project_match.group("name").strip() if project_match else None

    overall_confidence = 0.0
    if line_items:
        overall_confidence = round(sum(item.confidence for item in line_items) / len(line_items), 2)

    return ParseResult(projectName=project_name, lineItems=line_items, warnings=warnings, overallConfidence=overall_confidence)
