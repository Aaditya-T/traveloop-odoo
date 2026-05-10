import { ArrowRight, CalendarDays, CircleDollarSign, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import { AnimatedPage } from "@/components/animated-page";
import { EmptyState } from "@/components/empty-state";
import { requireUser } from "@/lib/auth";
import { averagePerDay, money, totalActivityCost, totalExpenseCost } from "@/lib/budget";
import { formatDate } from "@/lib/date";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await requireUser();
  const [trips, cities] = await Promise.all([
    prisma.trip.findMany({
      where: { ownerId: user.id },
      orderBy: { startDate: "asc" },
      take: 4,
      include: {
        stops: { include: { city: true, itinerary: { include: { activity: true } } } },
        expenses: true
      }
    }),
    prisma.city.findMany({ where: { isArchived: false }, orderBy: [{ isFeatured: "desc" }, { popularity: "desc" }], take: 4, include: { activities: { where: { isArchived: false }, take: 2 } } })
  ]);

  return (
    <AnimatedPage>
      <div className="grid gap-8">
        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr] lg:items-stretch">
          <div className="sketch-panel doodle-map relative overflow-hidden p-6 sm:p-8" data-tour="dashboard-hero">
            <div className="stamp">today&apos;s travel desk</div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-ink sm:text-6xl">
              Hey {user.name.split(" ")[0]}, where are we looping next?
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink/70">
              Sketch an itinerary, keep costs visible, and share the plan before the group chat turns into archaeology.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="btn-primary" href="/trips/new">
                Plan New Trip
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link className="btn-secondary" href="/trips">
                View My Trips
              </Link>
            </div>
            <Sparkles className="floaty absolute right-8 top-8 hidden h-14 w-14 text-ticket md:block" />
          </div>
          <div className="grid gap-3">
            <div className="soft-panel bg-lagoon p-5 text-white">
              <p className="text-sm font-black uppercase">Trips planned</p>
              <p className="mt-3 text-5xl font-black">{trips.length}</p>
            </div>
            <div className="soft-panel bg-ticket p-5 text-ink">
              <p className="text-sm font-black uppercase">Curated ideas</p>
              <p className="mt-3 text-5xl font-black">{cities.length * 2}+</p>
            </div>
          </div>
        </section>

        {trips.length === 0 ? (
          <EmptyState
            title="Your map is still clean"
            body="Create the first trip and Traveloop will unlock the builder, budget, checklist, notes, and public share page."
            href="/trips/new"
            action="Start planning"
          />
        ) : (
          <section className="grid gap-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="label">Upcoming trips</p>
                <h2 className="text-3xl font-black text-ink">Pinned to the corkboard</h2>
              </div>
              <Link className="font-black text-coral underline" href="/trips">
                All trips
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {trips.map((trip) => {
                const itineraryItems = trip.stops.flatMap((stop) => stop.itinerary);
                const total = totalActivityCost(itineraryItems) + totalExpenseCost(trip.expenses);

                return (
                  <Link key={trip.id} className="sketch-panel ticket-wiggle block p-5 transition hover:-translate-y-1" href={`/trips/${trip.id}`}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="stamp">{trip.stops.length} stops</span>
                      <MapPin className="h-5 w-5 text-coral" />
                    </div>
                    <h3 className="mt-5 text-2xl font-black text-ink">{trip.name}</h3>
                    <p className="mt-2 text-sm font-bold text-ink/60">
                      {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                    </p>
                    <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
                      <span className="flex items-center gap-1 font-bold text-ink/70">
                        <CalendarDays className="h-4 w-4" />
                        {itineraryItems.length} plans
                      </span>
                      <span className="flex items-center gap-1 font-bold text-ink/70">
                        <CircleDollarSign className="h-4 w-4" />
                        {money(averagePerDay(total, trip.startDate, trip.endDate))}/day
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section className="grid gap-4">
          <div>
            <p className="label">Inspiration shelf</p>
            <h2 className="text-3xl font-black text-ink">Popular cities to start a route</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cities.map((city) => (
              <article key={city.id} className="soft-panel overflow-hidden bg-white">
                <div className="h-28 border-b-2 border-ink bg-cover bg-center" style={{ backgroundImage: `url(${city.imageUrl})` }} />
                <div className="p-4">
                  <h3 className="text-xl font-black">{city.name}</h3>
                  <p className="text-sm font-bold text-ink/60">{city.country}</p>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-ink/70">{city.summary}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AnimatedPage>
  );
}
