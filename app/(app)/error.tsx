"use client";

import { RefreshCcw } from "lucide-react";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="sketch-panel doodle-map mx-auto grid max-w-2xl gap-4 p-8 text-center">
      <h1 className="text-3xl font-black text-ink">The route hit a snag</h1>
      <p className="text-sm leading-6 text-ink/70">Something went wrong while loading this workspace. Try again and we will redraw the map.</p>
      <button className="btn-primary mx-auto" onClick={reset} type="button">
        <RefreshCcw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}
