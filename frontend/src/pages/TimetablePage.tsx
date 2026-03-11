import { useRef, useState } from 'react'
import { TimetableView } from '../components/timetable/TimetableView'
import { ExportToolbar } from '../components/export/ExportToolbar'
import { useTimetableStore } from '../store/timetableStore'

interface Props {
  onBack: () => void
}

export function TimetablePage({ onBack }: Props) {
  const { result } = useTimetableStore()
  const timetableRef = useRef<HTMLDivElement>(null)
  const [isSwapMode, setIsSwapMode] = useState(false)

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">No timetable data. Go back and generate one.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ExportToolbar
        timetableRef={timetableRef}
        isSwapMode={isSwapMode}
        onToggleSwap={() => setIsSwapMode((v) => !v)}
        onBack={onBack}
      />

      {result.warnings.length > 0 && (
        <div className="mx-6 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          {result.warnings.map((w, i) => (
            <div key={i} className="text-yellow-800 text-sm">⚠ {w}</div>
          ))}
        </div>
      )}

      <div className="p-6 overflow-auto">
        <TimetableView
          timetableRef={timetableRef}
          isSwapMode={isSwapMode}
          onSwapModeChange={setIsSwapMode}
        />
      </div>
    </div>
  )
}
