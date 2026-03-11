from pydantic import BaseModel, Field
from typing import List


class DayBreak(BaseModel):
    start_minute: int
    end_minute: int


class WeekdayConfig(BaseModel):
    weekday: int = Field(..., ge=0, le=6)
    enabled: bool
    open_minute: int
    close_minute: int
    breaks: List[DayBreak] = Field(default_factory=list)


class ScheduleConfig(BaseModel):
    num_rooms: int = Field(..., ge=1)
    weekdays: List[WeekdayConfig]
    start_date: str  # "YYYY-MM-DD"
    end_date: str
    max_sessions_per_day_per_teacher: int = Field(default=3, ge=1)


class Topic(BaseModel):
    id: str
    name: str
    duration_minutes: int = Field(..., ge=15)
    num_sessions: int = Field(..., ge=1)
    color: str


class Teacher(BaseModel):
    id: str
    name: str
    topic_ids: List[str]
    unavailable_dates: List[str] = Field(default_factory=list)


class SolveRequest(BaseModel):
    schedule: ScheduleConfig
    topics: List[Topic]
    teachers: List[Teacher]
