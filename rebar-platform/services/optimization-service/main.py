from typing import List, Dict
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Optimization Service")


class RequiredPiece(BaseModel):
    barSize: str = Field(..., description="Rebar bar size such as #5")
    length: float = Field(..., gt=0, description="Cut length in inches")
    quantity: int = Field(..., gt=0, description="Number of identical pieces")


class AssignedPiece(BaseModel):
    barSize: str
    length: float


class OptimizationPlan(BaseModel):
    stockUsed: float
    assignedPieces: List[AssignedPiece]
    remainingScrap: float


class OptimizationRequest(BaseModel):
    stockLength: float = Field(..., gt=0)
    minScrapLength: float = Field(..., ge=0)
    requiredPieces: List[RequiredPiece]


class OptimizationResponse(BaseModel):
    plans: List[OptimizationPlan]
    totalScrap: float
    scrapPercent: float
    notes: List[str] = Field(default_factory=list)


def _best_fit_cutting(payload: OptimizationRequest) -> OptimizationResponse:
    if payload.minScrapLength >= payload.stockLength:
        raise ValueError("Minimum scrap length must be smaller than the stock length")

    notes: List[str] = []
    plans: List[OptimizationPlan] = []
    total_scrap = 0.0

    grouped = {}
    for piece in payload.requiredPieces:
        grouped.setdefault(piece.barSize, []).extend([piece.length] * piece.quantity)

    for bar_size, lengths in grouped.items():
        lengths.sort(reverse=True)
        open_stocks: List[OptimizationPlan] = []

        for length in lengths:
            if length > payload.stockLength:
                notes.append(f"Piece length {length} exceeds stock length for {bar_size} and was skipped.")
                continue

            best_stock_index = None
            best_remaining = None
            for idx, stock in enumerate(open_stocks):
                remaining = stock.remainingScrap - length
                if remaining >= payload.minScrapLength:
                    if best_remaining is None or remaining < best_remaining:
                        best_remaining = remaining
                        best_stock_index = idx

            if best_stock_index is None:
                new_remaining = payload.stockLength - length
                open_stocks.append(
                    OptimizationPlan(
                        stockUsed=payload.stockLength,
                        assignedPieces=[AssignedPiece(barSize=bar_size, length=length)],
                        remainingScrap=new_remaining,
                    )
                )
            else:
                chosen = open_stocks[best_stock_index]
                chosen.assignedPieces.append(AssignedPiece(barSize=bar_size, length=length))
                chosen.remainingScrap = round(chosen.remainingScrap - length, 3)

        plans.extend(open_stocks)

    total_scrap = round(sum(plan.remainingScrap for plan in plans), 3)
    total_stock_length = len(plans) * payload.stockLength
    scrap_percent = 0 if total_stock_length == 0 else round((total_scrap / total_stock_length) * 100, 2)

    plans.sort(key=lambda plan: plan.remainingScrap)
    return OptimizationResponse(plans=plans, totalScrap=total_scrap, scrapPercent=scrap_percent, notes=notes)


@app.post("/optimization/run", response_model=OptimizationResponse)
async def run_optimization(payload: OptimizationRequest) -> Dict[str, object]:
    try:
        return _best_fit_cutting(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
