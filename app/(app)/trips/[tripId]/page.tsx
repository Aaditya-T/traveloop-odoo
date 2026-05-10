import { CalendarDays, Globe2, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { CopyShareButton } from "@/components/copy-share-button";
import { SubmitButton } from "@/components/submit-button";
import { TripDetailsForm, type TripDetails } from "@/components/trip-details-form";
import { TripNotesPeek } from "@/components/trip-notes-peek";
import { TripNav } from "@/components/trip-nav";
import { deleteItineraryItemAction, publishTripAction, unpublishTripAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { money, totalActivityCost, totalExpenseCost } from "@/lib/budget";
import { formatDate, htmlDate } from "@/lib/date";
import { groupItineraryByDay } from "@/lib/itinerary";
import { prisma } from "@/lib/prisma";

export default async function TripPage({ params }: { params: Promise<{ tripId: string }> }) {
  const user = await requireUser();
  const { tripId } = await params;
  const trip = await prisma.trip.findUnique({
    where: { id: tripId, ownerId: user.id },
    include: {
      stops: {
        orderBy: { position: "asc" },
        include: {
          city: true,
          itinerary: { orderBy: [{ date: "asc" }, { startTime: "asc" }], include: { activity: true } }
        }
      },
      expenses: true,
      notes: {
        orderBy: { createdAt: "desc" },
        take: 4,
        include: { stop: { select: { city: { select: { name: true } } } } }
      }
    }
  });

  if (!trip) {
    return (
      <div className="sketch-panel p-8">
        <h1 className="text-3xl font-black">Trip not found</h1>
        <Link className="mt-4 inline-flex font-black text-coral underline" href="/trips">
          Back to trips
        </Link>
      </div>
    );
  }

  const days = groupItineraryByDay(trip.stops);
  const activityCost = totalActivityCost(trip.stops.flatMap((stop) => stop.itinerary));
  const totalCost = activityCost + totalExpenseCost(trip.expenses);
  const hasPublicLink = trip.visibility !== "PRIVATE" && trip.shareSlug;
  const shareUrl = hasPublicLink ? `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/share/${trip.shareSlug}` : null;

  const tripDetails: TripDetails = {
    id: trip.id,
    name: trip.name,
    startDateInput: htmlDate(trip.startDate),
    endDateInput: htmlDate(trip.endDate),
    budgetLimit: trip.budgetLimit,
    visibility: trip.visibility,
    coverPhotoUrl: trip.coverPhotoUrl,
    description: trip.description
  };

  return (
    <div className="grid gap-6">
      <section className="sketch-panel doodle-map overflow-hidden">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="stamp">trip dossier</div>
            <h1 className="mt-4 text-4xl font-black text-ink sm:text-6xl">{trip.name}</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-ink/70">{trip.description || "A route in progress, ready for more stops and stories."}</p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-black text-ink/70">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-coral" />
                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
              </span>
              <span>{trip.stops.length} stops</span>
              <span>{money(totalCost)} estimated</span>
            </div>
          </div>
          <div className="grid content-start gap-3">
            <TripNav tripId={trip.id} />
            <div className="flex flex-wrap gap-2">
              {shareUrl ? (
                <>
                  <Link className="btn-secondary" href={`/share/${trip.shareSlug}`}>
                    <Globe2 className="h-4 w-4" />
                    Share View
                  </Link>
                  <form action={unpublishTripAction}>
                    <input name="tripId" type="hidden" value={trip.id} />
                    <SubmitButton className="btn-ghost" pendingLabel="Updating…" type="submit">
                      Make private
                    </SubmitButton>
                  </form>
                </>
              ) : (
                <form action={publishTripAction}>
                  <input name="tripId" type="hidden" value={trip.id} />
                  <SubmitButton className="btn-secondary" pendingLabel="Publishing…" type="submit">
                    <Send className="h-4 w-4" />
                    Make Shareable
                  </SubmitButton>
                </form>
              )}
            </div>
            {shareUrl ? <CopyShareButton url={shareUrl} /> : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="grid gap-4">
          <TripNotesPeek
            notes={trip.notes.map((n) => ({
              id: n.id,
              title: n.title,
              body: n.body,
              stop: n.stop ? { city: { name: n.stop.city.name } } : null
            }))}
            tripId={trip.id}
          />
          <div>
            <p className="label">Itinerary view</p>
            <h2 className="text-3xl font-black text-ink">Day by day route</h2>
          </div>
          {days.length === 0 ? (
            <div className="sketch-panel p-8">
              <h3 className="text-2xl font-black">No stops yet</h3>
              <p className="mt-2 text-sm leading-6 text-ink/65">Add a city stop in the builder to start shaping the route.</p>
              <Link className="btn-primary mt-5" href={`/trips/${trip.id}/builder`}>
                Open Builder
              </Link>
            </div>
          ) : (
            <div className="route-line grid gap-4">
              {days.map((day, index) => (
                <article key={day.date.toISOString()} className="sketch-panel relative ml-10 bg-white p-5">
                  <span className="absolute -left-12 top-5 grid h-9 w-9 place-items-center border-2 border-ink bg-ticket text-sm font-black shadow-sketch" style={{ borderRadius: 999 }}>
                    {index + 1}
                  </span>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-2xl font-black text-ink">{formatDate(day.date)}</h3>
                    <span className="stamp">{day.stops.map(({ stop }) => stop.city.name).join(" + ")}</span>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {day.stops.map(({ stop, items }) => (
                      <div key={stop.id} className="border-l-4 border-lagoon pl-4">
                        <p className="font-black">{stop.city.name}, {stop.city.country}</p>
                        {items.length === 0 ? (
                          <p className="mt-1 text-sm text-ink/55">Open time for wandering.</p>
                        ) : (
                          <div className="mt-3 grid gap-2">
                            {items.map((item) => (
                              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-2 border-ink/20 bg-paper p-3" style={{ borderRadius: 8 }}>
                                <div>
                                  <p className="text-sm font-black text-coral">{item.startTime}</p>
                                  <p className="font-black text-ink">{item.activity.name}</p>
                                  <p className="text-sm text-ink/60">{item.activity.durationHours}h - {money(item.costOverride ?? item.activity.estimatedCost)}</p>
                                </div>
                                <form action={deleteItineraryItemAction}>
                                  <input name="tripId" type="hidden" value={trip.id} />
                                  <input name="itemId" type="hidden" value={item.id} />
                                  <button className="btn-ghost text-coral" type="submit" title="Remove activity">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </form>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <TripDetailsForm trip={tripDetails} />
      </section>
    </div>
  );
}
