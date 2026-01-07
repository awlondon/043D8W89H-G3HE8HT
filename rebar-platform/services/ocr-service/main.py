from fastapi import FastAPI, UploadFile, File, HTTPException
from parser import ParseResult, parse_shapes
from ocr import extract_text

app = FastAPI(title="OCR Service")


@app.post("/parse-job-sheet", response_model=ParseResult)
async def parse_job_sheet(image: UploadFile = File(...)):
    if image.content_type and not image.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Only image uploads are supported")

    contents = await image.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    raw_text = extract_text(contents)
    return parse_shapes(raw_text)
