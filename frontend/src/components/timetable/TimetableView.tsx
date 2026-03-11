import { useState, type RefObject } from 'react'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from '@dnd-kit/core'
import { useTimetableStore } from '../../store/timetableStore'
import { useWizardStore } from '../../store/wizardStore'
import type { SolvedSession, Teacher, DayBreak, WeekdayConfig, Topic } from '../../types'
import { DayColumn } from './DayColumn'
import { SwapOverlay } from './SwapOverlay'
import { TeacherPicker } from './TeacherPicker'
import { SessionBlockOverlay } from './SessionBlock'
import { CreateSessionModal } from './CreateSessionModal'
import { useToast } from '../ui/toast'
import { snapTo15, generateId, formatDuration } from '../../lib/utils'

const PX_PER_15 = 48

/** Format a Date as YYYY-MM-DD using local time (avoids UTC offset shifting the date). */
function localDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Returns the next enabled weekday date (YYYY-MM-DD) strictly after `afterDate`. */
function nextWorkingDay(afterDate: string, weekdays: WeekdayConfig[]): string {
  const enabled = new Set<number>(weekdays.filter((w) => w.enabled).map((w) => w.weekday))
  const d = new Date(afterDate + 'T00:00:00')
  for (let i = 0; i < 14; i++) {
    d.setDate(d.getDate() + 1)
    if (enabled.has(d.getDay())) return localDateStr(d)
  }
  const fallback = new Date(afterDate + 'T00:00:00')
  fallback.setDate(fallback.getDate() + 1)
  return localDateStr(fallback)
}

function overlapsAnyBreak(start: number, end: number, breaks: DayBreak[]): boolean {
  return breaks.some((b) => start < b.endMinute && end > b.startMinute)
}

interface DropData {
  roomIndex: number
  date: string
  workStart: number
  workEnd: number
  breaks: DayBreak[]
}

interface DropPreview {
  date: string
  roomIndex: number
  startMinute: number
  endMinute: number
  color: string
  valid: boolean
}

interface CreateContext {
  date: string
  roomIndex: number
  startMinute: number
  workEnd: number
  breaks: DayBreak[]
}

