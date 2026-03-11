import type { SolvedSession, Teacher } from '../../types'
import { Button } from '../ui/button'

interface Props {
  session: SolvedSession | null
  teachers: Teacher[]
  allSessions: SolvedSession[]
  onClose: () => void
  onAssign: (sessionId: string, teacher: Teacher) => void
}

export function TeacherPicker({ session, teachers, allSessions, onClose, onAssign }: Props) {
  if (!session) return null

  const qualified = teachers.filter((t) => t.topicIds.includes(session.topicId))

  const hasConflict = (teacher: Teacher): boolean => {
    if (teacher.unavailableDates.includes(session.date)) return true
    return allSessions.some(
      (s) =>
        s.sessionId !== session.sessionId &&
        s.teacherId === teacher.id &&
        s.date === session.date &&
        s.startMinute < session.endMinute &&
        s.endMinute > session.startMinute
    )
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl border shadow-xl p-4 w-80"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold mb-1">Reassign Teacher</h3>
        <p className="text-sm text-gray-500 mb-3">
          {session.topicName} — {session.date}
        </p>
        <div className="space-y-1">
          {qualified.map((t) => {
            const conflict = hasConflict(t)
            const isCurrent = t.id === session.teacherId
            return (
              <button
                key={t.id}
                onClick={() => !conflict && onAssign(session.sessionId, t)}
                disabled={conflict}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                  isCurrent
                    ? 'bg-blue-50 border border-blue-200 font-medium'
                    : conflict
                    ? 'opacity-40 cursor-not-allowed bg-gray-100'
                    : 'hover:bg-gray-100 cursor-pointer'
                }`}
              >
                <span>{t.name}</span>
                <span className="text-xs text-gray-400">
                  {isCurrent ? '(current)' : conflict ? 'conflict' : ''}
                </span>
              </button>
            )
          })}
          {qualified.length === 0 && (
            <p className="text-gray-400 text-sm py-2">No qualified teachers.</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onClose} className="w-full mt-3">
          Cancel
        </Button>
      </div>
    </div>
  )
}
