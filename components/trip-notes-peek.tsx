import { ArrowRight, StickyNote } from "lucide-react";
import Link from "next/link";

export type TripNotePeekItem = {
  id: string;
  title: string;
  body: string;
  stop: { city: { name: string } } | null;
};

function clip(text: string, max: number) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function TripNotesPeek({ tripId, notes }: { tripId: string; notes: TripNotePeekItem[] }) {
  const notesHref = `/trips/${tripId}/notes`;

  return (
    <div className="sketch-panel grid gap-3 border-2 border-dashed border-ink/20 bg-paper p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-coral" />
          <h2 className="text-lg font-black text-ink">Sticky notes</h2>
        </div>
        <Link className="inline-flex items-center gap-1 text-sm font-black text-coral underline" href={notesHref}>
          {notes.length ? "Manage all" : "Add note"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {notes.length === 0 ? (
        <p className="text-sm text-ink/55">No notes yet. Use Notes for hotels, booking refs, and anything you want one tap away.</p>
      ) : (
        <ul className="grid gap-2">
          {notes.map((n) => (
            <li key={n.id}>
              <Link
                className="block border-2 border-ink/15 bg-white p-3 transition hover:border-ink/35"
                href={notesHref}
                style={{ borderRadius: 8 }}
              >
                <p className="font-black text-ink">{n.title}</p>
                {n.stop ? (
                  <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-ink/50">{n.stop.city.name}</p>
                ) : null}
                <p className="mt-1 line-clamp-2 text-sm leading-5 text-ink/70">{clip(n.body, 160)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
