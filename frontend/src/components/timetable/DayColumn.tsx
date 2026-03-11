import type { SolvedSession } from '../../types'
import { RoomLane } from './RoomLane'
import { TimeRuler } from './TimeRuler'

interface Props {
  date: string
  numRooms: number
  openMinute: number
  closeMinute: number
  pxPer15: number
  sessions: SolvedSession[]
  isSwapMode: boolean
  swapSelectedId: string | null
  onSwapClick: (s: SolvedSession) => void
  onTeacherReassign: (s: SolvedSession) => void
}

export function DayColumn({
  date,
  numRooms,
  openMinute,
  closeMinute,
  pxPer15,
  sessions,
  isSwapMode,
  swapSelectedId,
  onSwapClick,
  onTeacherReassign,
}: Props) {
  const dateObj = new Date(date + 'T00:00:00')
  const label = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className="mb-6 flex-shrink-0">
      <div className="flex items-center gap-2 mb-2 ml-20">
        <div className="font-semibold text-sm">{label}</div>
        <div className="text-xs text-gray-400">({sessions.length} session{sessions.length !== 1 ? 's' : ''})</div>
      </div>

      <div className="ml-20">
        <TimeRuler openMinute={openMinute} closeMinute={closeMinute} pxPer15={pxPer15} />
      </div>

      <div className="space-y-1">
        {Array.from({ length: numRooms }, (_, i) => (
          <RoomLane
            key={i}
            roomIndex={i}
            date={date}
            openMinute={openMinute}
            closeMinute={closeMinute}
            pxPer15={pxPer15}
            sessions={sessions.filter((s) => s.roomIndex === i)}
            isSwapMode={isSwapMode}
            swapSelectedId={swapSelectedId}
            onSwapClick={onSwapClick}
            onTeacherReassign={onTeacherReassign}
          />
        ))}
      </div>
    </div>
  )
}
