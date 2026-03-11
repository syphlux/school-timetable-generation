import { useState } from 'react'
import type { Topic, Teacher, SolvedSession, DayBreak } from '../../types'
import { minutesToTime, formatDuration } from '../../lib/utils'

interface Props {
  date: string
  roomIndex: number
  startMinute: number
  workEnd: number
  breaks: DayBreak[]
  sessionsOnDate: SolvedSession[]
  topics: Topic[]
  teachers: Teacher[]
  maxSessionsPerDayPerTeacher: number
  onClose: () => void
  onConfirm: (topic: Topic, teacher: Teacher) => void
}

function overlaps(s1: number, e1: number, s2: number, e2: number) {
  return s1 < e2 && e1 > s2
}

export function CreateSessionModal({
  date,
  roomIndex,
  startMinute,
  workEnd,
  breaks,
  sessionsOnDate,
  topics,
  teachers,
  maxSessionsPerDayPerTeacher,
  onClose,
  onConfirm,
}: Props) {
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')

  const selectedTopic = topics.find((t) => t.id === selectedTopicId) ?? null
  const endMinute = selectedTopic ? startMinute + selectedTopic.durationMinutes : 0

  const topicOptions = topics.map((topic) => {
    const end = startMinute + topic.durationMinutes
    if (end > workEnd) {
      const avail = workEnd - startMinute
      return { topic, disabled: true, reason: `Only ${formatDuration(avail)} left before end of day` }
    }
    const brk = breaks.find((b) => overlaps(startMinute, end, b.startMinute, b.endMinute))
    if (brk) {
      return {
        topic,
        disabled: true,
        reason: `Overlaps with break (${minutesToTime(brk.startMinute)}–${minutesToTime(brk.endMinute)})`,
      }
    }
    const roomOverlaps = sessionsOnDate.some(
      (s) => s.roomIndex === roomIndex && overlaps(startMinute, end, s.startMinute, s.endMinute),
    )
    if (roomOverlaps) {
      return { topic, disabled: true, reason: 'Overlaps with another session in this room' }
    }
    return { topic, disabled: false, reason: null }
  })

  const teacherOptions = teachers.map((teacher) => {
    if (!selectedTopic) {
      return { teacher, disabled: true, reason: 'Select a topic first' }
    }
    if (!teacher.topicIds.includes(selectedTopic.id)) {
      return { teacher, disabled: true, reason: `Does not teach ${selectedTopic.name}` }
    }
    if (teacher.unavailableDates.includes(date)) {
      return { teacher, disabled: true, reason: `Unavailable on ${date}` }
    }
    const dayCount = sessionsOnDate.filter((s) => s.teacherId === teacher.id).length
    if (dayCount >= maxSessionsPerDayPerTeacher) {
      return { teacher, disabled: true, reason: `Already has the maximum ${maxSessionsPerDayPerTeacher} sessions that day` }
    }
    const conflict = sessionsOnDate.find(
      (s) => s.teacherId === teacher.id && overlaps(startMinute, endMinute, s.startMinute, s.endMinute),
    )
    if (conflict) {
      return {
        teacher,
        disabled: true,
        reason: `Already teaching ${conflict.topicName} at ${minutesToTime(conflict.startMinute)}`,
      }
    }
    return { teacher, disabled: false, reason: null }
  })

  const selectedTopicOption = topicOptions.find((o) => o.topic.id === selectedTopicId)
  const canSubmit = selectedTopic && selectedTeacherId && !selectedTopicOption?.disabled

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-96 max-h-[90vh] overflow-y-auto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold mb-1">New Session</h2>
        <p className="text-xs text-gray-500 mb-4">
          {date} · Room {roomIndex + 1} · from {minutesToTime(startMinute)}
        </p>

        {/* Topic */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">Topic</label>
          <div className="space-y-1">
            {topicOptions.map(({ topic, disabled, reason }) => (
              <button
                key={topic.id}
                disabled={disabled}
                onClick={() => {
                  if (!disabled) {
                    setSelectedTopicId(topic.id)
                    setSelectedTeacherId('')
                  }
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm border transition-colors ${
                  selectedTopicId === topic.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : disabled
                      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: topic.color }}
                  />
                  <span className="font-medium">{topic.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{formatDuration(topic.durationMinutes)}</span>
                </div>
                {disabled && reason && (
                  <div className="text-xs text-red-400 mt-0.5 ml-4">{reason}</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Teacher */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-gray-700 mb-1">Teacher</label>
          <div className="space-y-1">
            {teacherOptions.map(({ teacher, disabled, reason }) => (
              <button
                key={teacher.id}
                disabled={disabled}
                onClick={() => {
                  if (!disabled) setSelectedTeacherId(teacher.id)
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm border transition-colors ${
                  selectedTeacherId === teacher.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : disabled
                      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'
                }`}
              >
                <span className="font-medium">{teacher.name}</span>
                {disabled && reason && (
                  <div className="text-xs text-red-400 mt-0.5">{reason}</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={!canSubmit}
            onClick={() => {
              const topic = topics.find((t) => t.id === selectedTopicId)!
              const teacher = teachers.find((t) => t.id === selectedTeacherId)!
              onConfirm(topic, teacher)
            }}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white border border-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Add Session
          </button>
        </div>
      </div>
    </div>
  )
}
