import pytest
from app.models.request import SolveRequest, ScheduleConfig, WeekdayConfig, Topic, Teacher
from app.solver.contradiction import check_contradictions
from app.solver.cp_sat_solver import run_solver


def make_request():
    return SolveRequest(
        schedule=ScheduleConfig(
            num_rooms=2,
            weekdays=[
                WeekdayConfig(weekday=0, enabled=True, open_minute=480, close_minute=1020, breaks=[]),
                WeekdayConfig(weekday=1, enabled=True, open_minute=480, close_minute=1020, breaks=[]),
                WeekdayConfig(weekday=2, enabled=True, open_minute=480, close_minute=1020, breaks=[]),
            ],
            start_date="2026-03-16",
            end_date="2026-03-20",
            max_sessions_per_day_per_teacher=3,
        ),
        topics=[
            Topic(id="t1", name="Math", duration_minutes=60, num_sessions=2, color="#FF0000"),
            Topic(id="t2", name="Science", duration_minutes=45, num_sessions=3, color="#00FF00"),
        ],
        teachers=[
            Teacher(id="tc1", name="Alice", topic_ids=["t1", "t2"], unavailable_dates=[]),
            Teacher(id="tc2", name="Bob", topic_ids=["t2"], unavailable_dates=[]),
        ],
    )


def test_no_contradiction():
    req = make_request()
    result = check_contradictions(req)
    assert result is None


def test_solver_runs():
    req = make_request()
    result = run_solver(req)
    assert result is not None
    assert result.status in ("optimal", "feasible")
    assert len(result.sessions) == 5  # 2 + 3 sessions


def test_solver_sessions_no_overlap():
    req = make_request()
    result = run_solver(req)
    assert result is not None
    # Check no two sessions overlap in same room on same day
    from collections import defaultdict
    by_room_day = defaultdict(list)
    for s in result.sessions:
        by_room_day[(s.room_index, s.date)].append((s.start_minute, s.end_minute))
    for key, intervals in by_room_day.items():
        intervals.sort()
        for i in range(len(intervals) - 1):
            assert intervals[i][1] <= intervals[i + 1][0], f"Overlap in room/day {key}"


def test_contradiction_no_teachers():
    req = make_request()
    req.topics[0].id = "t_orphan"  # no teacher has this topic
    result = check_contradictions(req)
    assert result is not None
    assert "no qualified teachers" in result.lower()
