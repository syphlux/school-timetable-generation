

interface Props {
  active: boolean
  selectedCount: number
}

export function SwapOverlay({ active, selectedCount }: Props) {
  if (!active) return null
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-yellow-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium pointer-events-none">
      {selectedCount === 0
        ? 'Swap mode: click a session to select it'
        : 'Now click a second session of the same duration to swap'}
    </div>
  )
}
