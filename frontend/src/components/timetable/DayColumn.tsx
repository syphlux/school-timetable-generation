import type { SolvedSession, DayBreak } from '../../types'
import { RoomLane } from './RoomLane'
import { TimeRuler } from './TimeRuler'

interface DropPreview {
  roomIndex: number
  startMinute: number
  endMinute: number
  color: string
  valid: boolean
}

interface Props {
  date: string
  numRooms: number
  displayStart: number   // leftmost visible minute (global open - 60)
  displayEnd: number     // rightmost visible minute (global close + 60)
  workStart: number      // this day's actual open time
  workEnd: number        // this day's actual close time
  breaks: DayBreak[]
  pxPer15: number
  sessions: SolvedSession[]
  swapSelectedId: string | null
  focusedTeacherIds: Set<string>
  onSwapClick: (s: SolvedSession) => void
  onTeacherReassign: (s: SolvedSession) => void
  onSlotRightClick: (date: string, roomIndex: number, minute: number) => void
  dropPreview?: DropPreview | null
}

export function DayColumn({
  date,
  numRooms,
  displayStart,
  displayEnd,
  workStart,
  workEnd,
  breaks,
  pxPer15,
  sessions,
  swapSelectedId,
  focusedTeacherIds,
  onSwapClick,
  onTeacherReassign,
  onSlotRightClick,
  dropPreview,
}: Props) {
  const dateObj = new Date(date + 'T00:00:00')
  const label = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className="mb-6 flex-shrink-0">
      <div className="flex items-center gap-2 mb-2 ml-[72px]">
        <div className="font-semibold text-sm">{label}</div>
        <div className="text-xs text-gray-400">
          ({sessions.length} session{sessions.length !== 1 ? 's' : ''})
        </div>
      </div>

      <div className="ml-[72px]">
        <TimeRuler
          displayStart={displayStart}
          displayEnd={displayEnd}
          workStart={workStart}
          workEnd={workEnd}
          pxPer15={pxPer15}
        />
      </div>

      <div className="space-y-1">
        {Array.from({ length: numRooms }, (_, i) => (
          <RoomLane
            key={i}
            roomIndex={i}
            date={date}
            displayStart={displayStart}
            displayEnd={displayEnd}
            workStart={workStart}
            workEnd={workEnd}
            breaks={breaks}
            pxPer15={pxPer15}
            sessions={sessions.filter((s) => s.roomIndex === i)}
            swapSelectedId={swapSelectedId}
            focusedTeacherIds={focusedTeacherIds}
            onSwapClick={onSwapClick}
            onTeacherReassign={onTeacherReassign}
            onSlotRightClick={onSlotRightClick}
            dropPreview={dropPreview?.roomIndex === i ? dropPreview : null}
          />
        ))}
      </div>
    </div>
  )
}
