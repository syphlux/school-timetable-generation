import { minutesToTime, timeToMinutes, snapTo15 } from '../../lib/utils'

interface Props {
  startMinute: number
  endMinute: number
  onChangeStart: (m: number) => void
  onChangeEnd: (m: number) => void
  label?: string
}

export function TimeRangePicker({ startMinute, endMinute, onChangeStart, onChangeEnd, label }: Props) {
  const handleStart = (raw: string) => {
    onChangeStart(snapTo15(timeToMinutes(raw)))
  }
  const handleEnd = (raw: string) => {
    onChangeEnd(snapTo15(timeToMinutes(raw)))
  }

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm text-gray-500 w-16">{label}</span>}
      <input
        type="time"
        value={minutesToTime(startMinute)}
        onChange={(e) => handleStart(e.target.value)}
        className="border border-gray-300 rounded px-2 py-1 text-sm cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        step={900}
      />
      <span className="text-gray-400">–</span>
      <input
        type="time"
        value={minutesToTime(endMinute)}
        onChange={(e) => handleEnd(e.target.value)}
        className="border border-gray-300 rounded px-2 py-1 text-sm cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        step={900}
      />
    </div>
  )
}
