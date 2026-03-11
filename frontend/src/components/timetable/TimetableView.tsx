import { useState, type RefObject } from 'react'
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { useTimetableStore } from '../../store/timetableStore'
import { useWizardStore } from '../../store/wizardStore'
import type { SolvedSession, Teacher } from '../../types'
import { DayColumn } from './DayColumn'
import { SwapOverlay } from './SwapOverlay'
import { TeacherPicker } from './TeacherPicker'
import { useToast } from '../ui/toast'
import { snapTo15 } from '../../lib/utils'

const PX_PER_15 = 48

interface Props {
  timetableRef: RefObject<HTMLDivElement | null>
  isSwapMode: boolean
  onSwapModeChange: (v: boolean) => void
}

export function TimetableView({ timetableRef, isSwapMode, onSwapModeChange }: Props) {
  const { result, updateSession, swapSessions } = useTimetableStore()
  const { schedule, teachers } = useWizardStore()
  const { addToast } = useToast()

  const [swapFirst, setSwapFirst] = useState<string | null>(null)
  const [reassignSession, setReassignSession] = useState<SolvedSession | null>(null)

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
  const sortedDates = Array.from(sessionsByDate.keys()).sort()

  const enabledWeekdays = schedule.weekdays.filter((w) => w.enabled)
  const globalOpenMinute = enabledWeekdays.length > 0 ? Math.min(...enabledWeekdays.map((w) => w.openMinute)) : 480
  const globalCloseMinute = enabledWeekdays.length > 0 ? Math.max(...enabledWeekdays.map((w) => w.closeMinute)) : 1020

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const session = active.data.current?.session as SolvedSession
    const dropData = over.data.current as { roomIndex: number; date: string; openMinute: number } | undefined
    if (!session || !dropData) return

    const minutesDelta = snapTo15((event.delta.x / PX_PER_15) * 15)
    const newStart = session.startMinute + minutesDelta
    const newEnd = newStart + (session.endMinute - session.startMinute)
    const newRoom = dropData.roomIndex
    const newDate = dropData.date

    if (newStart < dropData.openMinute || newEnd > globalCloseMinute) {
      addToast('Cannot move session outside schedule hours.', 'error')
      return
    }

    const dateSessions = sessionsByDate.get(newDate) || []
    const hasOverlap = dateSessions.some(
      (s) =>
        s.sessionId !== session.sessionId &&
        s.roomIndex === newRoom &&
        s.startMinute < newEnd &&
        s.endMinute > newStart
    )
    if (hasOverlap) {
      addToast('Session would overlap with another session.', 'error')
      return
    }

    updateSession(session.sessionId, { date: newDate, startMinute: newStart, endMinute: newEnd, roomIndex: newRoom })
  }

  const handleSwapClick = (session: SolvedSession) => {
    if (!swapFirst) {
      setSwapFirst(session.sessionId)
    } else if (swapFirst === session.sessionId) {
      setSwapFirst(null)
    } else {
      const first = result.sessions.find((s) => s.sessionId === swapFirst)
      if (!first) { setSwapFirst(null); return }

      const dur1 = first.endMinute - first.startMinute
      const dur2 = session.endMinute - session.startMinute
      if (dur1 !== dur2) {
        addToast('Can only swap sessions of the same duration.', 'error')
        setSwapFirst(null)
        return
      }

      swapSessions(swapFirst, session.sessionId)
      addToast('Sessions swapped successfully.', 'success')
      setSwapFirst(null)
      onSwapModeChange(false)
    }
  }

  const handleTeacherAssign = (sessionId: string, teacher: Teacher) => {
    updateSession(sessionId, { teacherId: teacher.id, teacherName: teacher.name })
    setReassignSession(null)
    addToast(`Teacher reassigned to ${teacher.name}.`, 'success')
  }

  return (
    <div>
      <SwapOverlay active={isSwapMode} selectedCount={swapFirst ? 1 : 0} />

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div ref={timetableRef} className="p-4 bg-white min-w-max">
          {sortedDates.map((date) => {
            const daySessions = sessionsByDate.get(date) || []
            const wd = new Date(date + 'T00:00:00').getDay()
            const dateWc = schedule.weekdays.find((w) => w.weekday === wd && w.enabled)
            const open = dateWc?.openMinute ?? globalOpenMinute
            const close = dateWc?.closeMinute ?? globalCloseMinute

            return (
              <DayColumn
                key={date}
                date={date}
                numRooms={schedule.numRooms}
                openMinute={open}
                closeMinute={close}
                pxPer15={PX_PER_15}
                sessions={daySessions}
                isSwapMode={isSwapMode}
                swapSelectedId={swapFirst}
                onSwapClick={handleSwapClick}
                onTeacherReassign={(s) => setReassignSession(s)}
              />
            )
          })}
        </div>
      </DndContext>

      <TeacherPicker
        session={reassignSession}
        teachers={teachers}
        allSessions={result.sessions}
        onClose={() => setReassignSession(null)}
        onAssign={handleTeacherAssign}
      />
    </div>
  )
}
