from collections import defaultdict
from typing import Optional
import datetime
import random

from app.models.request import SolveRequest, Teacher, Topic
from app.models.response import SolveResponse, SolvedSession


def is_available_slot(
    req: SolveRequest, 
    weekday: int,
    start_minute: int, 
    duration_minutes: int,
    sessions: list[SolvedSession], # sessions[(date, room_index)]
) -> bool:
    weekday_config = next((w for w in req.schedule.weekdays if w.weekday == weekday), None)
    if not weekday_config or not weekday_config.enabled:
        return False
    end_minute = start_minute + duration_minutes
    if end_minute > weekday_config.close_minute:
        return False
    if start_minute < weekday_config.open_minute:
        return False
    for br in weekday_config.breaks:
        if not (end_minute <= br.start_minute or start_minute >= br.end_minute):
            return False
    for session in sessions:
        if not (end_minute <= session.start_minute or start_minute >= session.end_minute):
            return False
    return True

def is_available_teacher(
    req: SolveRequest,
    topic: Topic,
    teacher: Teacher,
    date: str,
    start_minute: int,
    duration_minutes: int,
    sessions: list[SolvedSession], # sessions[(date, teacher_id)]
) -> bool:
    if len(sessions) >= req.schedule.max_sessions_per_day_per_teacher:
        return False
    if topic.id not in teacher.topic_ids:
        return False
    if date in teacher.unavailable_dates:
        return False
    end_minute = start_minute + duration_minutes
    for session in sessions:
        if not (end_minute <= session.start_minute or start_minute >= session.end_minute):
            return False
    return True

def run_solver(req: SolveRequest) -> Optional[SolveResponse]:
    sessions_by_date_room = defaultdict(list)  # (date, room_index) -> List[SolvedSession]
    sessions_by_date_teacher = defaultdict(list)  # (date, teacher_id) -> List[SolvedSession]
    sessions = []  # List[SolvedSession]
    total_sessions = sum(topic.num_sessions for topic in req.topics)
    rem_sessions_per_topic = {topic.id: topic.num_sessions for topic in req.topics}
    last_date_per_topic = {topic.id: req.schedule.start_date for topic in req.topics}
    while len(sessions) < total_sessions:
        # choose topic randomly, weight by remaining sessions
        topic_id = random.choices(
            population=list(rem_sessions_per_topic.keys()),
            weights=list(rem_sessions_per_topic.values()),
            k=1
        )[0]
        topic = next(t for t in req.topics if t.id == topic_id)
        curr_date = datetime.datetime.strptime(last_date_per_topic[topic_id], "%Y-%m-%d").date()
        # try to schedule this topic on the earliest possible date
        scheduled = False
        while not scheduled:
            weekday = (curr_date.weekday() + 1) % 7  # convert Python weekday (0=Mon) to our weekday (0=Sun)
            date_str = curr_date.strftime("%Y-%m-%d")
            # shuffle rooms to avoid bias
            room_indices = list(range(req.schedule.num_rooms))
            random.shuffle(room_indices)
            for room_index in room_indices:
                # try all possible start times for this topic on this date and room
                start_minute = req.schedule.weekdays[weekday].open_minute
                while start_minute + topic.duration_minutes <= req.schedule.weekdays[weekday].close_minute:
                    print(start_minute, topic.duration_minutes, req.schedule.weekdays[weekday].close_minute)
                    if not is_available_slot(req, weekday, start_minute, topic.duration_minutes, sessions_by_date_room[(date_str, room_index)]):
                        start_minute += 15
                        continue
                    # find an available teacher
                    random.shuffle(req.teachers)
                    for teacher in req.teachers:
                        if not is_available_teacher(req, topic, teacher, date_str, start_minute, topic.duration_minutes, sessions_by_date_teacher[(date_str, teacher.id)]):
                            continue
                        # schedule the session
                        session = SolvedSession(
                            session_id=f"{topic_id}_{rem_sessions_per_topic[topic_id]}",
                            topic_id=topic_id,
                            topic_name=topic.name,
                            color=topic.color,
                            session_index=topic.num_sessions - rem_sessions_per_topic[topic_id],
                            date=date_str,
                        start_minute=start_minute,
                        end_minute=start_minute + topic.duration_minutes,
                        room_index=room_index,
                        teacher_id=teacher.id,
                        teacher_name=teacher.name
                    )
                        sessions.append(session)
                        sessions_by_date_room[(date_str, room_index)].append(session)
                        sessions_by_date_teacher[(date_str, teacher.id)].append(session)
                        rem_sessions_per_topic[topic_id] -= 1
                        last_date_per_topic[topic_id] = date_str
                        scheduled = True
                        break
                    if scheduled:
                        break
                    start_minute += 15  # try next time slot
                if scheduled:
                    break
                
            if not scheduled:
                # move to next day
                curr_date += datetime.timedelta(days=1)
    total_teaching_days = len(set(s.date for s in sessions))
    print(sessions)
    return SolveResponse(
        status="feasible",
        sessions=sessions,
        warnings=[],
        total_teaching_days=total_teaching_days
    )
    