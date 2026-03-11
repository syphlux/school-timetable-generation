import { Label } from '../ui/label'

interface Props {
  startDate: string
  endDate: string
  onChangeStart: (d: string) => void
  onChangeEnd: (d: string) => void
}

export function DateRangePicker({ startDate, endDate, onChangeStart, onChangeEnd }: Props) {
  const invalid = endDate && startDate && endDate < startDate

  const handleEndChange = (d: string) => {
    onChangeEnd(d)
  }

  return (
    <div className="space-y-1">
      <div className="flex items-end gap-4">
        <div className="flex flex-col gap-1">
          <Label>Start date</Label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onChangeStart(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label>End date</Label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => handleEndChange(e.target.value)}
            className={`border rounded px-2 py-1.5 text-sm cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              invalid ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          />
        </div>
      </div>
      {invalid && (
        <p className="text-red-600 text-xs">End date must be on or after start date.</p>
      )}
    </div>
  )
}
