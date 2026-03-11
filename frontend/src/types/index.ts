export interface DayBreak {
  startMinute: number
  endMinute: number
}

export interface WeekdayConfig {
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6
  enabled: boolean
  openMinute: number
  closeMinute: number
  breaks: DayBreak[]
}

export interface ScheduleConfig {
  numRooms: number
  weekdays: WeekdayConfig[]
  startDate: string
  endDate: string
  maxSessionsPerDayPerTeacher: number
}

export interface Topic {
  id: string
  name: string
  durationMinutes: number
  numSessions: number
  color: string
}

export interface Teacher {
  id: string
  name: string
  topicIds: string[]
  unavailableDates: string[]
}

export interface SolvedSession {
  sessionId: string
  topicId: string
  topicName: string
  color: string
  sessionIndex: number
  date: string
  startMinute: number
  endMinute: number
  roomIndex: number
  teacherId: string
  teacherName: string
}

export interface SolveResult {
  status: 'optimal' | 'feasible' | 'infeasible' | 'relaxed'
  sessions: SolvedSession[]
  warnings: string[]
  totalTeachingDays: number
}

export interface WizardData {
  schedule: ScheduleConfig
  topics: Topic[]
  teachers: Teacher[]
}
