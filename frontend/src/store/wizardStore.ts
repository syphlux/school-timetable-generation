import { create } from 'zustand'
import type { ScheduleConfig, Topic, Teacher, WeekdayConfig } from '../types'

const defaultWeekdays: WeekdayConfig[] = Array.from({ length: 7 }, (_, i) => ({
  weekday: i as WeekdayConfig['weekday'],
  enabled: i >= 1 && i <= 5, // Mon-Fri
  openMinute: 480,   // 08:00
  closeMinute: 1020, // 17:00
  breaks: [],
}))

interface WizardStore {
  schedule: ScheduleConfig
  topics: Topic[]
  teachers: Teacher[]
  setSchedule: (s: Partial<ScheduleConfig>) => void
  setWeekday: (idx: number, cfg: Partial<WeekdayConfig>) => void
  addTopic: (t: Topic) => void
  updateTopic: (id: string, t: Partial<Topic>) => void
  removeTopic: (id: string) => void
  addTeacher: (t: Teacher) => void
  updateTeacher: (id: string, t: Partial<Teacher>) => void
  removeTeacher: (id: string) => void
  reset: () => void
}

const defaultSchedule: ScheduleConfig = {
  numRooms: 2,
  weekdays: defaultWeekdays,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  maxSessionsPerDayPerTeacher: 3,
}

export const useWizardStore = create<WizardStore>((set) => ({
  schedule: defaultSchedule,
  topics: [],
  teachers: [],

  setSchedule: (s) =>
    set((state) => ({ schedule: { ...state.schedule, ...s } })),

  setWeekday: (idx, cfg) =>
    set((state) => ({
      schedule: {
        ...state.schedule,
        weekdays: state.schedule.weekdays.map((w, i) =>
          i === idx ? { ...w, ...cfg } : w
        ),
      },
    })),

  addTopic: (t) => set((state) => ({ topics: [...state.topics, t] })),
  updateTopic: (id, t) =>
    set((state) => ({
      topics: state.topics.map((tp) => (tp.id === id ? { ...tp, ...t } : tp)),
    })),
  removeTopic: (id) =>
    set((state) => ({ topics: state.topics.filter((t) => t.id !== id) })),

  addTeacher: (t) => set((state) => ({ teachers: [...state.teachers, t] })),
  updateTeacher: (id, t) =>
    set((state) => ({
      teachers: state.teachers.map((tc) => (tc.id === id ? { ...tc, ...t } : tc)),
    })),
  removeTeacher: (id) =>
    set((state) => ({ teachers: state.teachers.filter((t) => t.id !== id) })),

  reset: () =>
    set({ schedule: defaultSchedule, topics: [], teachers: [] }),
}))
