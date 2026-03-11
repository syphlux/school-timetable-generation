interface Props {
  selectedCount: number
}

export function SwapOverlay({ selectedCount }: Props) {
  if (selectedCount === 0) return null
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-yellow-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium pointer-events-none">
      Click another session of the same duration to swap — or click it again to cancel
    </div>
  )
}
