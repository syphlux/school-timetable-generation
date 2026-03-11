import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import type { SolvedSession } from '../../types'
import { minutesToTime } from '../../lib/utils'

interface Props {
  session: SolvedSession
  displayStart: number   // leftmost visible minute — used for pixel position
  pxPer15: number
  isSwapSelected: boolean
  focusedTeacherIds: Set<string>
  onSwapClick: (session: SolvedSession) => void
  onTeacherReassign: (session: SolvedSession) => void
}

export function SessionBlock({
  session,
  displayStart,
  pxPer15,
  isSwapSelected,
  focusedTeacherIds,
  onSwapClick,
  onTeacherReassign,
}: Props) {
  const left = ((session.startMinute - displayStart) / 15) * pxPer15
  const width = ((session.endMinute - session.startMinute) / 15) * pxPer15

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: session.sessionId,
    data: { session },
  })

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSwapClick(session)
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onTeacherReassign(session)
  }

  return (
    <div
      ref={setNodeRef}
      {...{ ...attributes, ...listeners }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => e.stopPropagation()}
      className={`absolute top-1 bottom-1 rounded-md flex flex-col justify-center px-2 text-xs font-medium select-none transition-opacity cursor-grab active:cursor-grabbing ${
        isSwapSelected ? 'ring-2 ring-yellow-400 ring-offset-1' : ''
      }`}
      style={{
        left,
        width: width - 2,
        backgroundColor: isDragging ? 'transparent' : session.color,
        border: isDragging ? `2px dashed ${session.color}` : undefined,
        opacity: isDragging ? 0.45 : focusedTeacherIds.size > 0 && !focusedTeacherIds.has(session.teacherId) ? 0.15 : 1,
      }}
      title={`${session.topicName} — ${session.teacherName}\n${minutesToTime(session.startMinute)}–${minutesToTime(session.endMinute)}\nDouble-click to reassign teacher`}
    >
      {!isDragging && (
        <>
          <div className="truncate font-semibold leading-tight text-white">{session.topicName}</div>
          <div className="truncate leading-tight text-white/80">{session.teacherName}</div>
        </>
      )}
    </div>
  )
}

/** Rendered inside DragOverlay — follows the cursor */
export function SessionBlockOverlay({ session, pxPer15 }: { session: SolvedSession; pxPer15: number }) {
  const width = ((session.endMinute - session.startMinute) / 15) * pxPer15
  return (
    <div
      className="rounded-md flex flex-col justify-center px-2 text-white text-xs font-medium shadow-2xl cursor-grabbing"
      style={{ width: width - 2, height: 40, backgroundColor: session.color, opacity: 0.92 }}
    >
      <div className="truncate font-semibold leading-tight">{session.topicName}</div>
      <div className="truncate leading-tight opacity-80">{session.teacherName}</div>
    </div>
  )
}
