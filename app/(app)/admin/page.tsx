import { Activity, BarChart3, Flag, Globe2, Map, MessageSquare, ShieldAlert, UsersRound } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { money, totalExpenseCost } from "@/lib/budget";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  await requireAdmin();
  const [
    userCount,
    tripCount,
    publicTripCount,
    pendingTripReports,
    pendingCommentReports,
    moderatedTripCount,
    hiddenCommentCount,
    cities,
    activities,
    expenses,
    recentComments,
    recentUsers,
    recentPublicTrips
  ] = await Promise.all([
    prisma.user.count(),
    prisma.trip.count(),
    prisma.trip.count({ where: { moderationStatus: "ACTIVE", OR: [{ visibility: "PUBLIC" }, { isPublic: true }] } }),
    prisma.tripReport.count({ where: { status: "PENDING" } }),
    prisma.commentReport.count({ where: { status: "PENDING" } }),
    prisma.trip.count({ where: { moderationStatus: { in: ["HIDDEN", "TAKEN_DOWN"] } } }),
    prisma.tripComment.count({ where: { moderationStatus: { in: ["HIDDEN", "TAKEN_DOWN"] } } }),
    prisma.city.findMany({ orderBy: [{ popularity: "desc" }], take: 5, include: { _count: { select: { stops: true } } } }),
    prisma.activity.findMany({ orderBy: [{ estimatedCost: "desc" }], take: 5, include: { city: true, _count: { select: { itinerary: true } } } }),
    prisma.tripExpense.findMany(),
    prisma.tripComment.findMany({ where: { moderationStatus: "ACTIVE" }, orderBy: { createdAt: "desc" }, take: 5, include: { user: true, trip: true } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.trip.findMany({
      where: { OR: [{ visibility: "PUBLIC" }, { isPublic: true }] },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { owner: true, _count: { select: { comments: true, reports: true } } }
    })
  ]);
  const pendingReports = pendingTripReports + pendingCommentReports;

  const cards = [
    { label: "Users", value: userCount, icon: UsersRound, tone: "bg-ticket text-ink" },
    { label: "Trips", value: tripCount, icon: Map, tone: "bg-lagoon text-white" },
    { label: "Public itineraries", value: publicTripCount, icon: Globe2, tone: "bg-coral text-white" },
    { label: "Pending reports", value: pendingReports, icon: Flag, tone: "bg-white text-ink" },
    { label: "Moderated trips", value: moderatedTripCount, icon: ShieldAlert, tone: "bg-ticket text-ink" },
    { label: "Hidden comments", value: hiddenCommentCount, icon: MessageSquare, tone: "bg-white text-ink" },
    { label: "Tracked budget", value: money(totalExpenseCost(expenses)), icon: BarChart3, tone: "bg-lagoon text-white" }
  ];

  return (
    <div className="grid gap-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Admin</p>
          <h1 className="text-4xl font-black text-ink">Platform control tower</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="btn-primary" href="/admin/moderation">
            <Flag className="h-4 w-4" />
            Moderation
          </Link>
          <Link className="btn-secondary" href="/admin/catalog">
            Manage Catalog
          </Link>
        </div>
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

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="sketch-panel grid gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black">Moderation queue</h2>
            <Link className="btn-ghost" href="/admin/moderation">Open</Link>
          </div>
          <p className="text-sm leading-6 text-ink/70">
            {pendingTripReports} trip reports and {pendingCommentReports} comment reports are waiting for review.
          </p>
          {recentPublicTrips.map((trip) => (
            <div key={trip.id} className="border-b-2 border-ink/10 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-black">{trip.name}</p>
                <span className="stamp">{trip.moderationStatus.toLowerCase().replace("_", " ")}</span>
              </div>
              <p className="text-sm text-ink/60">{trip.owner.name} - {trip._count.comments} comments - {trip._count.reports} reports</p>
            </div>
          ))}
        </div>

        <div className="sketch-panel grid gap-4 p-5">
          <h2 className="text-2xl font-black">Recent users</h2>
          {recentUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between gap-3 border-b-2 border-ink/10 pb-3">
              <div>
                <p className="font-black">{user.name}</p>
                <p className="text-sm text-ink/60">{user.email}</p>
              </div>
              <span className="stamp">{user.role.toLowerCase()}</span>
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
