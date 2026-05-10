export default function DashboardLoading() {
  return (
    <div className="grid gap-8">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr] lg:items-stretch">
        <div className="sketch-panel doodle-map min-h-[280px] animate-pulse p-6 sm:p-8" />
        <div className="soft-panel min-h-[280px] animate-pulse" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="soft-panel h-40 animate-pulse" />
        <div className="soft-panel h-40 animate-pulse" />
      </div>
    </div>
  );
}
