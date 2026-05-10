import { CopyPlus, Flag, Heart, MessageSquare, Search, Star } from "lucide-react";
import Link from "next/link";
import { addCommunityCommentAction, copyPublicTripAction, reportCommentAction, reportTripAction, toggleLikeTripAction, toggleSaveTripAction } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";
import { money, totalActivityCost, totalExpenseCost } from "@/lib/budget";
import { daysBetweenInclusive, formatDate } from "@/lib/date";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CommunityPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; region?: string; maxBudget?: string }>;
}) {
  const [user, filters] = await Promise.all([getCurrentUser(), searchParams]);
  const query = filters.q?.trim().toLowerCase() ?? "";
  const region = filters.region?.trim().toLowerCase() ?? "";
  const maxBudget = filters.maxBudget ? Number(filters.maxBudget) : null;
  const trips = await prisma.trip.findMany({
    where: {
      OR: [{ visibility: "PUBLIC" }, { isPublic: true }],
      shareSlug: { not: null },
      moderationStatus: "ACTIVE"
    },
    orderBy: [{ likes: { _count: "desc" } }, { updatedAt: "desc" }],
    include: {
      owner: { select: { name: true, photoUrl: true } },
      stops: { include: { city: true, itinerary: { include: { activity: true } } }, orderBy: { position: "asc" } },
      expenses: true,
      likes: true,
      saves: true,
      comments: {
        where: { moderationStatus: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 2,
        include: { user: { select: { name: true } } }
      }
    },
    take: 100
  });
  const filteredTrips = trips
    .filter((trip) => {
      if (!query) return true;
      const haystack = [
        trip.name,
        trip.description ?? "",
        trip.owner.name,
        ...trip.stops.flatMap((stop) => [stop.city.name, stop.city.country, stop.city.region, stop.city.summary])
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    })
    .filter((trip) => {
      if (!region) return true;
      return trip.stops.some((stop) => stop.city.region.toLowerCase().includes(region));
    })
    .filter((trip) => {
      if (!Number.isFinite(maxBudget) || maxBudget === null) return true;
      return totalActivityCost(trip.stops.flatMap((stop) => stop.itinerary)) + totalExpenseCost(trip.expenses) <= maxBudget;
    })
    .slice(0, 24);

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link className="flex items-center gap-2 text-xl font-black text-ink" href="/">
          <span className="grid h-10 w-10 place-items-center border-2 border-ink bg-ticket shadow-sketch" style={{ borderRadius: 8 }}>
            <Search className="h-5 w-5" />
          </span>
          Traveloop
        </Link>
        <nav className="flex flex-wrap gap-2">
          {user ? (
            <>
              <Link className="btn-ghost" href="/dashboard">Dashboard</Link>
              <Link className="btn-secondary" href="/trips/new">Plan a trip</Link>
            </>
          ) : (
            <>
              <Link className="btn-ghost" href="/login">Sign in</Link>
              <Link className="btn-secondary" href="/signup">Create account</Link>
            </>
          )}
        </nav>
      </header>

      <section className="sketch-panel doodle-map grid gap-4 p-6">
        <div className="stamp">community atlas</div>
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h1 className="text-4xl font-black text-ink sm:text-6xl">Browse trips worth borrowing</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/70">
              Explore public itineraries freely. Sign in when you want to save, copy, comment, report, or start planning.
            </p>
          </div>
          <Link className="btn-secondary" href={user ? "/trips/new" : "/login"}>
            Start planning
          </Link>
        </div>
        <form className="grid gap-3 md:grid-cols-[1fr_0.7fr_0.55fr_auto]">
          <input className="input" name="q" placeholder="Search city, route, style..." defaultValue={filters.q ?? ""} />
          <input className="input" name="region" placeholder="Region" defaultValue={filters.region ?? ""} />
          <input className="input" name="maxBudget" type="number" min="0" placeholder="Max budget" defaultValue={filters.maxBudget ?? ""} />
          <button className="btn-primary" type="submit">
            <Search className="h-4 w-4" />
            Search
          </button>
        </form>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredTrips.map((trip) => {
          const itineraryItems = trip.stops.flatMap((stop) => stop.itinerary);
          const total = totalActivityCost(itineraryItems) + totalExpenseCost(trip.expenses);
          const liked = user ? trip.likes.some((like) => like.userId === user.id) : false;
          const saved = user ? trip.saves.some((save) => save.userId === user.id) : false;

          return (
            <article key={trip.id} className="sketch-panel overflow-hidden bg-white">
              <div className="h-40 border-b-2 border-ink bg-cover bg-center" style={{ backgroundImage: `url(${trip.coverPhotoUrl || trip.stops[0]?.city.imageUrl || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"})` }} />
              <div className="grid gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black text-ink">{trip.name}</h2>
                    <p className="text-sm font-bold text-ink/60">
                      {trip.owner.name} - {formatDate(trip.startDate)} to {formatDate(trip.endDate)}
                    </p>
                  </div>
                  <span className="stamp">{daysBetweenInclusive(trip.startDate, trip.endDate)} days</span>
                </div>
                <p className="line-clamp-2 text-sm leading-6 text-ink/70">{trip.description || "A public route from the Traveloop community."}</p>
                <div className="flex flex-wrap gap-2 text-xs font-black text-ink/65">
                  {trip.stops.slice(0, 4).map((stop) => (
                    <span key={stop.id} className="border-2 border-ink/25 bg-paper px-2 py-1" style={{ borderRadius: 8 }}>
                      {stop.city.name}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm font-black">
                  <span>{money(total)}</span>
                  <span>{trip.likes.length} likes</span>
                  <span>{trip.comments.length} notes</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link className="btn-secondary" href={`/share/${trip.shareSlug}`}>View</Link>
                  {user ? (
                    <>
                      <form action={toggleLikeTripAction}>
                        <input name="tripId" type="hidden" value={trip.id} />
                        <button className={`btn-ghost ${liked ? "bg-coral text-white" : ""}`} type="submit" title="Like">
                          <Heart className="h-4 w-4" />
                        </button>
                      </form>
                      <form action={toggleSaveTripAction}>
                        <input name="tripId" type="hidden" value={trip.id} />
                        <button className={`btn-ghost ${saved ? "bg-ticket" : ""}`} type="submit" title="Save">
                          <Star className="h-4 w-4" />
                        </button>
                      </form>
                      <form action={copyPublicTripAction}>
                        <input name="tripId" type="hidden" value={trip.id} />
                        <button className="btn-primary" type="submit">
                          <CopyPlus className="h-4 w-4" />
                          Copy
                        </button>
                      </form>
                    </>
                  ) : (
                    <Link className="btn-primary" href="/login">Sign in to save/copy</Link>
                  )}
                </div>
                {user ? (
                  <div className="grid gap-2">
                    <form action={addCommunityCommentAction} className="grid gap-2">
                      <input name="tripId" type="hidden" value={trip.id} />
                      <div className="relative">
                        <MessageSquare className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink/40" />
                        <input className="input pl-9" name="body" placeholder="Add a quick note..." />
                      </div>
                    </form>
                    <form action={reportTripAction} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                      <input name="tripId" type="hidden" value={trip.id} />
                      <input className="input" name="reason" placeholder="Report this trip..." />
                      <button className="btn-ghost text-coral" type="submit">
                        <Flag className="h-4 w-4" />
                        Report
                      </button>
                    </form>
                  </div>
                ) : null}
                {trip.comments.length ? (
                  <div className="grid gap-2">
                    {trip.comments.map((comment) => (
                      <div key={comment.id} className="border-l-4 border-lagoon bg-paper px-3 py-2 text-xs leading-5 text-ink/70">
                        <p><span className="font-black text-ink">{comment.user.name}:</span> {comment.body}</p>
                        {user ? (
                          <form action={reportCommentAction} className="mt-2 flex gap-2">
                            <input name="commentId" type="hidden" value={comment.id} />
                            <input className="input min-h-8 py-1 text-xs" name="reason" placeholder="Report comment..." />
                            <button className="btn-ghost min-h-8 px-2 py-1 text-xs text-coral" type="submit">Report</button>
                          </form>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>

      {filteredTrips.length === 0 ? (
        <div className="sketch-panel p-8 text-center">
          <h2 className="text-2xl font-black">No public trips match that search</h2>
          <p className="mt-2 text-sm text-ink/65">Try a broader city or region, or publish one of your own itineraries.</p>
        </div>
      ) : null}
    </main>
  );
}
