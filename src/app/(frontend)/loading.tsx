export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-32 flex items-center justify-center">
      <div className="flex items-center gap-3 text-ink-muted text-sm">
        <span className="inline-block w-2 h-2 rounded-full bg-copper animate-pulse" />
        <span className="tracking-wide">Loading</span>
      </div>
    </div>
  )
}
