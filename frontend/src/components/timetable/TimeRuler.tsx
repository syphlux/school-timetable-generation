
import { minutesToTime } from '../../lib/utils'

interface Props {
  openMinute: number
  closeMinute: number
  pxPer15: number
}

export function TimeRuler({ openMinute, closeMinute, pxPer15 }: Props) {
  const slots = (closeMinute - openMinute) / 15
  const ticks = Array.from({ length: slots + 1 }, (_, i) => openMinute + i * 15)

  return (
    <div
      className="relative h-6 border-b border-gray-200 mb-1 flex-shrink-0"
      style={{ width: slots * pxPer15 }}
    >
      {ticks.map((m, i) => (
        <div
          key={m}
          className="absolute bottom-0 flex flex-col items-center"
          style={{ left: i * pxPer15 - 1 }}
        >
          {m % 60 === 0 && (
            <>
              <span className="text-xs text-gray-400 leading-none whitespace-nowrap" style={{ marginBottom: 2 }}>
                {minutesToTime(m)}
              </span>
              <div className="w-px h-2 bg-gray-300" />
            </>
          )}
          {m % 60 !== 0 && m % 30 === 0 && (
            <div className="w-px h-1.5 bg-gray-200" />
          )}
        </div>
      ))}
    </div>
  )
}
