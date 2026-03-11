import { useState } from 'react'
import { useWizardStore } from '../../store/wizardStore'
import type { Teacher } from '../../types'
import { generateId } from '../../lib/utils'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'

function newTeacher(): Teacher {
  return { id: generateId(), name: '', topicIds: [], unavailableDates: [] }
}

export function Step3Teachers() {
  const { teachers, topics, addTeacher, updateTeacher, removeTeacher } = useWizardStore()
  const [editId, setEditId] = useState<string | null>(null)
  const [newDate, setNewDate] = useState<Record<string, string>>({})

  const handleAdd = () => {
    const t = newTeacher()
    addTeacher(t)
    setEditId(t.id)
  }

  const toggleTopic = (teacher: Teacher, topicId: string) => {
    const ids = teacher.topicIds.includes(topicId)
      ? teacher.topicIds.filter((id) => id !== topicId)
      : [...teacher.topicIds, topicId]
    updateTeacher(teacher.id, { topicIds: ids })
  }

  const addUnavailableDate = (teacher: Teacher) => {
    const d = newDate[teacher.id]
    if (!d || teacher.unavailableDates.includes(d)) return
    updateTeacher(teacher.id, { unavailableDates: [...teacher.unavailableDates, d].sort() })
    setNewDate((prev) => ({ ...prev, [teacher.id]: '' }))
  }

  const removeDate = (teacher: Teacher, date: string) => {
    updateTeacher(teacher.id, { unavailableDates: teacher.unavailableDates.filter((d) => d !== date) })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Teachers</h2>
        <Button onClick={handleAdd} size="sm">+ Add teacher</Button>
      </div>

      {teachers.length === 0 && (
        <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
          No teachers yet. Add your first teacher.
        </div>
      )}

      <div className="space-y-2">
        {teachers.map((tc) => (
          <div key={tc.id} className="border rounded-lg overflow-hidden">
            <div
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
              onClick={() => setEditId(editId === tc.id ? null : tc.id)}
            >
              <span className="flex-1 font-medium text-sm">
                {tc.name || <span className="text-gray-400 italic">Unnamed</span>}
              </span>
              <span className="text-xs text-gray-400">{tc.topicIds.length} topic(s)</span>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeTeacher(tc.id) }}>✕</Button>
            </div>

            {editId === tc.id && (
              <div className="border-t p-4 bg-gray-50 space-y-4">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input
                    value={tc.name}
                    onChange={(e) => updateTeacher(tc.id, { name: e.target.value })}
                    placeholder="e.g. Alice Smith"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label>Qualified topics</Label>
                  <div className="flex flex-wrap gap-2">
                    {topics.map((topic) => (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => toggleTopic(tc, topic.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          tc.topicIds.includes(topic.id)
                            ? 'text-white border-transparent'
                            : 'bg-white border-gray-300 text-gray-700'
                        }`}
                        style={tc.topicIds.includes(topic.id) ? { backgroundColor: topic.color } : {}}
                      >
                        {topic.name || 'Unnamed'}
                      </button>
                    ))}
                    {topics.length === 0 && (
                      <span className="text-gray-400 text-sm">No topics defined yet.</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Unavailable dates</Label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newDate[tc.id] || ''}
                      onChange={(e) => setNewDate((prev) => ({ ...prev, [tc.id]: e.target.value }))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                    <Button variant="outline" size="sm" onClick={() => addUnavailableDate(tc)} type="button">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tc.unavailableDates.map((d) => (
                      <Badge key={d} variant="secondary" className="gap-1">
                        {d}
                        <button onClick={() => removeDate(tc, d)} className="ml-1 hover:text-red-600">✕</button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
