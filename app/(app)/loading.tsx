export default function Loading() {
  return (
    <div className="grid gap-4">
      <div className="sketch-panel doodle-map h-48 animate-pulse" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="soft-panel h-32 animate-pulse" />
        <div className="soft-panel h-32 animate-pulse" />
        <div className="soft-panel h-32 animate-pulse" />
      </div>
    </div>
  );
}
