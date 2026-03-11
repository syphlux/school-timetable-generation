import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import type { SolvedSession } from '../../types'
import { minutesToTime } from '../../lib/utils'

interface Props {
  session: SolvedSession
  openMinute: number
  pxPer15: number
  isSwapMode: boolean
  isSwapSelected: boolean
  onSwapClick: (session: SolvedSession) => void
  onTeacherReassign: (session: SolvedSession) => void
}

export function SessionBlock({
  session,
  openMinute,
  pxPer15,
  isSwapMode,
  isSwapSelected,
  onSwapClick,
  onTeacherReassign,
}: Props) {
  const left = ((session.startMinute - openMinute) / 15) * pxPer15
  const width = ((session.endMinute - session.startMinute) / 15) * pxPer15

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: session.sessionId,
    data: { session },
    disabled: isSwapMode,
  })

  const handleClick = (e: React.MouseEvent) => {
    if (isSwapMode) {
      e.stopPropagation()
      onSwapClick(session)
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onTeacherReassign(session)
  }

  return (
    <div
      ref={setNodeRef}
      {...(isSwapMode ? {} : { ...attributes, ...listeners })}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`absolute top-1 bottom-1 rounded-md flex flex-col justify-center px-2 text-white text-xs font-medium select-none transition-all ${
        isDragging ? 'opacity-50 shadow-lg z-50' : ''
      } ${isSwapMode ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'} ${
        isSwapSelected ? 'ring-2 ring-yellow-400 ring-offset-1' : ''
      }`}
      style={{
        left,
        width: width - 2,
        backgroundColor: session.color,
        boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.2)' : undefined,
      }}
      title={`${session.topicName} — ${session.teacherName}\n${minutesToTime(session.startMinute)}–${minutesToTime(session.endMinute)}\nDouble-click to reassign teacher`}
    >
      <div className="truncate font-semibold leading-tight">{session.topicName}</div>
      <div className="truncate opacity-80 leading-tight">{session.teacherName}</div>
    </div>
  )
}
