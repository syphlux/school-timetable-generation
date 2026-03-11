from typing import Optional
from app.models.request import SolveRequest
from app.utils.time_utils import dates_in_range, valid_slot_starts


def check_contradictions(req: SolveRequest) -> Optional[str]:
    """Return an error string if the request is provably infeasible, else None."""

    enabled_weekdays = {wc.weekday for wc in req.schedule.weekdays if wc.enabled}
    weekday_map = {wc.weekday: wc for wc in req.schedule.weekdays if wc.enabled}
    all_dates = dates_in_range(req.schedule.start_date, req.schedule.end_date, enabled_weekdays)

    if not all_dates:
        return "No enabled weekdays fall within the specified date range."

    teacher_topics = {t.id: set(t.topic_ids) for t in req.teachers}
    teacher_unavail = {t.id: set(t.unavailable_dates) for t in req.teachers}

    for topic in req.topics:
        # Check at least one qualified teacher exists
        qualified = [t for t in req.teachers if topic.id in teacher_topics[t.id]]
        if not qualified:
            return f"Topic '{topic.name}' has no qualified teachers."

        # Check that at least one date has an available teacher and a valid slot
        any_slot = False
        for d in all_dates:
            wc = weekday_map.get(d.weekday())
            if wc is None:
                continue
            starts = valid_slot_starts(wc.open_minute, wc.close_minute, topic.duration_minutes, wc.breaks)
            if not starts:
                continue
            date_str = d.isoformat()
            if any(date_str not in teacher_unavail[t.id] for t in qualified):
                any_slot = True
                break

        if not any_slot:
            return f"Topic '{topic.name}' has no valid slots across any available teacher and date."

        # Arithmetic feasibility: total sessions needed vs total slot capacity
        total_needed = topic.num_sessions
        total_available_slots = 0
        for d in all_dates:
            wc = weekday_map.get(d.weekday())
            if wc is None:
                continue
            date_str = d.isoformat()
            avail_teachers = [t for t in qualified if date_str not in teacher_unavail[t.id]]
            if not avail_teachers:
                continue
            starts = valid_slot_starts(wc.open_minute, wc.close_minute, topic.duration_minutes, wc.breaks)
            total_available_slots += len(starts) * req.schedule.num_rooms

        if total_available_slots < total_needed:
            return (
                f"Topic '{topic.name}' needs {total_needed} sessions but only "
                f"{total_available_slots} valid slots exist."
            )

    return None
