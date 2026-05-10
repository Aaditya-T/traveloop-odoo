export default function TripsLoading() {
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid w-full max-w-md gap-3">
          <div className="h-4 w-24 animate-pulse rounded bg-ink/10" />
          <div className="h-10 w-full max-w-sm animate-pulse rounded bg-ink/10" />
        </div>
        <div className="h-11 w-44 animate-pulse rounded-lg bg-ink/10" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="sketch-panel overflow-hidden">
            <div className="h-36 animate-pulse bg-ink/10" />
            <div className="grid gap-3 p-5">
              <div className="h-7 w-3/4 animate-pulse rounded bg-ink/10" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-ink/10" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-ink/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
