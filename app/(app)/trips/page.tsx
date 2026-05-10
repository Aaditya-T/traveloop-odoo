import { CalendarDays, MapPin, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { deleteTripAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/date";
import { prisma } from "@/lib/prisma";

export default async function TripsPage() {
  const user = await requireUser();
  const trips = await prisma.trip.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { stops: { include: { city: true } } }
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">My trips</p>
          <h1 className="text-4xl font-black text-ink">Every route on the table</h1>
        </div>
        <Link className="btn-primary" href="/trips/new">
          <Plus className="h-4 w-4" />
          Plan New Trip
        </Link>
      </div>

      {trips.length === 0 ? (
        <EmptyState title="No trips yet" body="Start with dates and a name, then add city stops and activities." href="/trips/new" action="Create a trip" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trips.map((trip) => (
            <article key={trip.id} className="sketch-panel overflow-hidden bg-white">
              <div className="h-36 border-b-2 border-ink bg-cover bg-center" style={{ backgroundImage: `url(${trip.coverPhotoUrl || trip.stops[0]?.city.imageUrl || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"})` }} />
              <div className="grid gap-4 p-5">
                <div>
                  <h2 className="text-2xl font-black text-ink">{trip.name}</h2>
                  <p className="mt-1 flex items-center gap-2 text-sm font-bold text-ink/65">
                    <CalendarDays className="h-4 w-4" />
                    {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                  </p>
                </div>
                <p className="flex items-center gap-2 text-sm font-bold text-ink/65">
                  <MapPin className="h-4 w-4 text-coral" />
                  {trip.stops.length ? trip.stops.map((stop) => stop.city.name).join(" -> ") : "No stops yet"}
                </p>
                <span className="stamp justify-self-start">{trip.visibility.toLowerCase()}</span>
                <div className="flex flex-wrap gap-2">
                  <Link className="btn-secondary" href={`/trips/${trip.id}`}>
                    View
                  </Link>
                  <Link className="btn-ghost" href={`/trips/${trip.id}/builder`}>
                    Edit
                  </Link>
                  <form action={deleteTripAction}>
                    <input name="tripId" type="hidden" value={trip.id} />
                    <button className="btn-ghost text-coral" type="submit">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
