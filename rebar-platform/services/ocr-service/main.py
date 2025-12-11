from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="OCR Service")

class ShapeItem(BaseModel):
    barSize: str
    cutLength: float
    bendAngles: List[float]
    quantity: int
    confidence: float

class ParseResult(BaseModel):
    projectName: Optional[str]
    lineItems: List[ShapeItem]

@app.post("/parse-job-sheet", response_model=ParseResult)
async def parse_job_sheet(image: UploadFile = File(...)):
    # TODO: replace with real OCR and parsing.
    demo_shape = ShapeItem(
        barSize="#5",
        cutLength=120.0,
        bendAngles=[45.0, 90.0],
        quantity=8,
        confidence=0.42,
    )
    return ParseResult(projectName="Demo Project", lineItems=[demo_shape])
