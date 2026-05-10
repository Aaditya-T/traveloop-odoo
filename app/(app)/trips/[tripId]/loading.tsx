export default function TripDetailLoading() {
  return (
    <div className="grid gap-6">
      <section className="sketch-panel doodle-map overflow-hidden">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4">
            <div className="h-6 w-32 animate-pulse rounded bg-ink/10" />
            <div className="h-12 w-full max-w-lg animate-pulse rounded bg-ink/10" />
            <div className="h-20 max-w-2xl animate-pulse rounded bg-ink/10" />
            <div className="flex flex-wrap gap-3">
              <div className="h-6 w-40 animate-pulse rounded bg-ink/10" />
              <div className="h-6 w-24 animate-pulse rounded bg-ink/10" />
            </div>
          </div>
          <div className="grid content-start gap-3">
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 w-24 animate-pulse rounded-lg bg-ink/15" />
              ))}
            </div>
            <div className="h-10 animate-pulse rounded-lg bg-ink/10" />
          </div>
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="grid gap-4">
          <div className="h-8 w-48 animate-pulse rounded bg-ink/10" />
          <div className="sketch-panel min-h-[200px] animate-pulse p-5" />
          <div className="sketch-panel min-h-[160px] animate-pulse p-5" />
        </div>
        <div className="sketch-panel min-h-[320px] animate-pulse p-5" />
      </section>
    </div>
  );
}
