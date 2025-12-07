export function IndicatorsSkeleton() {
  return (
    <div className="grid gap-4">
      {[1, 2, 3].map((slot) => (
        <div
          key={slot}
          className="surface-highlight animate-pulse"
          aria-hidden="true"
        >
          <div className="h-5 w-1/3 rounded-sm bg-muted/70 mb-3" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((dot) => (
              <span key={dot} className="h-3 w-20 rounded-full bg-muted/50" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
