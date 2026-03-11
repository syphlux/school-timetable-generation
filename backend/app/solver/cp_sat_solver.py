import uuid
from typing import List, Optional, Dict, Tuple
from ortools.sat.python import cp_model
from app.models.request import SolveRequest
from app.models.response import SolveResponse, SolvedSession
from app.solver.preprocessor import preprocess, CandidateSlot

SOLVER_TIME_LIMIT = 30.0  # seconds
SCALE = 1000


def run_solver(req: SolveRequest) -> Optional[SolveResponse]:
    all_dates, topic_slots = preprocess(req)
    warnings: List[str] = []

    if not all_dates:
        return SolveResponse(status="infeasible", sessions=[], warnings=["No valid dates."], total_teaching_days=0)

    model = cp_model.CpModel()

    teacher_unavail: Dict[str, set] = {t.id: set(t.unavailable_dates) for t in req.teachers}
    teacher_topics: Dict[str, set] = {t.id: set(t.topic_ids) for t in req.teachers}

    # ── Build decision variables ──────────────────────────────────────────────
    # x[topic_id][session_idx][slot_id] = BoolVar
    # y[topic_id][session_idx][slot_id][teacher_id] = BoolVar

    x: Dict[str, Dict[int, Dict[int, cp_model.IntVar]]] = {}
    y: Dict[str, Dict[int, Dict[int, Dict[str, cp_model.IntVar]]]] = {}

    # slot lookup by id
    slot_by_id: Dict[int, CandidateSlot] = {}

    for topic in req.topics:
        slots = topic_slots[topic.id]
        x[topic.id] = {}
        y[topic.id] = {}
        for si in range(topic.num_sessions):
            x[topic.id][si] = {}
            y[topic.id][si] = {}
            for cs in slots:
                slot_by_id[cs.slot_id] = cs
                xvar = model.NewBoolVar(f"x_{topic.id}_{si}_{cs.slot_id}")
                x[topic.id][si][cs.slot_id] = xvar

                y[topic.id][si][cs.slot_id] = {}
                for teacher in req.teachers:
                    if topic.id not in teacher_topics[teacher.id]:
                        continue
                    if cs.date in teacher_unavail[teacher.id]:
                        continue
                    yvar = model.NewBoolVar(f"y_{topic.id}_{si}_{cs.slot_id}_{teacher.id}")
                    y[topic.id][si][cs.slot_id][teacher.id] = yvar

    # ── Constraint 1: each session assigned exactly once ─────────────────────
    for topic in req.topics:
        slots = topic_slots[topic.id]
        slot_ids = [cs.slot_id for cs in slots]
        for si in range(topic.num_sessions):
            model.AddExactlyOne([x[topic.id][si][sid] for sid in slot_ids])

    # ── Constraint 2: teacher linked to slot ─────────────────────────────────
    for topic in req.topics:
        for si in range(topic.num_sessions):
            for sid, xvar in x[topic.id][si].items():
                teacher_vars = list(y[topic.id][si][sid].values())
                if teacher_vars:
                    model.Add(sum(teacher_vars) == xvar)
                else:
                    # No teacher available for this slot → force x = 0
                    model.Add(xvar == 0)

    # ── Constraint 3 & 4: no-overlap via OptionalIntervalVar ─────────────────
    # Group by (room, day) and (teacher, day)
    room_day_intervals: Dict[Tuple[int, int], List] = {}
    teacher_day_intervals: Dict[Tuple[str, int], List] = {}

    for topic in req.topics:
        slots = topic_slots[topic.id]
        slot_map = {cs.slot_id: cs for cs in slots}
        for si in range(topic.num_sessions):
            for sid, xvar in x[topic.id][si].items():
                cs = slot_map[sid]
                key_room = (cs.room_index, cs.day_index)
                ivar = model.NewOptionalIntervalVar(
                    cs.start_minute, topic.duration_minutes, cs.end_minute,
                    xvar, f"iv_room_{topic.id}_{si}_{sid}"
                )
                room_day_intervals.setdefault(key_room, []).append(ivar)

                for tid, yvar in y[topic.id][si][sid].items():
                    key_teacher = (tid, cs.day_index)
                    ivar_t = model.NewOptionalIntervalVar(
                        cs.start_minute, topic.duration_minutes, cs.end_minute,
                        yvar, f"iv_teacher_{topic.id}_{si}_{sid}_{tid}"
                    )
                    teacher_day_intervals.setdefault(key_teacher, []).append(ivar_t)

    for intervals in room_day_intervals.values():
        model.AddNoOverlap(intervals)
    for intervals in teacher_day_intervals.values():
        model.AddNoOverlap(intervals)

    # ── Constraint 5: max sessions per teacher per day ────────────────────────
    max_s = req.schedule.max_sessions_per_day_per_teacher
    teacher_day_yvars: Dict[Tuple[str, int], List] = {}
    for topic in req.topics:
        for si in range(topic.num_sessions):
            for sid, ydict in y[topic.id][si].items():
                cs = slot_by_id[sid]
                for tid, yvar in ydict.items():
                    teacher_day_yvars.setdefault((tid, cs.day_index), []).append(yvar)
    for yvars in teacher_day_yvars.values():
        model.Add(sum(yvars) <= max_s)

    # ── Objective: minimize days used ─────────────────────────────────────────
    num_days = len(all_dates)
    day_used = [model.NewBoolVar(f"day_used_{d}") for d in range(num_days)]

    # day_used[d] = 1 iff any session is on day d
    all_x_by_day: Dict[int, List] = {d: [] for d in range(num_days)}
    for topic in req.topics:
        for si in range(topic.num_sessions):
            for sid, xvar in x[topic.id][si].items():
                cs = slot_by_id[sid]
                all_x_by_day[cs.day_index].append(xvar)

    for d in range(num_days):
        if all_x_by_day[d]:
            model.AddMaxEquality(day_used[d], all_x_by_day[d])
        else:
            model.Add(day_used[d] == 0)

    cost = sum((d + 1) * SCALE * day_used[d] for d in range(num_days))
    model.Minimize(cost)

    # ── Solve ─────────────────────────────────────────────────────────────────
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = SOLVER_TIME_LIMIT
    solver.parameters.num_workers = 4

    status = solver.Solve(model)

    if status == cp_model.INFEASIBLE:
        return SolveResponse(status="infeasible", sessions=[], warnings=["Problem is infeasible."], total_teaching_days=0)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return None  # Timeout or unknown

    status_str = "optimal" if status == cp_model.OPTIMAL else "feasible"

    # ── Extract solution ──────────────────────────────────────────────────────
    teacher_map = {t.id: t.name for t in req.teachers}
    topic_map = {t.id: (t.name, t.color) for t in req.topics}
    sessions: List[SolvedSession] = []

    for topic in req.topics:
        t_name, t_color = topic_map[topic.id]
        slots = topic_slots[topic.id]
        slot_map = {cs.slot_id: cs for cs in slots}
        for si in range(topic.num_sessions):
            for sid, xvar in x[topic.id][si].items():
                if solver.Value(xvar) == 1:
                    cs = slot_map[sid]
                    # Find assigned teacher
                    assigned_teacher_id = ""
                    for tid, yvar in y[topic.id][si][sid].items():
                        if solver.Value(yvar) == 1:
                            assigned_teacher_id = tid
                            break
                    sessions.append(SolvedSession(
                        session_id=str(uuid.uuid4()),
                        topic_id=topic.id,
                        topic_name=t_name,
                        color=t_color,
                        session_index=si,
                        date=cs.date,
                        start_minute=cs.start_minute,
                        end_minute=cs.end_minute,
                        room_index=cs.room_index,
                        teacher_id=assigned_teacher_id,
                        teacher_name=teacher_map.get(assigned_teacher_id, "Unknown"),
                    ))
                    break

    days_used = sum(1 for d in range(num_days) if solver.Value(day_used[d]) == 1)

    return SolveResponse(
        status=status_str,
        sessions=sessions,
        warnings=warnings,
        total_teaching_days=days_used,
    )
