import type { RefObject } from 'react'
import { useTimetableStore } from '../../store/timetableStore'
import { useWizardStore } from '../../store/wizardStore'
import { useExport } from '../../hooks/useExport'
import { Button } from '../ui/button'

interface Props {
  timetableRef: RefObject<HTMLDivElement | null>
  onBack: () => void
}

export function ExportToolbar({ timetableRef, onBack }: Props) {
  const { result } = useTimetableStore()
  const { schedule, topics, teachers } = useWizardStore()
  const { exportJSON, exportCSV, exportPNG } = useExport(timetableRef)

  if (!result) return null

  const statusColor =
    result.status === 'optimal' ? 'bg-green-500' :
    result.status === 'feasible' ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b bg-white shadow-sm sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-sm font-medium capitalize">{result.status}</span>
          <span className="text-xs text-gray-400 ml-1">
            — {result.totalTeachingDays} teaching day{result.totalTeachingDays !== 1 ? 's' : ''}, {result.sessions.length} sessions
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportJSON({ schedule, topics, teachers }, result.sessions)}
        >
          Export JSON
        </Button>
        <Button variant="outline" size="sm" onClick={() => exportCSV(result.sessions)}>
          Export CSV
        </Button>
        <Button variant="outline" size="sm" onClick={exportPNG}>
          Export PNG
        </Button>
      </div>
    </div>
  )
}
