import { useDroppable } from '@dnd-kit/core'
import type { MouseEvent } from 'react'
import type { SolvedSession, DayBreak } from '../../types'
import { SessionBlock } from './SessionBlock'

interface DropPreview {
  startMinute: number
  endMinute: number
  color: string
  valid: boolean
}

interface Props {
  roomIndex: number
  date: string
  displayStart: number   // leftmost visible minute
  displayEnd: number     // rightmost visible minute
  workStart: number      // actual day open time
  workEnd: number        // actual day close time
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

const HATCH_CLOSED = 'repeating-linear-gradient(-45deg, #f1f5f9, #f1f5f9 3px, #e2e8f0 3px, #e2e8f0 7px)'
const HATCH_BREAK  = 'repeating-linear-gradient(-45deg, #fef9c3, #fef9c3 3px, #fde68a 3px, #fde68a 7px)'

export function RoomLane({
  roomIndex,
  date,
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
  const totalWidth = ((displayEnd - displayStart) / 15) * pxPer15
  const toLeft = (minute: number) => ((minute - displayStart) / 15) * pxPer15
  const toWidth = (from: number, to: number) => ((to - from) / 15) * pxPer15

  const { setNodeRef, isOver } = useDroppable({
    id: `room-${roomIndex}-${date}`,
    data: { roomIndex, date, workStart, workEnd, breaks },
  })

  const handleContextMenu = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const minute = Math.floor((displayStart + (x / pxPer15) * 15) / 15) * 15
    onSlotRightClick(date, roomIndex, minute)
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 text-xs text-gray-400 text-right flex-shrink-0 pr-1">
        Room {roomIndex + 1}
      </div>
      <div
        ref={setNodeRef}
        className={`relative h-12 rounded border flex-shrink-0 overflow-hidden transition-colors ${
          isOver ? 'border-blue-400' : 'border-gray-200'
        }`}
        style={{ width: totalWidth }}
        onContextMenu={handleContextMenu}
      >
        {/* ── Hatched zones ─────────────────────────────────────────── */}

        {/* Before working hours */}
        {workStart > displayStart && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{ left: 0, width: toWidth(displayStart, workStart), background: HATCH_CLOSED }}
          />
        )}

        {/* After working hours */}
        {workEnd < displayEnd && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{ left: toLeft(workEnd), width: toWidth(workEnd, displayEnd), background: HATCH_CLOSED }}
          />
        )}

        {/* Breaks */}
        {breaks.map((b, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{ left: toLeft(b.startMinute), width: toWidth(b.startMinute, b.endMinute), background: HATCH_BREAK }}
          />
        ))}

        {/* ── 15-min grid lines (open hours only) ───────────────────── */}
        {Array.from({ length: (displayEnd - displayStart) / 15 }, (_, i) => {
          const minute = displayStart + i * 15
          const inWork = minute >= workStart && minute < workEnd
          const inBreak = breaks.some((b) => minute >= b.startMinute && minute < b.endMinute)
          const visible = inWork && !inBreak
          return (
            <div
              key={i}
              className={`absolute top-0 bottom-0 border-l ${
                visible ? (i % 4 === 0 ? 'border-gray-200' : 'border-gray-100') : 'border-gray-100/50'
              }`}
              style={{ left: i * pxPer15 }}
            />
          )
        })}

        {/* ── Drop preview ─────────────────────────────────────────── */}
        {dropPreview && (
          <div
            className="absolute top-1 bottom-1 rounded-md pointer-events-none"
            style={{
              left: toLeft(dropPreview.startMinute),
              width: toWidth(dropPreview.startMinute, dropPreview.endMinute) - 2,
              backgroundColor: dropPreview.color,
              opacity: 0.35,
              outline: dropPreview.valid ? `2px solid ${dropPreview.color}` : '2px solid #ef4444',
              outlineOffset: '-1px',
            }}
          />
        )}

        {/* ── Sessions ─────────────────────────────────────────────── */}
        {sessions.map((s) => (
          <SessionBlock
            key={s.sessionId}
            session={s}
            displayStart={displayStart}
            pxPer15={pxPer15}
            isSwapSelected={swapSelectedId === s.sessionId}
            focusedTeacherIds={focusedTeacherIds}
            onSwapClick={onSwapClick}
            onTeacherReassign={onTeacherReassign}
          />
        ))}
      </div>
    </div>
  )
}
