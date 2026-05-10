import { Compass } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="sketch-panel doodle-map mx-auto grid max-w-2xl gap-4 p-8 text-center">
      <Compass className="mx-auto h-12 w-12 text-coral" />
      <h1 className="text-3xl font-black text-ink">This route is off the map</h1>
      <p className="text-sm leading-6 text-ink/70">The page may have moved, been archived, or belongs to another traveller.</p>
      <Link className="btn-primary mx-auto" href="/dashboard">
        Back to dashboard
      </Link>
    </div>
  );
}
