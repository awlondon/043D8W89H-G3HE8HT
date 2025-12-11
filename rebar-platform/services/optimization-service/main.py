from typing import List, Dict
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Optimization Service")

class RequiredPiece(BaseModel):
    barSize: str
    length: float
    quantity: int

class OptimizationRequest(BaseModel):
    stockLength: float
    minScrapLength: float
    requiredPieces: List[RequiredPiece]

@app.post("/optimization/run")
async def run_optimization(payload: OptimizationRequest) -> Dict[str, object]:
    # Placeholder optimization: packs pieces sequentially until stock is full.
    plans = []
    remaining = payload.stockLength
    assigned = []
    for piece in payload.requiredPieces:
        for _ in range(piece.quantity):
            if remaining - piece.length < payload.minScrapLength:
                plans.append({"assignedPieces": assigned, "remainingScrap": remaining})
                assigned = []
                remaining = payload.stockLength
            assigned.append({"barSize": piece.barSize, "length": piece.length})
            remaining -= piece.length
    plans.append({"assignedPieces": assigned, "remainingScrap": remaining})
    return {"plans": plans}
