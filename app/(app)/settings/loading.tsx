export default function SettingsLoading() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <div className="h-4 w-24 animate-pulse rounded bg-ink/10" />
        <div className="h-10 w-72 max-w-full animate-pulse rounded bg-ink/10" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
        <div className="sketch-panel doodle-map min-h-[420px] animate-pulse p-6" />
        <div className="grid content-start gap-5">
          <div className="sketch-panel min-h-[200px] animate-pulse p-5" />
          <div className="sketch-panel min-h-[180px] animate-pulse p-5" />
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="sketch-panel min-h-[160px] animate-pulse p-5" />
        ))}
      </div>
    </div>
  );
}
