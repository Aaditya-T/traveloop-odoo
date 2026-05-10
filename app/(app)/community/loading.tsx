export default function CommunityLoading() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <div className="h-4 w-28 animate-pulse rounded bg-ink/10" />
        <div className="h-10 w-80 max-w-full animate-pulse rounded bg-ink/10" />
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="h-11 flex-1 min-w-[12rem] animate-pulse rounded-lg bg-ink/10" />
        <div className="h-11 w-32 animate-pulse rounded-lg bg-ink/10" />
      </div>
      <div className="grid gap-5">
        {[0, 1].map((i) => (
          <article key={i} className="sketch-panel grid gap-4 p-5">
            <div className="flex flex-wrap gap-4">
              <div className="h-24 w-32 shrink-0 animate-pulse rounded bg-ink/10" />
              <div className="grid flex-1 gap-3">
                <div className="h-8 w-2/3 animate-pulse rounded bg-ink/10" />
                <div className="h-4 w-full animate-pulse rounded bg-ink/10" />
                <div className="h-10 w-full animate-pulse rounded-lg bg-ink/10" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
