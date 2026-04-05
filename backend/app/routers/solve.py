import logging
import time
import uuid

from fastapi import APIRouter, HTTPException, Request
from app.models.request import SolveRequest
from app.models.response import SolveResponse
from app.solver.contradiction import check_contradictions
from app.solver.greedy_solver import run_solver as run_heuristic
from app.solver.cp_sat_solver import run_solver as run_cpsat

router = APIRouter()
logger = logging.getLogger(__name__)


def _request_meta(req: SolveRequest, solver_type: str, request_id: str) -> dict:
    return {
        "request_id": request_id,
        "solver_type": solver_type,
        "num_topics": len(req.topics),
        "num_teachers": len(req.teachers),
        "total_sessions": sum(t.num_sessions for t in req.topics),
        "start_date": req.schedule.start_date,
        "num_rooms": req.schedule.num_rooms,
    }


@router.post("/solve/heuristic", response_model=SolveResponse)
def solve_heuristic(req: SolveRequest, http_req: Request):
    request_id = str(uuid.uuid4())
    meta = _request_meta(req, "heuristic", request_id)
    logger.info("solve_request_received", extra=meta)
    t0 = time.perf_counter()

    contradiction = check_contradictions(req)
    if contradiction:
        logger.warning("solve_contradiction", extra={**meta, "reason": contradiction})
        raise HTTPException(status_code=400, detail=f"Contradiction: {contradiction}")

    result = run_heuristic(req)

    if result is None:
        logger.error("solve_timeout", extra=meta)
        raise HTTPException(status_code=504, detail="Solver timeout")

    duration_ms = round((time.perf_counter() - t0) * 1000)
    logger.info("solve_completed", extra={
        **meta,
        "status": result.status,
        "num_sessions": len(result.sessions),
        "teaching_days": result.total_teaching_days,
        "duration_ms": duration_ms,
    })
    return result


@router.post("/solve/cpsat", response_model=SolveResponse)
def solve_cpsat(req: SolveRequest, http_req: Request):
    request_id = str(uuid.uuid4())
    meta = _request_meta(req, "cpsat", request_id)
    logger.info("solve_request_received", extra={**meta, "time_limit_seconds": req.time_limit_seconds})
    t0 = time.perf_counter()

    contradiction = check_contradictions(req)
    if contradiction:
        logger.warning("solve_contradiction", extra={**meta, "reason": contradiction})
        raise HTTPException(status_code=400, detail=f"Contradiction: {contradiction}")

    # Run heuristic first to get an upper-bound window and a warm-start hint
    heuristic_result = run_heuristic(req)
    if heuristic_result is None or not heuristic_result.sessions:
        logger.error("solve_heuristic_preflight_failed", extra=meta)
        raise HTTPException(status_code=400, detail="Heuristic pre-solve failed; cannot determine search window.")

    end_date = max(s.date for s in heuristic_result.sessions)
    logger.info("solve_heuristic_preflight_done", extra={
        **meta,
        "heuristic_end_date": end_date,
        "heuristic_teaching_days": heuristic_result.total_teaching_days,
        "heuristic_duration_ms": round((time.perf_counter() - t0) * 1000),
    })

    result = run_cpsat(req, end_date=end_date, hint=heuristic_result)

    if result is None:
        logger.error("solve_timeout", extra={**meta, "time_limit_seconds": req.time_limit_seconds})
        raise HTTPException(status_code=504, detail="Solver timeout")

    duration_ms = round((time.perf_counter() - t0) * 1000)
    logger.info("solve_completed", extra={
        **meta,
        "status": result.status,
        "num_sessions": len(result.sessions),
        "teaching_days": result.total_teaching_days,
        "duration_ms": duration_ms,
    })
    return result
