import { CalendarDays, Compass, Globe2 } from "lucide-react";
import Link from "next/link";
import { money, totalActivityCost, totalExpenseCost } from "@/lib/budget";
import { formatDate } from "@/lib/date";
import { groupItineraryByDay } from "@/lib/itinerary";
import { prisma } from "@/lib/prisma";

export default async function PublicSharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const trip = await prisma.trip.findFirst({
    where: { shareSlug: slug, OR: [{ visibility: "PUBLIC" }, { visibility: "UNLISTED" }, { isPublic: true }] },
    include: {
      owner: { select: { name: true } },
      stops: {
        orderBy: { position: "asc" },
        include: {
          city: true,
          itinerary: { orderBy: [{ date: "asc" }, { startTime: "asc" }], include: { activity: true } }
        }
      },
      expenses: true
    }
  });

  if (!trip) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <div className="sketch-panel p-8 text-center">
          <Compass className="mx-auto h-12 w-12 text-coral" />
          <h1 className="mt-4 text-3xl font-black">This itinerary is not public</h1>
          <Link className="btn-primary mt-5" href="/login">
            Open Traveloop
          </Link>
        </div>
      </main>
    );
  }

  const days = groupItineraryByDay(trip.stops);
  const total = totalActivityCost(trip.stops.flatMap((stop) => stop.itinerary)) + totalExpenseCost(trip.expenses);

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl gap-6 px-4 py-8">
      <section className="sketch-panel doodle-map p-6">
        <div className="stamp">public itinerary</div>
        <h1 className="mt-4 text-5xl font-black leading-tight text-ink">{trip.name}</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-ink/70">{trip.description}</p>
        <div className="mt-5 flex flex-wrap gap-4 text-sm font-black text-ink/70">
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-coral" />
            {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
          </span>
          <span className="inline-flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-lagoon" />
            Shared by {trip.owner.name}
          </span>
          <span>{money(total)} estimate</span>
        </div>
      </section>

      <section className="route-line grid gap-4">
        {days.map((day, index) => (
          <article key={day.date.toISOString()} className="sketch-panel relative ml-10 bg-white p-5">
            <span className="absolute -left-12 top-5 grid h-9 w-9 place-items-center border-2 border-ink bg-ticket text-sm font-black shadow-sketch" style={{ borderRadius: 999 }}>
              {index + 1}
            </span>
            <h2 className="text-2xl font-black">{formatDate(day.date)}</h2>
            <div className="mt-4 grid gap-4">
              {day.stops.map(({ stop, items }) => (
                <div key={stop.id} className="border-l-4 border-coral pl-4">
                  <h3 className="font-black">{stop.city.name}, {stop.city.country}</h3>
                  <p className="mt-1 text-sm text-ink/60">{stop.city.summary}</p>
                  <div className="mt-3 grid gap-2">
                    {items.map((item) => (
                      <div key={item.id} className="border-2 border-ink/20 bg-paper p-3" style={{ borderRadius: 8 }}>
                        <p className="text-sm font-black text-coral">{item.startTime}</p>
                        <p className="font-black">{item.activity.name}</p>
                        <p className="text-sm text-ink/60">{item.activity.description}</p>
                      </div>
                    ))}
                    {items.length === 0 ? <p className="text-sm text-ink/55">Open time.</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
