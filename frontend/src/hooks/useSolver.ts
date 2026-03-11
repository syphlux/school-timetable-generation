import { useState } from 'react'
import { apiPost } from '../lib/api'
import type { SolveResult, WizardData } from '../types'
import { useTimetableStore } from '../store/timetableStore'

function toApiPayload(data: WizardData) {
  return {
    schedule: {
      num_rooms: data.schedule.numRooms,
      weekdays: data.schedule.weekdays.map((w) => ({
        weekday: w.weekday,
        enabled: w.enabled,
        open_minute: w.openMinute,
        close_minute: w.closeMinute,
        breaks: w.breaks.map((b) => ({
          start_minute: b.startMinute,
          end_minute: b.endMinute,
        })),
      })),
      start_date: data.schedule.startDate,
      end_date: data.schedule.endDate,
      max_sessions_per_day_per_teacher: data.schedule.maxSessionsPerDayPerTeacher,
    },
    topics: data.topics.map((t) => ({
      id: t.id,
      name: t.name,
      duration_minutes: t.durationMinutes,
      num_sessions: t.numSessions,
      color: t.color,
    })),
    teachers: data.teachers.map((t) => ({
      id: t.id,
      name: t.name,
      topic_ids: t.topicIds,
      unavailable_dates: t.unavailableDates,
    })),
  }
}

function fromApiResponse(data: unknown): SolveResult {
  const d = data as Record<string, unknown>
  return {
    status: d.status as SolveResult['status'],
    sessions: (d.sessions as Record<string, unknown>[]).map((s) => ({
      sessionId: s.session_id as string,
      topicId: s.topic_id as string,
      topicName: s.topic_name as string,
      color: s.color as string,
      sessionIndex: s.session_index as number,
      date: s.date as string,
      startMinute: s.start_minute as number,
      endMinute: s.end_minute as number,
      roomIndex: s.room_index as number,
      teacherId: s.teacher_id as string,
      teacherName: s.teacher_name as string,
    })),
    warnings: d.warnings as string[],
    totalTeachingDays: d.total_teaching_days as number,
  }
}

export function useSolver() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setResult = useTimetableStore((s) => s.setResult)

  const solve = async (data: WizardData) => {
    setLoading(true)
    setError(null)
    try {
      const payload = toApiPayload(data)
      const raw = await apiPost<unknown>('/solve', payload)
      const result = fromApiResponse(raw)
      setResult(result)
      return result
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { solve, loading, error }
}
