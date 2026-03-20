import { useDroppable } from '@dnd-kit/core'
import type { SolvedSession, DayBreak } from '../../types'
import { RoomLane } from './RoomLane'
import { TimeRuler } from './TimeRuler'

const HATCH_CLOSED = 'repeating-linear-gradient(-45deg, #f1f5f9, #f1f5f9 3px, #e2e8f0 3px, #e2e8f0 7px)'

function DisabledRoomLane({ roomIndex, date, width }: { roomIndex: number; date: string; width: number }) {
  const { setNodeRef } = useDroppable({
    id: `disabled-room-${roomIndex}-${date}`,
    data: { disabled: true, date },
  })
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 text-xs text-gray-300 text-right flex-shrink-0 pr-1">
        Room {roomIndex + 1}
      </div>
      <div
        ref={setNodeRef}
        className="h-12 rounded border border-gray-200 flex-shrink-0"
        style={{ width, background: HATCH_CLOSED }}
      />
    </div>
  )
}

interface DropPreview {
  roomIndex: number
  startMinute: number
  endMinute: number
  color: string
  valid: boolean
}

interface Props {
  date: string
  disabled?: boolean
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
  disabled,
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
  const totalWidth = ((displayEnd - displayStart) / 15) * pxPer15

  if (disabled) {
    return (
      <div className="mb-6 flex-shrink-0 opacity-50">
        <div className="flex items-center gap-2 mb-2 ml-[72px]">
          <div className="font-semibold text-sm text-gray-400">{label}</div>
        </div>
        <div className="ml-[72px]">
          <TimeRuler
            displayStart={displayStart}
            displayEnd={displayEnd}
            workStart={displayStart}
            workEnd={displayStart}
            pxPer15={pxPer15}
          />
        </div>
        <div className="space-y-1">
          {Array.from({ length: numRooms }, (_, i) => (
            <DisabledRoomLane key={i} roomIndex={i} date={date} width={totalWidth} />
          ))}
        </div>
      </div>
    )
  }

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
