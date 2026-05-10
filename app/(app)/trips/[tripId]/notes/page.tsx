import { NotebookPen, Plus, Trash2 } from "lucide-react";
import { TripNav } from "@/components/trip-nav";
import { addNoteAction, deleteNoteAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/date";
import { prisma } from "@/lib/prisma";

export default async function NotesPage({ params }: { params: Promise<{ tripId: string }> }) {
  const user = await requireUser();
  const { tripId } = await params;
  const trip = await prisma.trip.findUnique({
    where: { id: tripId, ownerId: user.id },
    include: {
      stops: { orderBy: { position: "asc" }, include: { city: true } },
      notes: { orderBy: { updatedAt: "desc" }, include: { stop: { include: { city: true } } } }
    }
  });

  if (!trip) {
    return <div className="sketch-panel p-8 text-2xl font-black">Trip not found.</div>;
  }

  return (
    <div className="grid gap-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Trip notes</p>
          <h1 className="text-4xl font-black text-ink">{trip.name}</h1>
        </div>
        <TripNav tripId={trip.id} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <form action={addNoteAction} className="sketch-panel doodle-map grid content-start gap-4 p-5">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-coral" />
            <h2 className="text-2xl font-black">Add note</h2>
          </div>
          <input name="tripId" type="hidden" value={trip.id} />
          <label className="grid gap-2">
            <span className="label">Attach to stop</span>
            <select className="input" name="stopId" defaultValue="">
              <option value="">Whole trip</option>
              {trip.stops.map((stop) => (
                <option key={stop.id} value={stop.id}>
                  {stop.city.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="label">Title</span>
            <input className="input" name="title" placeholder="Hotel check-in" required />
          </label>
          <label className="grid gap-2">
            <span className="label">Note</span>
            <textarea className="input min-h-36" name="body" placeholder="Address, reminders, booking codes..." required />
          </label>
          <button className="btn-primary" type="submit">
            Save note
          </button>
        </form>

        <div className="grid content-start gap-4">
          {trip.notes.map((note) => (
            <article key={note.id} className="sketch-panel bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <NotebookPen className="h-5 w-5 text-coral" />
                    <h2 className="text-2xl font-black text-ink">{note.title}</h2>
                  </div>
                  <p className="mt-1 text-sm font-bold text-ink/55">
                    {note.stop?.city.name ?? "Whole trip"} - updated {formatDate(note.updatedAt)}
                  </p>
                </div>
                <form action={deleteNoteAction}>
                  <input name="tripId" type="hidden" value={trip.id} />
                  <input name="noteId" type="hidden" value={note.id} />
                  <button className="btn-ghost text-coral" type="submit">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-ink/75">{note.body}</p>
            </article>
          ))}
          {trip.notes.length === 0 ? <p className="sketch-panel p-5 font-bold text-ink/65">No notes yet. Add hotel details, reminders, or day-specific thoughts.</p> : null}
        </div>
      </section>
    </div>
  );
}
