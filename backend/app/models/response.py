from pydantic import BaseModel
from typing import List, Literal


class SolvedSession(BaseModel):
    session_id: str
    topic_id: str
    topic_name: str
    color: str
    session_index: int
    date: str
    start_minute: int
    end_minute: int
    room_index: int
    teacher_id: str
    teacher_name: str


class SolveResponse(BaseModel):
    status: Literal["optimal", "feasible", "infeasible", "relaxed"]
    sessions: List[SolvedSession]
    warnings: List[str]
    total_teaching_days: int
