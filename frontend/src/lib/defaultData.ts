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
  const day = d.getDay()
  const daysUntilMonday = day === 0 ? 1 : 8 - day
  d.setDate(d.getDate() + daysUntilMonday)
  return localDateStr(d)
}

function addDays(base: string, n: number): string {
  const d = new Date(base + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return localDateStr(d)
}

/**
 * Complex sample dataset (~50 sessions):
 *   – 7 topics across STEM + humanities
 *   – 4 teachers with specialisations (no one can teach everything)
 *   – 3-week window (Mon–Sat), Sun always off
 *   – Mon–Fri 08:00–17:00, morning break 10:15–10:30, lunch 12:30–13:15
 *   – Saturday 08:00–13:00 (half day, no break)
 *   – 3 rooms, max 3 sessions/teacher/day
 *   – Each teacher has 2 unavailable days spread across the window
 */
export function getDefaultData(): WizardData {
  const startDate = nextMonday()

  // Unavailable dates per teacher (offsets from startDate)
  // Alice:  Wed wk1 (+2), Thu wk2 (+10)
  // Bob:    Mon wk2 (+7), Fri wk3 (+18)
  // Carol:  Tue wk1 (+1), Wed wk3 (+16)
  // David:  Thu wk1 (+3), Tue wk3 (+15)
  const aliceOff = [addDays(startDate, 2), addDays(startDate, 10)]
  const bobOff   = [addDays(startDate, 7), addDays(startDate, 18)]
  const carolOff = [addDays(startDate, 1), addDays(startDate, 16)]
  const davidOff = [addDays(startDate, 3), addDays(startDate, 15)]

  const weekdayConfig = (breaks: { startMinute: number; endMinute: number }[]) =>
    ({ enabled: true, openMinute: 480, closeMinute: 1020, breaks })

  const weekdayBreaks = [
    { startMinute: 615, endMinute: 630 },  // 10:15–10:30
    { startMinute: 750, endMinute: 795 },  // 12:30–13:15
  ]

  return {
    schedule: {
      numRooms: 3,
      startDate,
      maxSessionsPerDayPerTeacher: 4,
      weekdays: [
        // Sun
        { weekday: 0, enabled: false, openMinute: 480, closeMinute: 1020, breaks: [] },
        // Mon–Fri
        { weekday: 1, ...weekdayConfig(weekdayBreaks) },
        { weekday: 2, ...weekdayConfig(weekdayBreaks) },
        { weekday: 3, ...weekdayConfig(weekdayBreaks) },
        { weekday: 4, ...weekdayConfig(weekdayBreaks) },
        { weekday: 5, ...weekdayConfig(weekdayBreaks) },
        // Sat — half day, no breaks
        { weekday: 6, enabled: true, openMinute: 480, closeMinute: 780, breaks: [] },
      ],
    },
    topics: [
      // 10 + 6 + 8 + 7 + 6 + 8 + 5 = 50 sessions
      {
        id: 'demo-math',
        name: 'Mathematics',
        durationMinutes: 60,
        numSessions: 10,
        color: '#3B82F6',
      },
      {
        id: 'demo-physics',
        name: 'Physics',
        durationMinutes: 90,
        numSessions: 6,
        color: '#F59E0B',
      },
      {
        id: 'demo-chemistry',
        name: 'Chemistry',
        durationMinutes: 60,
        numSessions: 8,
        color: '#EF4444',
      },
      {
        id: 'demo-cs',
        name: 'Computer Science',
        durationMinutes: 90,
        numSessions: 7,
        color: '#06B6D4',
      },
      {
        id: 'demo-english',
        name: 'English Literature',
        durationMinutes: 75,
        numSessions: 6,
        color: '#8B5CF6',
      },
      {
        id: 'demo-history',
        name: 'History',
        durationMinutes: 60,
        numSessions: 8,
        color: '#10B981',
      },
      {
        id: 'demo-art',
        name: 'Art & Design',
        durationMinutes: 90,
        numSessions: 5,
        color: '#EC4899',
      },
    ],
    teachers: [
      {
        id: 'demo-alice',
        name: 'Alice Martin',
        // STEM specialist — no humanities
        topicIds: ['demo-math', 'demo-physics', 'demo-cs'],
        unavailableDates: aliceOff,
      },
      {
        id: 'demo-bob',
        name: 'Bob Chen',
        // Science specialist
        topicIds: ['demo-physics', 'demo-chemistry'],
        unavailableDates: bobOff,
      },
      {
        id: 'demo-carol',
        name: 'Carol Rivera',
        // Humanities + Art
        topicIds: ['demo-english', 'demo-history', 'demo-art'],
        unavailableDates: carolOff,
      },
      {
        id: 'demo-david',
        name: 'David Osei',
        // Cross-disciplinary: Math, CS, Chemistry, History
        topicIds: ['demo-math', 'demo-cs', 'demo-chemistry', 'demo-history'],
        unavailableDates: davidOff,
      },
    ],
  }
}
