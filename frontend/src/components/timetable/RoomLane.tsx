import { useDroppable } from '@dnd-kit/core'
import type { SolvedSession } from '../../types'
import { SessionBlock } from './SessionBlock'

interface Props {
  roomIndex: number
  date: string
  openMinute: number
  closeMinute: number
  pxPer15: number
  sessions: SolvedSession[]
  isSwapMode: boolean
  swapSelectedId: string | null
  onSwapClick: (s: SolvedSession) => void
  onTeacherReassign: (s: SolvedSession) => void
}

export function RoomLane({
  roomIndex,
  date,
  openMinute,
  closeMinute,
  pxPer15,
  sessions,
  isSwapMode,
  swapSelectedId,
  onSwapClick,
  onTeacherReassign,
}: Props) {
  const totalWidth = ((closeMinute - openMinute) / 15) * pxPer15

  const { setNodeRef, isOver } = useDroppable({
    id: `room-${roomIndex}-${date}`,
    data: { roomIndex, date, openMinute },
  })

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 text-xs text-gray-400 text-right flex-shrink-0 pr-1">
        Room {roomIndex + 1}
      </div>
      <div
        ref={setNodeRef}
        className={`relative h-12 rounded border flex-shrink-0 ${isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'}`}
        style={{ width: totalWidth }}
      >
        {/* 15-min grid lines */}
        {Array.from({ length: (closeMinute - openMinute) / 15 }, (_, i) => (
          <div
            key={i}
            className={`absolute top-0 bottom-0 border-l ${i % 4 === 0 ? 'border-gray-200' : 'border-gray-100'}`}
            style={{ left: i * pxPer15 }}
          />
        ))}
        {/* Sessions */}
        {sessions.map((s) => (
          <SessionBlock
            key={s.sessionId}
            session={s}
            openMinute={openMinute}
            pxPer15={pxPer15}
            isSwapMode={isSwapMode}
            isSwapSelected={swapSelectedId === s.sessionId}
            onSwapClick={onSwapClick}
            onTeacherReassign={onTeacherReassign}
          />
        ))}
      </div>
    </div>
  )
}
