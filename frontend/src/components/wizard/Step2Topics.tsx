import { useState, useEffect, useRef } from 'react'
import { useWizardStore } from '../../store/wizardStore'
import type { Topic } from '../../types'
import { generateId, formatDuration } from '../../lib/utils'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { ColorPicker } from '../shared/ColorPicker'

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

function newTopic(idx: number): Topic {
  return {
    id: generateId(),
    name: '',
    durationMinutes: 60,
    numSessions: 1,
    color: COLORS[idx % COLORS.length],
  }
}

export function Step2Topics() {
  const { topics, addTopic, updateTopic, removeTopic } = useWizardStore()
  const [editId, setEditId] = useState<string | null>(null)
  const [focusId, setFocusId] = useState<string | null>(null)
  const nameRefs = useRef<Map<string, HTMLInputElement>>(new Map())

  useEffect(() => {
    if (focusId) {
      nameRefs.current.get(focusId)?.focus()
      setFocusId(null)
    }
  }, [focusId])

  const handleAdd = () => {
    const t = newTopic(topics.length)
    addTopic(t)
    setEditId(t.id)
    setFocusId(t.id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Topics</h2>
        <Button onClick={handleAdd} size="sm">+ Add topic</Button>
      </div>

      {topics.length === 0 && (
        <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
          No topics yet. Add your first topic.
        </div>
      )}

      <div className="space-y-2">
        {topics.map((t) => (
          <div key={t.id} className="border rounded-lg overflow-hidden">
            <div
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
              onClick={() => setEditId(editId === t.id ? null : t.id)}
            >
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
              <input
                ref={(el) => {
                  if (el) nameRefs.current.set(t.id, el)
                  else nameRefs.current.delete(t.id)
                }}
                value={t.name}
                onChange={(e) => updateTopic(t.id, { name: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                placeholder="Unnamed"
                className="w-48 font-medium text-sm bg-transparent border-b border-transparent focus:border-gray-400 focus:outline-none placeholder:text-gray-400 placeholder:italic"
              />
              <span className="text-xs text-gray-400 flex-shrink-0 ml-auto">
                {formatDuration(t.durationMinutes)} × {t.numSessions} session{t.numSessions !== 1 ? 's' : ''}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); removeTopic(t.id) }}
              >
                ✕
              </Button>
            </div>

            {editId === t.id && (
              <div className="border-t p-4 bg-gray-50 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Duration</Label>
                    <select
                      value={t.durationMinutes}
                      onChange={(e) => updateTopic(t.id, { durationMinutes: parseInt(e.target.value) })}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[15, 30, 45, 60, 75, 90, 105, 120, 150, 180].map((m) => (
                        <option key={m} value={m}>{formatDuration(m)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Number of sessions</Label>
                    <Input
                      type="number"
                      min={1}
                      value={t.numSessions}
                      onChange={(e) => updateTopic(t.id, { numSessions: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Color</Label>
                  <ColorPicker value={t.color} onChange={(c) => updateTopic(t.id, { color: c })} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
