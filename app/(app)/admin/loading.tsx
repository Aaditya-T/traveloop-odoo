export default function AdminLoading() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <div className="h-4 w-24 animate-pulse rounded bg-ink/10" />
        <div className="h-10 w-56 max-w-full animate-pulse rounded bg-ink/10" />
      </div>
      <div className="sketch-panel min-h-[240px] animate-pulse p-6" />
    </div>
  );
}
