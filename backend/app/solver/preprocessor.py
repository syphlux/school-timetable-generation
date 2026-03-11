from dataclasses import dataclass
from typing import List, Dict, Tuple
from app.models.request import SolveRequest, WeekdayConfig
from app.utils.time_utils import dates_in_range, valid_slot_starts
from datetime import date


@dataclass
class CandidateSlot:
    slot_id: int
    date: str
    day_index: int
    room_index: int
    start_minute: int
    end_minute: int


def preprocess(req: SolveRequest) -> Tuple[List[date], Dict[str, List[CandidateSlot]]]:
    """
    Returns:
      - ordered list of calendar dates
      - dict mapping topic_id -> list of CandidateSlot
    """
    enabled_weekdays = {wc.weekday for wc in req.schedule.weekdays if wc.enabled}
    weekday_map: Dict[int, WeekdayConfig] = {wc.weekday: wc for wc in req.schedule.weekdays if wc.enabled}

    all_dates = dates_in_range(req.schedule.start_date, req.schedule.end_date, enabled_weekdays)

    # Teacher availability index
    teacher_unavail: Dict[str, set] = {t.id: set(t.unavailable_dates) for t in req.teachers}
    teacher_topics: Dict[str, set] = {t.id: set(t.topic_ids) for t in req.teachers}

    slot_id = 0
    topic_slots: Dict[str, List[CandidateSlot]] = {topic.id: [] for topic in req.topics}

    for day_idx, d in enumerate(all_dates):
        wc = weekday_map[d.isoweekday() % 7]
        date_str = d.isoformat()
        for room_idx in range(req.schedule.num_rooms):
            for topic in req.topics:
                starts = valid_slot_starts(wc.open_minute, wc.close_minute, topic.duration_minutes, wc.breaks)
                for start in starts:
                    # Check at least one teacher is available and qualified
                    has_teacher = any(
                        topic.id in teacher_topics[t.id] and date_str not in teacher_unavail[t.id]
                        for t in req.teachers
                    )
                    if has_teacher:
                        cs = CandidateSlot(
                            slot_id=slot_id,
                            date=date_str,
                            day_index=day_idx,
                            room_index=room_idx,
                            start_minute=start,
                            end_minute=start + topic.duration_minutes,
                        )
                        topic_slots[topic.id].append(cs)
                        slot_id += 1

    return all_dates, topic_slots
