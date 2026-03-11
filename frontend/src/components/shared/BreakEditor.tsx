import type { DayBreak } from '../../types'
import { TimeRangePicker } from './TimeRangePicker'
import { Button } from '../ui/button'

interface Props {
  breaks: DayBreak[]
  onChange: (breaks: DayBreak[]) => void
}

export function BreakEditor({ breaks, onChange }: Props) {
  const add = () => {
    if (breaks.length >= 2) return
    onChange([...breaks, { startMinute: 720, endMinute: 780 }])
  }

  const remove = (idx: number) => {
    onChange(breaks.filter((_, i) => i !== idx))
  }

  const update = (idx: number, field: keyof DayBreak, value: number) => {
    onChange(breaks.map((b, i) => (i === idx ? { ...b, [field]: value } : b)))
  }

  return (
    <div className="space-y-1">
      {breaks.map((b, i) => (
        <div key={i} className="flex items-center gap-2">
          <TimeRangePicker
            startMinute={b.startMinute}
            endMinute={b.endMinute}
            onChangeStart={(m) => update(i, 'startMinute', m)}
            onChangeEnd={(m) => update(i, 'endMinute', m)}
            label={`Break ${i + 1}`}
          />
          <Button variant="ghost" size="sm" onClick={() => remove(i)} type="button">✕</Button>
        </div>
      ))}
      {breaks.length < 2 && (
        <Button variant="outline" size="sm" onClick={add} type="button">+ Add break</Button>
      )}
    </div>
  )
}
