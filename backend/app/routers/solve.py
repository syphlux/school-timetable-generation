from fastapi import APIRouter, HTTPException
from app.models.request import SolveRequest
from app.models.response import SolveResponse
from app.solver.contradiction import check_contradictions
from app.solver.cp_sat_solver import run_solver

router = APIRouter()


@router.post("/solve", response_model=SolveResponse)
def solve(req: SolveRequest):
    # Pre-solve contradiction checks
    contradiction = check_contradictions(req)
    if contradiction:
        raise HTTPException(status_code=400, detail=f"Contradiction: {contradiction}")

    result = run_solver(req)

    if result is None:
        raise HTTPException(status_code=504, detail="Solver timeout after 30s")

    return result
