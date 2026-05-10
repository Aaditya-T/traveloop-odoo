import { ArrowRight, CalendarDays, Compass, Globe2, MapPinned, Sparkles } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { money, totalActivityCost, totalExpenseCost } from "@/lib/budget";
import { daysBetweenInclusive } from "@/lib/date";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [user, trips, cities] = await Promise.all([
    getCurrentUser(),
    prisma.trip.findMany({
      where: {
        OR: [{ visibility: "PUBLIC" }, { isPublic: true }],
        shareSlug: { not: null },
        moderationStatus: "ACTIVE"
      },
      orderBy: [{ likes: { _count: "desc" } }, { updatedAt: "desc" }],
      take: 3,
      include: {
        owner: { select: { name: true } },
        stops: { orderBy: { position: "asc" }, include: { city: true, itinerary: { include: { activity: true } } } },
        expenses: true,
        likes: true
      }
    }),
    prisma.city.findMany({
      where: { isArchived: false },
      orderBy: [{ isFeatured: "desc" }, { popularity: "desc" }],
      take: 6
    })
  ]);

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl gap-8 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link className="flex items-center gap-2 text-xl font-black text-ink" href="/">
          <span className="grid h-10 w-10 place-items-center border-2 border-ink bg-ticket shadow-sketch" style={{ borderRadius: 8 }}>
            <Compass className="h-5 w-5" />
          </span>
          Traveloop
        </Link>
        <nav className="flex flex-wrap gap-2">
          <Link className="btn-ghost" href="/community">
            <Globe2 className="h-4 w-4" />
            Community
          </Link>
          {user ? (
            <Link className="btn-secondary" href="/dashboard">Dashboard</Link>
          ) : (
            <>
              <Link className="btn-ghost" href="/login">Sign in</Link>
              <Link className="btn-secondary" href="/signup">Create account</Link>
            </>
          )}
        </nav>
      </header>

      <section className="sketch-panel doodle-map grid gap-8 overflow-hidden p-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:p-8">
        <div>
          <div className="stamp">travel plans with a pulse</div>
          <h1 className="mt-5 text-5xl font-black leading-none text-ink sm:text-7xl">
            Build routes, budgets, notes, and shareable itineraries in one playful workspace.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-ink/70">
            Browse the community without logging in. Sign in only when you want to plan, copy, save, comment, or share your own trip.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="btn-primary" href={user ? "/trips/new" : "/signup"}>
              Start planning
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link className="btn-secondary" href="/community">
              Explore public trips
            </Link>
          </div>
        </div>

        <div className="route-line grid gap-4 pl-9">
          {cities.slice(0, 4).map((city, index) => (
            <article key={city.id} className="sketch-panel relative bg-white p-4">
              <span className="absolute -left-12 top-4 grid h-9 w-9 place-items-center border-2 border-ink bg-ticket text-sm font-black shadow-sketch" style={{ borderRadius: 999 }}>
                {index + 1}
              </span>
              <p className="label">{city.region}</p>
              <h2 className="text-xl font-black">{city.name}, {city.country}</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink/65">{city.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Plan", "Choose stops, add activities, and arrange a day-wise route.", MapPinned],
          ["Track", "Keep expense totals, invoices, packing, and notes close.", CalendarDays],
          ["Share", "Publish a clean read-only itinerary or explore the community.", Sparkles]
        ].map(([title, body, Icon]) => (
          <article key={title as string} className="sketch-panel bg-white p-5">
            <Icon className="h-6 w-6 text-coral" />
            <h2 className="mt-4 text-2xl font-black">{title as string}</h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">{body as string}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label">Public preview</p>
            <h2 className="text-3xl font-black text-ink">Featured community itineraries</h2>
          </div>
          <Link className="btn-ghost" href="/community">View all</Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {trips.map((trip) => {
            const total = totalActivityCost(trip.stops.flatMap((stop) => stop.itinerary)) + totalExpenseCost(trip.expenses);

            return (
              <article key={trip.id} className="sketch-panel overflow-hidden bg-white">
                <div className="h-36 border-b-2 border-ink bg-cover bg-center" style={{ backgroundImage: `url(${trip.coverPhotoUrl || trip.stops[0]?.city.imageUrl || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"})` }} />
                <div className="grid gap-3 p-5">
                  <span className="stamp justify-self-start">{daysBetweenInclusive(trip.startDate, trip.endDate)} days</span>
                  <h3 className="text-2xl font-black">{trip.name}</h3>
                  <p className="text-sm font-bold text-ink/60">By {trip.owner.name} - {trip.likes.length} likes</p>
                  <p className="line-clamp-2 text-sm leading-6 text-ink/65">{trip.description || "A community route ready to inspect."}</p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-black">{money(total)}</span>
                    <Link className="btn-secondary" href={`/share/${trip.shareSlug}`}>Preview</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {trips.length === 0 ? (
          <div className="sketch-panel p-6 text-center">
            <h3 className="text-2xl font-black">Community previews are warming up</h3>
            <p className="mt-2 text-sm text-ink/65">Public itineraries will appear here as travellers publish them.</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
