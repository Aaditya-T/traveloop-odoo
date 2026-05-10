import { Activity, BarChart3, Globe2, Map, UsersRound } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { money, totalExpenseCost } from "@/lib/budget";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  await requireAdmin();
  const [userCount, tripCount, publicTripCount, cities, activities, expenses, recentComments] = await Promise.all([
    prisma.user.count(),
    prisma.trip.count(),
    prisma.trip.count({ where: { visibility: "PUBLIC" } }),
    prisma.city.findMany({ orderBy: [{ popularity: "desc" }], take: 5, include: { _count: { select: { stops: true } } } }),
    prisma.activity.findMany({ orderBy: [{ estimatedCost: "desc" }], take: 5, include: { city: true, _count: { select: { itinerary: true } } } }),
    prisma.tripExpense.findMany(),
    prisma.tripComment.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { user: true, trip: true } })
  ]);

  const cards = [
    { label: "Users", value: userCount, icon: UsersRound, tone: "bg-ticket text-ink" },
    { label: "Trips", value: tripCount, icon: Map, tone: "bg-lagoon text-white" },
    { label: "Public itineraries", value: publicTripCount, icon: Globe2, tone: "bg-coral text-white" },
    { label: "Tracked budget", value: money(totalExpenseCost(expenses)), icon: BarChart3, tone: "bg-white text-ink" }
  ];

  return (
    <div className="grid gap-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Admin</p>
          <h1 className="text-4xl font-black text-ink">Platform control tower</h1>
        </div>
        <Link className="btn-primary" href="/admin/catalog">
          Manage Catalog
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className={`sketch-panel p-5 ${card.tone}`}>
              <Icon className="h-6 w-6" />
              <p className="mt-4 text-sm font-black uppercase">{card.label}</p>
              <p className="mt-2 text-4xl font-black">{card.value}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="sketch-panel grid gap-4 p-5">
          <h2 className="text-2xl font-black">Top cities</h2>
          {cities.map((city) => (
            <div key={city.id} className="flex items-center justify-between gap-3 border-b-2 border-ink/10 pb-3">
              <div>
                <p className="font-black">{city.name}, {city.country}</p>
                <p className="text-sm text-ink/60">{city.region} - {city._count.stops} trip stops</p>
              </div>
              <span className="stamp">{city.popularity}</span>
            </div>
          ))}
        </div>
        <div className="sketch-panel grid gap-4 p-5">
          <h2 className="text-2xl font-black">Top activities</h2>
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between gap-3 border-b-2 border-ink/10 pb-3">
              <div>
                <p className="font-black">{activity.name}</p>
                <p className="text-sm text-ink/60">{activity.city.name} - {activity._count.itinerary} itinerary pins</p>
              </div>
              <Activity className="h-5 w-5 text-coral" />
            </div>
          ))}
        </div>
      </section>

      <section className="sketch-panel grid gap-4 p-5">
        <h2 className="text-2xl font-black">Recent community activity</h2>
        {recentComments.map((comment) => (
          <p key={comment.id} className="text-sm leading-6 text-ink/70">
            <span className="font-black text-ink">{comment.user.name}</span> commented on <span className="font-black text-ink">{comment.trip.name}</span>: {comment.body}
          </p>
        ))}
        {recentComments.length === 0 ? <p className="text-sm text-ink/60">Community comments will appear here as travellers engage with public itineraries.</p> : null}
      </section>
    </div>
  );
}
