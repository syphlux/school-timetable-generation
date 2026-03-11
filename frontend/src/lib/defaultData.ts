import type { WizardData } from '../types'

function localDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Returns the YYYY-MM-DD string for the next Monday on or after today. */
function nextMonday(): string {
  const d = new Date()
  const day = d.getDay() // 0=Sun … 6=Sat
  const daysUntilMonday = day === 0 ? 1 : 8 - day
  d.setDate(d.getDate() + daysUntilMonday)
  return localDateStr(d)
}

/**
 * Default testing dataset:
 *   – 3 topics (Math 1h×3, Science 45min×2, English 1h30×2)
 *   – 2 teachers (Alice teaches all three; Bob teaches Math + Science)
 *   – Mon–Fri, 08:00–17:00, 12:00–13:00 lunch break
 *   – 7-day calendar window (Mon → Sun), 2 rooms, max 3 sessions/teacher/day
 *
 * Dates are computed dynamically so the window always starts next Monday.
 */
export function getDefaultData(): WizardData {
  const startDate = nextMonday()
  const end = new Date(startDate + 'T00:00:00')
  end.setDate(end.getDate() + 6) // Mon + 6 = Sun → 7-day window, 5 working days
  const endDate = localDateStr(end)

  return {
    schedule: {
      numRooms: 2,
      startDate,
      endDate,
      maxSessionsPerDayPerTeacher: 3,
      weekdays: [
        // Sun
        { weekday: 0, enabled: false, openMinute: 480, closeMinute: 1020, breaks: [] },
        // Mon
        { weekday: 1, enabled: true, openMinute: 480, closeMinute: 1020, breaks: [{ startMinute: 720, endMinute: 780 }] },
        // Tue
        { weekday: 2, enabled: true, openMinute: 480, closeMinute: 1020, breaks: [{ startMinute: 720, endMinute: 780 }] },
        // Wed
        { weekday: 3, enabled: true, openMinute: 480, closeMinute: 1020, breaks: [{ startMinute: 720, endMinute: 780 }] },
        // Thu
        { weekday: 4, enabled: true, openMinute: 480, closeMinute: 1020, breaks: [{ startMinute: 720, endMinute: 780 }] },
        // Fri
        { weekday: 5, enabled: true, openMinute: 480, closeMinute: 1020, breaks: [{ startMinute: 720, endMinute: 780 }] },
        // Sat
        { weekday: 6, enabled: false, openMinute: 480, closeMinute: 1020, breaks: [] },
      ],
    },
    topics: [
      {
        id: 'demo-math',
        name: 'Mathematics',
        durationMinutes: 60,
        numSessions: 3,
        color: '#3B82F6',
      },
      {
        id: 'demo-science',
        name: 'Science',
        durationMinutes: 45,
        numSessions: 2,
        color: '#10B981',
      },
      {
        id: 'demo-english',
        name: 'English Literature',
        durationMinutes: 90,
        numSessions: 2,
        color: '#8B5CF6',
      },
    ],
    teachers: [
      {
        id: 'demo-alice',
        name: 'Alice Martin',
        topicIds: ['demo-math', 'demo-science', 'demo-english'],
        unavailableDates: [],
      },
      {
        id: 'demo-bob',
        name: 'Bob Chen',
        topicIds: ['demo-math', 'demo-science'],
        unavailableDates: [],
      },
    ],
  }
}
