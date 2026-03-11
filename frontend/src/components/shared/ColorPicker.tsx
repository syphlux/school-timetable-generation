

interface Props {
  value: string
  onChange: (color: string) => void
}

const PRESET_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
]

export function ColorPicker({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-6 h-6 rounded-full border-2 transition-transform ${value === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
          style={{ backgroundColor: c }}
          title={c}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded cursor-pointer border border-gray-300"
        title="Custom color"
      />
    </div>
  )
}
