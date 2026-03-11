import { minutesToTime } from '../../lib/utils'

interface Props {
  displayStart: number   // leftmost visible minute (e.g. globalOpen - 60)
  displayEnd: number     // rightmost visible minute (e.g. globalClose + 60)
  workStart: number      // actual day open time — used to shade closed zones
  workEnd: number
  pxPer15: number
}

export function TimeRuler({ displayStart, displayEnd, workStart, workEnd, pxPer15 }: Props) {
  const slots = (displayEnd - displayStart) / 15
  const ticks = Array.from({ length: slots + 1 }, (_, i) => displayStart + i * 15)

  return (
    <div
      className="relative h-6 border-b border-gray-200 mb-1 flex-shrink-0"
      style={{ width: slots * pxPer15 }}
    >
      {ticks.map((m, i) => {
        const isOutside = m < workStart || m >= workEnd
        return (
          <div
            key={m}
            className="absolute bottom-0 flex flex-col items-center"
            style={{ left: i * pxPer15, transform: 'translateX(-50%)' }}
          >
            {m % 60 === 0 && (
              <>
                <span
                  className={`text-xs leading-none whitespace-nowrap ${isOutside ? 'text-gray-300' : 'text-gray-400'}`}
                  style={{ marginBottom: 2 }}
                >
                  {minutesToTime(m)}
                </span>
                <div className={`w-px h-2 ${isOutside ? 'bg-gray-200' : 'bg-gray-300'}`} />
              </>
            )}
            {m % 60 !== 0 && m % 30 === 0 && (
              <>
                <span
                  className={`text-[11px] leading-none whitespace-nowrap ${isOutside ? 'text-gray-200' : 'text-gray-300'}`}
                  style={{ marginBottom: 2 }}
                >
                  {minutesToTime(m)}
                </span>
                <div className={`w-px h-1.5 ${isOutside ? 'bg-gray-100' : 'bg-gray-200'}`} />
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
