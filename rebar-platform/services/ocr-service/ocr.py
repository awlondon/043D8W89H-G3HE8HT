from fastapi import HTTPException
from PIL import Image
import io
import pytesseract


def extract_text(image_bytes: bytes) -> str:
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
