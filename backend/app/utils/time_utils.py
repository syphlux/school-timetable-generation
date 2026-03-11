from datetime import date, timedelta
from typing import List


def parse_date(s: str) -> date:
    return date.fromisoformat(s)


def dates_in_range(start: str, end: str, enabled_weekdays: set) -> List[date]:
    """Return all dates in [start, end] whose weekday is in enabled_weekdays."""
    result = []
    current = parse_date(start)
    end_d = parse_date(end)
    while current <= end_d:
        if current.weekday() in enabled_weekdays:
            result.append(current)
        current += timedelta(days=1)
    return result


def valid_slot_starts(open_min: int, close_min: int, duration_min: int, breaks: list) -> List[int]:
    """Return all 15-min aligned start minutes that fit within [open, close] without overlapping breaks."""
    slots = []
    t = open_min
    while t + duration_min <= close_min:
        end = t + duration_min
        # Check no overlap with any break
        ok = True
        for br in breaks:
            # Overlap if t < br.end_minute and end > br.start_minute
            if t < br.end_minute and end > br.start_minute:
                ok = False
                break
        if ok:
            slots.append(t)
        t += 15
    return slots
