import { ActivityCategory } from "@prisma/client";
import { ArrowDown, ArrowUp, Filter, MapPin, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { TripNav } from "@/components/trip-nav";
import { addItineraryItemAction, addStopAction, deleteStopAction, moveStopAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { formatDate, htmlDate } from "@/lib/date";
import { prisma } from "@/lib/prisma";

const categories = Object.values(ActivityCategory);

export default async function BuilderPage({
  params,
  searchParams
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ city?: string; region?: string; activity?: string; category?: ActivityCategory }>;
}) {
  const user = await requireUser();
  const { tripId } = await params;
  const filters = await searchParams;
  const trip = await prisma.trip.findUnique({
    where: { id: tripId, ownerId: user.id },
    include: {
      stops: {
        orderBy: { position: "asc" },
        include: {
          city: true,
          itinerary: { orderBy: [{ date: "asc" }, { startTime: "asc" }], include: { activity: true } }
        }
      }
    }
  });

  if (!trip) {
    return <div className="sketch-panel p-8 text-2xl font-black">Trip not found.</div>;
  }

  const [cities, activities] = await Promise.all([
    prisma.city.findMany({
      where: {
        AND: [
          filters.city
            ? {
                OR: [
                  { name: { contains: filters.city, mode: "insensitive" } },
                  { country: { contains: filters.city, mode: "insensitive" } }
                ]
              }
            : {},
          filters.region ? { region: filters.region } : {}
        ]
      },
      orderBy: [{ popularity: "desc" }, { name: "asc" }],
      take: 8
    }),
    prisma.activity.findMany({
      where: {
        AND: [
          filters.activity
            ? {
                OR: [
                  { name: { contains: filters.activity, mode: "insensitive" } },
                  { description: { contains: filters.activity, mode: "insensitive" } }
                ]
              }
            : {},
          filters.category ? { category: filters.category } : {},
          trip.stops.length ? { cityId: { in: trip.stops.map((stop) => stop.cityId) } } : {}
        ]
      },
      include: { city: true },
      orderBy: { estimatedCost: "asc" },
      take: 12
    })
  ]);

  return (
    <div className="grid gap-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Itinerary builder</p>
          <h1 className="text-4xl font-black text-ink">{trip.name}</h1>
        </div>
        <TripNav tripId={trip.id} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="grid content-start gap-5">
          <form className="sketch-panel doodle-map grid gap-4 p-5">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-coral" />
              <h2 className="text-2xl font-black">City search</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_0.75fr_auto]">
              <input className="input" name="city" placeholder="Tokyo, Paris, Peru..." defaultValue={filters.city ?? ""} />
              <input className="input" name="region" placeholder="Asia, Europe..." defaultValue={filters.region ?? ""} />
              <button className="btn-secondary" type="submit">
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </div>
          </form>

          <div className="grid gap-4">
            {cities.map((city) => (
              <article key={city.id} className="sketch-panel overflow-hidden bg-white">
                <div className="grid sm:grid-cols-[160px_1fr]">
                  <div className="min-h-36 border-b-2 border-ink bg-cover bg-center sm:border-b-0 sm:border-r-2" style={{ backgroundImage: `url(${city.imageUrl})` }} />
                  <div className="grid gap-4 p-4">
                    <div>
                      <h3 className="text-2xl font-black text-ink">{city.name}</h3>
                      <p className="text-sm font-bold text-ink/60">{city.country} - {city.region}</p>
                      <p className="mt-2 text-sm leading-6 text-ink/70">{city.summary}</p>
                    </div>
                    <form action={addStopAction} className="grid gap-3">
                      <input name="tripId" type="hidden" value={trip.id} />
                      <input name="cityId" type="hidden" value={city.id} />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input className="input" name="startDate" type="date" defaultValue={htmlDate(trip.startDate)} />
                        <input className="input" name="endDate" type="date" defaultValue={htmlDate(trip.endDate)} />
                      </div>
                      <button className="btn-primary" type="submit">
                        <Plus className="h-4 w-4" />
                        Add Stop
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="grid content-start gap-5">
          <div className="sketch-panel grid gap-4 p-5">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-coral" />
              <h2 className="text-2xl font-black">Current route</h2>
            </div>
            {trip.stops.length === 0 ? (
              <p className="text-sm leading-6 text-ink/65">Add your first city stop from the search results.</p>
            ) : (
              <div className="route-line grid gap-3">
                {trip.stops.map((stop, index) => (
                  <div key={stop.id} className="relative ml-10 border-2 border-ink bg-paper p-4" style={{ borderRadius: 8 }}>
                    <span className="absolute -left-12 top-4 grid h-9 w-9 place-items-center border-2 border-ink bg-ticket text-sm font-black shadow-sketch" style={{ borderRadius: 999 }}>
                      {index + 1}
                    </span>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-black">{stop.city.name}</h3>
                        <p className="text-sm font-bold text-ink/60">
                          {formatDate(stop.startDate)} - {formatDate(stop.endDate)}
                        </p>
                        <p className="mt-1 text-sm text-ink/60">{stop.itinerary.length} activities pinned</p>
                      </div>
                      <div className="flex gap-2">
                        <form action={moveStopAction}>
                          <input name="tripId" type="hidden" value={trip.id} />
                          <input name="stopId" type="hidden" value={stop.id} />
                          <input name="direction" type="hidden" value="up" />
                          <button className="btn-ghost" type="submit" title="Move up">
                            <ArrowUp className="h-4 w-4" />
                          </button>
                        </form>
                        <form action={moveStopAction}>
                          <input name="tripId" type="hidden" value={trip.id} />
                          <input name="stopId" type="hidden" value={stop.id} />
                          <input name="direction" type="hidden" value="down" />
                          <button className="btn-ghost" type="submit" title="Move down">
                            <ArrowDown className="h-4 w-4" />
                          </button>
                        </form>
                        <form action={deleteStopAction}>
                          <input name="tripId" type="hidden" value={trip.id} />
                          <input name="stopId" type="hidden" value={stop.id} />
                          <button className="btn-ghost text-coral" type="submit" title="Remove stop">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form className="sketch-panel doodle-map grid gap-4 p-5">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-coral" />
              <h2 className="text-2xl font-black">Activity search</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_0.8fr_auto]">
              <input className="input" name="activity" placeholder="street food, museum, hikes..." defaultValue={filters.activity ?? ""} />
              <select className="input" name="category" defaultValue={filters.category ?? ""}>
                <option value="">Any category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.toLowerCase()}
                  </option>
                ))}
              </select>
              <button className="btn-secondary" type="submit">
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </div>
          </form>

          <div className="grid gap-4">
            {activities.map((activity) => (
              <article key={activity.id} className="sketch-panel grid gap-4 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-black text-ink">{activity.name}</h3>
                    <p className="text-sm font-bold text-ink/60">{activity.city.name} - {activity.category.toLowerCase()} - ${activity.estimatedCost}</p>
                    <p className="mt-2 text-sm leading-6 text-ink/70">{activity.description}</p>
                  </div>
                  <span className="stamp">{activity.durationHours}h</span>
                </div>
                <form action={addItineraryItemAction} className="grid gap-3 lg:grid-cols-[1fr_0.9fr_0.7fr_auto]">
                  <input name="tripId" type="hidden" value={trip.id} />
                  <input name="activityId" type="hidden" value={activity.id} />
                  <select className="input" name="stopId" required defaultValue={trip.stops.find((stop) => stop.cityId === activity.cityId)?.id ?? ""}>
                    <option value="">Choose stop</option>
                    {trip.stops.map((stop) => (
                      <option key={stop.id} value={stop.id}>
                        {stop.city.name}
                      </option>
                    ))}
                  </select>
                  <input className="input" name="date" type="date" defaultValue={htmlDate(trip.stops.find((stop) => stop.cityId === activity.cityId)?.startDate ?? trip.startDate)} />
                  <input className="input" name="startTime" type="time" defaultValue="10:00" />
                  <button className="btn-primary" type="submit" disabled={trip.stops.length === 0}>
                    Add
                  </button>
                </form>
              </article>
            ))}
            {activities.length === 0 ? (
              <div className="sketch-panel p-6">
                <p className="font-bold text-ink/70">
                  Add stops first, then activities from those cities will appear here.
                </p>
              </div>
            ) : null}
          </div>

          <Link className="btn-secondary justify-self-start" href={`/trips/${trip.id}`}>
            Review itinerary
          </Link>
        </div>
      </section>
    </div>
  );
}
