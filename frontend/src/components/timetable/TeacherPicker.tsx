import type { SolvedSession, Teacher } from '../../types'
import { Button } from '../ui/button'

interface Props {
  session: SolvedSession | null
  teachers: Teacher[]
  allSessions: SolvedSession[]
  maxSessionsPerDayPerTeacher: number
  onClose: () => void
  onAssign: (sessionId: string, teacher: Teacher) => void
}

export function TeacherPicker({ session, teachers, allSessions, maxSessionsPerDayPerTeacher, onClose, onAssign }: Props) {
  if (!session) return null

  const options = teachers.map((t) => {
    const isCurrent = t.id === session.teacherId
    if (!t.topicIds.includes(session.topicId)) {
      return { teacher: t, isCurrent, disabled: true, reason: `Does not teach ${session.topicName}` }
    }
    if (t.unavailableDates.includes(session.date)) {
      return { teacher: t, isCurrent, disabled: true, reason: `Unavailable on ${session.date}` }
    }
    const dayCount = allSessions.filter(
      (s) => s.teacherId === t.id && s.date === session.date && s.sessionId !== session.sessionId
    ).length
    if (dayCount >= maxSessionsPerDayPerTeacher) {
      return { teacher: t, isCurrent, disabled: true, reason: `Already has the maximum ${maxSessionsPerDayPerTeacher} sessions that day` }
    }
    const conflict = allSessions.find(
      (s) =>
        s.sessionId !== session.sessionId &&
        s.teacherId === t.id &&
        s.date === session.date &&
        s.startMinute < session.endMinute &&
        s.endMinute > session.startMinute
    )
    if (conflict) {
      return { teacher: t, isCurrent, disabled: true, reason: `Already teaching ${conflict.topicName} at this time` }
    }
    return { teacher: t, isCurrent, disabled: false, reason: null }
  })

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
          {options.map(({ teacher: t, isCurrent, disabled, reason }) => (
            <button
              key={t.id}
              onClick={() => !disabled && onAssign(session.sessionId, t)}
              disabled={disabled}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                isCurrent
                  ? 'bg-blue-50 border border-blue-200 font-medium cursor-default'
                  : disabled
                  ? 'border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'hover:bg-gray-100 cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{t.name}</span>
                {isCurrent && <span className="text-xs text-blue-400">(current)</span>}
              </div>
              {disabled && reason && (
                <div className="text-xs text-red-400 mt-0.5">{reason}</div>
              )}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={onClose} className="w-full mt-3">
          Cancel
        </Button>
      </div>
    </div>
  )
}