function DeleteBin({ visible }: { visible: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'session-delete-bin' })
  if (!visible) return null
  return (
    <div
      ref={setNodeRef}
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-6 py-3 rounded-full border-2 shadow-lg transition-colors select-none pointer-events-auto ${
        isOver
          ? 'bg-red-600 border-red-600 text-white'
          : 'bg-white border-red-400 text-red-500'
      }`}
    >
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <span className="text-sm font-medium">Drop to delete</span>
    </div>
  )
}

interface Props {
  timetableRef: RefObject<HTMLDivElement | null>
}

export function TimetableView({ timetableRef }: Props) {
  const { result, updateSession, addSession, removeSession, swapSessions } = useTimetableStore()
  const { schedule, topics, teachers } = useWizardStore()
  const { addToast } = useToast()

  const [swapFirst, setSwapFirst] = useState<string | null>(null)
  const [reassignSession, setReassignSession] = useState<SolvedSession | null>(null)
  const [activeSession, setActiveSession] = useState<SolvedSession | null>(null)
  const [dropPreview, setDropPreview] = useState<DropPreview | null>(null)
  const [createContext, setCreateContext] = useState<CreateContext | null>(null)
  const [focusedTeacherIds, setFocusedTeacherIds] = useState<Set<string>>(new Set())

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  if (!result) return null

  const sessionsByDate = new Map<string, SolvedSession[]>()
  for (const s of result.sessions) {
    if (!sessionsByDate.has(s.date)) sessionsByDate.set(s.date, [])
    sessionsByDate.get(s.date)!.push(s)
  }

  const usedDates = Array.from(sessionsByDate.keys()).sort()
  const firstDate = usedDates[0]
  const lastDate = usedDates[usedDates.length - 1]

  // Fill all working days from first to last (shows intermediate empty days)
  const filledDates: string[] = []
  if (firstDate && lastDate) {
    const enabled = new Set<number>(schedule.weekdays.filter((w) => w.enabled).map((w) => w.weekday))
    const d = new Date(firstDate + 'T00:00:00')
    const end = new Date(lastDate + 'T00:00:00')
    while (d <= end) {
      if (enabled.has(d.getDay())) filledDates.push(localDateStr(d))
      d.setDate(d.getDate() + 1)
    }
  }

  const emptyDay = lastDate ? nextWorkingDay(lastDate, schedule.weekdays) : null
  const sortedDates = emptyDay ? [...filledDates, emptyDay] : filledDates

  // Display range: earliest open - 1h … latest close + 1h (shared across all days)
  const enabledWeekdays = schedule.weekdays.filter((w) => w.enabled)
  const globalOpen  = enabledWeekdays.length > 0 ? Math.min(...enabledWeekdays.map((w) => w.openMinute))  : 480
  const globalClose = enabledWeekdays.length > 0 ? Math.max(...enabledWeekdays.map((w) => w.closeMinute)) : 1020
  const displayStart = Math.max(0, globalOpen - 60)
  const displayEnd   = Math.min(1440, globalClose + 60)

  // Helper: per-day weekday config
  const dayConfig = (date: string) => {
    const wd = new Date(date + 'T00:00:00').getDay()
    return schedule.weekdays.find((w) => w.weekday === wd && w.enabled)
  }

  const isTeacherUnavailable = (teacherId: string, date: string): boolean =>
    teachers.find((t) => t.id === teacherId)?.unavailableDates.includes(date) ?? false

  const teacherDayCount = (teacherId: string, date: string, excludeIds: string[] = []): number =>
    result.sessions.filter(
      (s) => s.teacherId === teacherId && s.date === date && !excludeIds.includes(s.sessionId)
    ).length

  const hasTeacherConflict = (
    session: SolvedSession,
    date: string,
    newStart: number,
    newEnd: number,
  ): boolean =>
    (sessionsByDate.get(date) ?? []).some(
      (s) =>
        s.sessionId !== session.sessionId &&
        s.teacherId === session.teacherId &&
        s.startMinute < newEnd &&
        s.endMinute > newStart
    )

  const isValidDrop = (
    session: SolvedSession,
    newStart: number,
    newEnd: number,
    dropData: DropData,
  ): boolean => {
    if (newStart < dropData.workStart || newEnd > dropData.workEnd) return false
    if (overlapsAnyBreak(newStart, newEnd, dropData.breaks)) return false
    const roomConflict = (sessionsByDate.get(dropData.date) ?? []).some(
      (s) =>
        s.sessionId !== session.sessionId &&
        s.roomIndex === dropData.roomIndex &&
        s.startMinute < newEnd &&
        s.endMinute > newStart
    )
    if (roomConflict) return false
    if (isTeacherUnavailable(session.teacherId, dropData.date)) return false
    if (teacherDayCount(session.teacherId, dropData.date, [session.sessionId]) >= schedule.maxSessionsPerDayPerTeacher) return false
    return !hasTeacherConflict(session, dropData.date, newStart, newEnd)
  }

  const computePreview = (
    session: SolvedSession,
    deltaX: number,
    over: DragMoveEvent['over'],
  ): DropPreview | null => {
    if (!over) return null
    const dropData = over.data.current as DropData | undefined
    if (!dropData) return null

    const newStart = snapTo15(session.startMinute + (deltaX / PX_PER_15) * 15)
    const newEnd = newStart + (session.endMinute - session.startMinute)

    return {
      date: dropData.date,
      roomIndex: dropData.roomIndex,
      startMinute: newStart,
      endMinute: newEnd,
      color: session.color,
      valid: isValidDrop(session, newStart, newEnd, dropData),
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveSession(event.active.data.current?.session ?? null)
  }

  const handleDragMove = (event: DragMoveEvent) => {
    const session = event.active.data.current?.session as SolvedSession | undefined
    if (!session) { setDropPreview(null); return }
    setDropPreview(computePreview(session, event.delta.x, event.over))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveSession(null)
    setDropPreview(null)

    const { active, over } = event
    if (!over) return

    const session = active.data.current?.session as SolvedSession
    if (!session) return

    if (over.id === 'session-delete-bin') {
      removeSession(session.sessionId)
      addToast(`Session deleted.`, 'success')
      return
    }

    const dropData = over.data.current as DropData | undefined
    if (!dropData) return

    const newStart = snapTo15(session.startMinute + (event.delta.x / PX_PER_15) * 15)
    const newEnd = newStart + (session.endMinute - session.startMinute)

    if (newStart < dropData.workStart || newEnd > dropData.workEnd) {
      addToast('Cannot move session outside working hours.', 'error')
      return
    }
    if (overlapsAnyBreak(newStart, newEnd, dropData.breaks)) {
      addToast('Cannot move session into a break period.', 'error')
      return
    }
    const hasRoomOverlap = (sessionsByDate.get(dropData.date) ?? []).some(
      (s) =>
        s.sessionId !== session.sessionId &&
        s.roomIndex === dropData.roomIndex &&
        s.startMinute < newEnd &&
        s.endMinute > newStart
    )
    if (hasRoomOverlap) {
      addToast('Session would overlap with another session in the same room.', 'error')
      return
    }
    if (isTeacherUnavailable(session.teacherId, dropData.date)) {
      addToast(`${session.teacherName} is unavailable on ${dropData.date}.`, 'error')
      return
    }
    if (teacherDayCount(session.teacherId, dropData.date, [session.sessionId]) >= schedule.maxSessionsPerDayPerTeacher) {
      addToast(`${session.teacherName} already has the maximum ${schedule.maxSessionsPerDayPerTeacher} sessions on ${dropData.date}.`, 'error')
      return
    }
    if (hasTeacherConflict(session, dropData.date, newStart, newEnd)) {
      addToast(`${session.teacherName} is already teaching at that time.`, 'error')
      return
    }

    updateSession(session.sessionId, {
      date: dropData.date,
      startMinute: newStart,
      endMinute: newEnd,
      roomIndex: dropData.roomIndex,
    })
  }

  const handleDragCancel = () => {
    setActiveSession(null)
    setDropPreview(null)
  }

  const handleSwapClick = (session: SolvedSession) => {
    if (!swapFirst) {
      setSwapFirst(session.sessionId)
      return
    }
    if (swapFirst === session.sessionId) {
      setSwapFirst(null)
      return
    }

    const first = result.sessions.find((s) => s.sessionId === swapFirst)
    if (!first) { setSwapFirst(null); return }

    const dur1 = first.endMinute - first.startMinute
    const dur2 = session.endMinute - session.startMinute

    // Where each session will land after the swap
    const newFirstEnd = session.startMinute + dur1
    const newSecondEnd = first.startMinute + dur2

    const wcFirst   = dayConfig(first.date)
    const wcSession = dayConfig(session.date)
    const workEndFirst   = wcFirst?.closeMinute   ?? globalClose
    const workEndSession = wcSession?.closeMinute ?? globalClose
    const breaksFirst    = wcFirst?.breaks   ?? []
    const breaksSession  = wcSession?.breaks ?? []

    const fail = (msg: string) => { addToast(msg, 'error'); setSwapFirst(null) }

    // Time fits
    if (newFirstEnd > workEndSession)
      return fail(`${first.topicName} (${formatDuration(dur1)}) doesn't fit before end of day on ${session.date}.`)
    if (newSecondEnd > workEndFirst)
      return fail(`${session.topicName} (${formatDuration(dur2)}) doesn't fit before end of day on ${first.date}.`)

    // Break overlap
    if (overlapsAnyBreak(session.startMinute, newFirstEnd, breaksSession))
      return fail(`${first.topicName} would overlap a break on ${session.date}.`)
    if (overlapsAnyBreak(first.startMinute, newSecondEnd, breaksFirst))
      return fail(`${session.topicName} would overlap a break on ${first.date}.`)

    // Room overlap (exclude both swapped sessions from check)
    const others = result.sessions.filter(
      (s) => s.sessionId !== first.sessionId && s.sessionId !== session.sessionId
    )
    if (others.some((s) => s.date === session.date && s.roomIndex === session.roomIndex && s.startMinute < newFirstEnd && s.endMinute > session.startMinute))
      return fail(`${first.topicName} would overlap another session in the room on ${session.date}.`)
    if (others.some((s) => s.date === first.date && s.roomIndex === first.roomIndex && s.startMinute < newSecondEnd && s.endMinute > first.startMinute))
      return fail(`${session.topicName} would overlap another session in the room on ${first.date}.`)

    // Teacher unavailable
    if (isTeacherUnavailable(first.teacherId, session.date))
      return fail(`${first.teacherName} is unavailable on ${session.date}.`)
    if (isTeacherUnavailable(session.teacherId, first.date))
      return fail(`${session.teacherName} is unavailable on ${first.date}.`)

    // Max sessions per day (only relevant when dates differ)
    if (first.date !== session.date) {
      if (teacherDayCount(first.teacherId, session.date, [first.sessionId, session.sessionId]) >= schedule.maxSessionsPerDayPerTeacher)
        return fail(`${first.teacherName} already has the maximum ${schedule.maxSessionsPerDayPerTeacher} sessions on ${session.date}.`)
      if (teacherDayCount(session.teacherId, first.date, [first.sessionId, session.sessionId]) >= schedule.maxSessionsPerDayPerTeacher)
        return fail(`${session.teacherName} already has the maximum ${schedule.maxSessionsPerDayPerTeacher} sessions on ${first.date}.`)
    }

    // Teacher schedule conflict
    if (others.some((s) => s.teacherId === first.teacherId && s.date === session.date && s.startMinute < newFirstEnd && s.endMinute > session.startMinute))
      return fail(`${first.teacherName} has a schedule conflict on ${session.date}.`)
    if (others.some((s) => s.teacherId === session.teacherId && s.date === first.date && s.startMinute < newSecondEnd && s.endMinute > first.startMinute))
      return fail(`${session.teacherName} has a schedule conflict on ${first.date}.`)

    swapSessions(swapFirst, session.sessionId)
    addToast('Sessions swapped successfully.', 'success')
    setSwapFirst(null)
  }

  const handleTeacherAssign = (sessionId: string, teacher: Teacher) => {
    updateSession(sessionId, { teacherId: teacher.id, teacherName: teacher.name })
    setReassignSession(null)
    addToast(`Teacher reassigned to ${teacher.name}.`, 'success')
  }

  const handleSlotRightClick = (date: string, roomIndex: number, minute: number) => {
    const wc = dayConfig(date)
    setCreateContext({
      date,
      roomIndex,
      startMinute: minute,
      workEnd: wc?.closeMinute ?? globalClose,
      breaks: wc?.breaks ?? [],
    })
  }

  const handleCreateSession = (topic: Topic, teacher: Teacher) => {
    if (!createContext) return
    const sessionIndex =
      (result?.sessions.filter((s) => s.topicId === topic.id).length ?? 0) + 1
    addSession({
      sessionId: generateId(),
      topicId: topic.id,
      topicName: topic.name,
      color: topic.color,
      sessionIndex,
      date: createContext.date,
      startMinute: createContext.startMinute,
      endMinute: createContext.startMinute + topic.durationMinutes,
      roomIndex: createContext.roomIndex,
      teacherId: teacher.id,
      teacherName: teacher.name,
    })
    addToast(`Session added: ${topic.name} with ${teacher.name}.`, 'success')
    setCreateContext(null)
  }

  // Unique teachers that appear in the timetable, in stable order
  const timetableTeachers = Array.from(
    new Map(result.sessions.map((s) => [s.teacherId, s.teacherName])).entries()
  ).map(([id, name]) => ({ id, name }))

  return (
    <div onClick={() => setSwapFirst(null)}>
      <SwapOverlay selectedCount={swapFirst ? 1 : 0} />

      {/* Teacher legend */}
      {timetableTeachers.length > 0 && (
        <div className="flex items-center gap-2 px-4 pt-2 pb-0 flex-wrap">
          <span className="text-xs text-gray-400 mr-1">Filter:</span>
          {timetableTeachers.map((t) => (
            <button
              key={t.id}
              onClick={(e) => {
                e.stopPropagation()
                setFocusedTeacherIds((prev) => {
                  const next = new Set(prev)
                  if (next.has(t.id)) next.delete(t.id)
                  else next.add(t.id)
                  return next
                })
              }}
              onDoubleClick={(e) => {
                e.stopPropagation()
                setFocusedTeacherIds(new Set([t.id]))
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                focusedTeacherIds.has(t.id)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t.name}
            </button>
          ))}
          {focusedTeacherIds.size > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setFocusedTeacherIds(new Set()) }}
              className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer ml-1"
            >
              Clear
            </button>
          )}
        </div>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div ref={timetableRef} className="p-4 bg-white min-w-max">
          {sortedDates.map((date) => {
            const daySessions = sessionsByDate.get(date) || []
            const wc = dayConfig(date)
            const workStart = wc?.openMinute  ?? globalOpen
            const workEnd   = wc?.closeMinute ?? globalClose
            const breaks    = wc?.breaks ?? []

            const preview = dropPreview?.date === date ? dropPreview : null

            return (
              <DayColumn
                key={date}
                date={date}
                numRooms={schedule.numRooms}
                displayStart={displayStart}
                displayEnd={displayEnd}
                workStart={workStart}
                workEnd={workEnd}
                breaks={breaks}
                pxPer15={PX_PER_15}
                sessions={daySessions}
                swapSelectedId={swapFirst}
                focusedTeacherIds={focusedTeacherIds}
                onSwapClick={handleSwapClick}
                onTeacherReassign={(s) => setReassignSession(s)}
                onSlotRightClick={handleSlotRightClick}
                dropPreview={preview}
              />
            )
          })}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeSession && (
            <SessionBlockOverlay session={activeSession} pxPer15={PX_PER_15} />
          )}
        </DragOverlay>

        <DeleteBin visible={activeSession !== null} />
      </DndContext>

      <TeacherPicker
        session={reassignSession}
        teachers={teachers}
        allSessions={result.sessions}
        maxSessionsPerDayPerTeacher={schedule.maxSessionsPerDayPerTeacher}
        onClose={() => setReassignSession(null)}
        onAssign={handleTeacherAssign}
      />

      {createContext && (
        <CreateSessionModal
          date={createContext.date}
          roomIndex={createContext.roomIndex}
          startMinute={createContext.startMinute}
          workEnd={createContext.workEnd}
          breaks={createContext.breaks}
          sessionsOnDate={sessionsByDate.get(createContext.date) ?? []}
          topics={topics}
          teachers={teachers}
          maxSessionsPerDayPerTeacher={schedule.maxSessionsPerDayPerTeacher}
          onClose={() => setCreateContext(null)}
          onConfirm={handleCreateSession}
        />
      )}
    </div>
  )
}
