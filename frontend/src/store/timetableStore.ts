import { create } from 'zustand'
import type { SolvedSession, SolveResult } from '../types'

interface TimetableStore {
  result: SolveResult | null
  setResult: (r: SolveResult) => void
  updateSession: (sessionId: string, patch: Partial<SolvedSession>) => void
  addSession: (session: SolvedSession) => void
  removeSession: (sessionId: string) => void
  swapSessions: (id1: string, id2: string) => void
  clear: () => void
}

export const useTimetableStore = create<TimetableStore>((set) => ({
  result: null,

  setResult: (r) => set({ result: r }),

  updateSession: (sessionId, patch) =>
    set((state) => {
      if (!state.result) return state
      return {
        result: {
          ...state.result,
          sessions: state.result.sessions.map((s) =>
            s.sessionId === sessionId ? { ...s, ...patch } : s
          ),
        },
      }
    }),

  addSession: (session) =>
    set((state) => {
      if (!state.result) return state
      return { result: { ...state.result, sessions: [...state.result.sessions, session] } }
    }),

  removeSession: (sessionId) =>
    set((state) => {
      if (!state.result) return state
      return {
        result: {
          ...state.result,
          sessions: state.result.sessions.filter((s) => s.sessionId !== sessionId),
        },
      }
    }),

  swapSessions: (id1, id2) =>
    set((state) => {
      if (!state.result) return state
      const s1 = state.result.sessions.find((s) => s.sessionId === id1)
      const s2 = state.result.sessions.find((s) => s.sessionId === id2)
      if (!s1 || !s2) return state
      return {
        result: {
          ...state.result,
          sessions: state.result.sessions.map((s) => {
            if (s.sessionId === id1) {
              const dur = s1.endMinute - s1.startMinute
              return { ...s, date: s2.date, startMinute: s2.startMinute, endMinute: s2.startMinute + dur, roomIndex: s2.roomIndex }
            }
            if (s.sessionId === id2) {
              const dur = s2.endMinute - s2.startMinute
              return { ...s, date: s1.date, startMinute: s1.startMinute, endMinute: s1.startMinute + dur, roomIndex: s1.roomIndex }
            }
            return s
          }),
        },
      }
    }),

  clear: () => set({ result: null }),
}))
