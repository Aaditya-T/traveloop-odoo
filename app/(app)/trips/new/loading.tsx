export default function NewTripLoading() {
  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div className="grid gap-2">
        <div className="h-4 w-20 animate-pulse rounded bg-ink/10" />
        <div className="h-10 w-64 max-w-full animate-pulse rounded bg-ink/10" />
      </div>
      <div className="sketch-panel doodle-map grid gap-4 p-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-12 animate-pulse rounded bg-ink/10 ${i === 4 ? "min-h-24" : ""}`} />
        ))}
        <div className="h-11 w-40 animate-pulse rounded-lg bg-ink/10" />
      </div>
    </div>
  );
}
