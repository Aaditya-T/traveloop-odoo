import { ActivityCategory, type City, type Prisma } from "@prisma/client";
import { ArrowDown, ArrowRight, ArrowUp, CalendarClock, CheckCircle2, CircleDollarSign, Filter, MapPin, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { TripNav } from "@/components/trip-nav";
import { addItineraryItemAction, addStopAction, deleteItineraryItemAction, deleteStopAction, moveStopAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { money, totalActivityCost } from "@/lib/budget";
import { formatDate, htmlDate } from "@/lib/date";
import { groupItineraryByDay } from "@/lib/itinerary";
import { prisma } from "@/lib/prisma";

const steps = [
  { key: "route", label: "Route Stops", hint: "Pick cities and dates" },
  { key: "activities", label: "Activities", hint: "Choose things to do" },
  { key: "schedule", label: "Schedule", hint: "Check each day" },
  { key: "review", label: "Review", hint: "Share or keep polishing" }
] as const;

type BuilderStep = (typeof steps)[number]["key"];
const categories = Object.values(ActivityCategory);

function currentStep(value?: string): BuilderStep {
  return steps.some((step) => step.key === value) ? (value as BuilderStep) : "route";
}

function nextStep(step: BuilderStep) {
  const index = steps.findIndex((item) => item.key === step);
  return steps[Math.min(index + 1, steps.length - 1)].key;
}

export default async function BuilderPage({
  params,
  searchParams
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ step?: string; city?: string; region?: string; activity?: string; category?: ActivityCategory }>;
}) {
  const user = await requireUser();
  const { tripId } = await params;
  const filters = await searchParams;
  const step = currentStep(filters.step);
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

  const itineraryItems = trip.stops.flatMap((stop) => stop.itinerary);
  const activityEstimate = totalActivityCost(itineraryItems);
  const days = groupItineraryByDay(trip.stops);
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
          filters.region ? { region: filters.region } : {},
          { isArchived: false }
        ]
      },
      orderBy: [{ isFeatured: "desc" }, { popularity: "desc" }, { name: "asc" }],
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
          trip.stops.length ? { cityId: { in: trip.stops.map((stop) => stop.cityId) } } : { id: "__no_stops_yet__" },
          { isArchived: false, city: { isArchived: false } }
        ]
      },
      include: { city: true },
      orderBy: [{ isFeatured: "desc" }, { estimatedCost: "asc" }],
      take: 12
    })
  ]);

  return (
    <div className="grid gap-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Guided itinerary builder</p>
          <h1 className="text-4xl font-black text-ink">{trip.name}</h1>
        </div>
        <TripNav tripId={trip.id} />
      </section>

      <section className="sketch-panel doodle-map grid gap-5 p-5" data-tour="builder-progress">
        <div className="grid gap-3 md:grid-cols-4">
          {steps.map((item, index) => {
            const active = item.key === step;
            const complete =
              (item.key === "route" && trip.stops.length > 0) ||
              (item.key === "activities" && itineraryItems.length > 0) ||
              (item.key === "schedule" && days.length > 0) ||
              item.key === "review";

            return (
              <Link
                key={item.key}
                className={`border-2 border-ink p-4 transition hover:-translate-y-0.5 ${active ? "bg-ticket shadow-sketch" : "bg-white/80"} `}
                href={`/trips/${trip.id}/builder?step=${item.key}`}
                style={{ borderRadius: 8 }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black uppercase">Step {index + 1}</span>
                  {complete ? <CheckCircle2 className="h-4 w-4 text-leaf" /> : null}
                </div>
                <p className="mt-2 text-lg font-black">{item.label}</p>
                <p className="text-xs font-bold text-ink/55">{item.hint}</p>
              </Link>
            );
          })}
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <Metric label="Stops" value={trip.stops.length} />
          <Metric label="Activities" value={itineraryItems.length} />
          <Metric label="Days planned" value={days.length} />
          <Metric label="Activity estimate" value={money(activityEstimate)} />
        </div>
      </section>

      {step === "route" ? <RouteStep trip={trip} cities={cities} filters={filters} /> : null}
      {step === "activities" ? <ActivitiesStep trip={trip} activities={activities} filters={filters} /> : null}
      {step === "schedule" ? <ScheduleStep trip={trip} days={days} /> : null}
      {step === "review" ? <ReviewStep trip={trip} activityEstimate={activityEstimate} /> : null}

      <div className="flex flex-wrap justify-between gap-3">
        <Link className="btn-ghost" href={`/trips/${trip.id}`}>
          Exit builder
        </Link>
        {step !== "review" ? (
          <Link className="btn-primary" href={`/trips/${trip.id}/builder?step=${nextStep(step)}`}>
            Continue
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link className="btn-primary" href={`/trips/${trip.id}`}>
            Open itinerary
          </Link>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-2 border-ink bg-white p-3" style={{ borderRadius: 8 }}>
      <p className="text-xs font-black uppercase text-ink/55">{label}</p>
      <p className="mt-1 text-2xl font-black text-ink">{value}</p>
    </div>
  );
}

type BuilderTrip = Prisma.TripGetPayload<{
  include: {
    stops: {
      include: {
        city: true;
        itinerary: {
          include: {
            activity: true;
          };
        };
      };
    };
  };
}>;

type ActivityWithCity = Prisma.ActivityGetPayload<{
  include: {
    city: true;
  };
}>;

function RouteStep({
  trip,
  cities,
  filters
}: {
  trip: BuilderTrip;
  cities: City[];
  filters: { city?: string; region?: string };
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]" data-tour="builder-route">
      <div className="sketch-panel grid content-start gap-4 p-5">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-coral" />
          <h2 className="text-2xl font-black">Your route</h2>
        </div>
        {trip.stops.length === 0 ? (
          <p className="text-sm leading-6 text-ink/65">Search for a city and add the first stop. Dates can be adjusted per stop.</p>
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
                  <StopControls tripId={trip.id} stopId={stop.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid content-start gap-4">
        <form className="sketch-panel doodle-map grid gap-4 p-5">
          <input name="step" type="hidden" value="route" />
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-coral" />
            <h2 className="text-2xl font-black">Find the next stop</h2>
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
        <div className="grid gap-3 md:grid-cols-2">
          {cities.map((city) => (
            <article key={city.id} className="sketch-panel overflow-hidden bg-white">
              <div className="h-28 border-b-2 border-ink bg-cover bg-center" style={{ backgroundImage: `url(${city.imageUrl})` }} />
              <div className="grid gap-3 p-4">
                <div>
                  <h3 className="text-xl font-black">{city.name}</h3>
                  <p className="text-sm font-bold text-ink/60">{city.country} - {city.region}</p>
                </div>
                <p className="line-clamp-2 text-sm leading-6 text-ink/70">{city.summary}</p>
                <form action={addStopAction} className="grid gap-3">
                  <input name="tripId" type="hidden" value={trip.id} />
                  <input name="cityId" type="hidden" value={city.id} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input className="input" name="startDate" type="date" defaultValue={htmlDate(trip.startDate)} />
                    <input className="input" name="endDate" type="date" defaultValue={htmlDate(trip.endDate)} />
                  </div>
                  <button className="btn-primary" type="submit">
                    <Plus className="h-4 w-4" />
                    Add stop
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StopControls({ tripId, stopId }: { tripId: string; stopId: string }) {
  return (
    <div className="flex gap-2">
      {[
        ["up", ArrowUp, "Move up"],
        ["down", ArrowDown, "Move down"]
      ].map(([direction, Icon, title]) => (
        <form key={String(direction)} action={moveStopAction}>
          <input name="tripId" type="hidden" value={tripId} />
          <input name="stopId" type="hidden" value={stopId} />
          <input name="direction" type="hidden" value={String(direction)} />
          <button className="btn-ghost" type="submit" title={String(title)}>
            <Icon className="h-4 w-4" />
          </button>
        </form>
      ))}
      <form action={deleteStopAction}>
        <input name="tripId" type="hidden" value={tripId} />
        <input name="stopId" type="hidden" value={stopId} />
        <button className="btn-ghost text-coral" type="submit" title="Remove stop">
          <Trash2 className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

function ActivitiesStep({
  trip,
  activities,
  filters
}: {
  trip: BuilderTrip;
  activities: ActivityWithCity[];
  filters: { activity?: string; category?: ActivityCategory };
}) {
  return (
    <section className="grid gap-5" data-tour="builder-activities">
      <form className="sketch-panel doodle-map grid gap-4 p-5">
        <input name="step" type="hidden" value="activities" />
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-coral" />
          <h2 className="text-2xl font-black">Pick activities for your stops</h2>
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

      {trip.stops.length === 0 ? (
        <div className="sketch-panel p-8 text-center">
          <h2 className="text-2xl font-black">Add a stop first</h2>
          <p className="mt-2 text-sm text-ink/65">Activities are filtered to the cities in your route so the list stays useful.</p>
          <Link className="btn-primary mt-5" href={`/trips/${trip.id}/builder?step=route`}>
            Add route stops
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {activities.map((activity) => {
            const matchingStop = trip.stops.find((stop) => stop.cityId === activity.cityId);

            return (
              <article key={activity.id} className="sketch-panel grid gap-4 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-black text-ink">{activity.name}</h3>
                    <p className="text-sm font-bold text-ink/60">
                      {activity.city.name} - {activity.category.toLowerCase()} - {money(activity.estimatedCost)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-ink/70">{activity.description}</p>
                  </div>
                  <span className="stamp">{activity.durationHours}h</span>
                </div>
                <form action={addItineraryItemAction} className="grid gap-3 lg:grid-cols-[1fr_0.8fr_0.7fr_auto]">
                  <input name="tripId" type="hidden" value={trip.id} />
                  <input name="activityId" type="hidden" value={activity.id} />
                  <select className="input" name="stopId" required defaultValue={matchingStop?.id ?? ""}>
                    <option value="">Choose stop</option>
                    {trip.stops.map((stop) => (
                      <option key={stop.id} value={stop.id}>
                        {stop.city.name}
                      </option>
                    ))}
                  </select>
                  <input className="input" name="date" type="date" defaultValue={htmlDate(matchingStop?.startDate ?? trip.startDate)} />
                  <input className="input" name="startTime" type="time" defaultValue="10:00" />
                  <button className="btn-primary" type="submit">
                    Add
                  </button>
                </form>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ScheduleStep({ trip, days }: { trip: BuilderTrip; days: ReturnType<typeof groupItineraryByDay> }) {
  return (
    <section className="grid gap-4" data-tour="builder-schedule">
      <div className="sketch-panel doodle-map p-5">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-coral" />
          <h2 className="text-2xl font-black">Schedule review</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-ink/65">Check whether each day has enough structure. You can remove activities here and add replacements from the Activities step.</p>
      </div>
      <div className="route-line grid gap-4">
        {days.map((day, index) => (
          <article key={day.date.toISOString()} className="sketch-panel relative ml-10 bg-white p-5">
            <span className="absolute -left-12 top-5 grid h-9 w-9 place-items-center border-2 border-ink bg-ticket text-sm font-black shadow-sketch" style={{ borderRadius: 999 }}>
              {index + 1}
            </span>
            <h3 className="text-2xl font-black">{formatDate(day.date)}</h3>
            <div className="mt-4 grid gap-3">
              {day.stops.map(({ stop, items }) => (
                <div key={stop.id} className="border-l-4 border-lagoon pl-4">
                  <p className="font-black">{stop.city.name}</p>
                  {items.length === 0 ? <p className="mt-1 text-sm text-ink/55">Open time for wandering.</p> : null}
                  <div className="mt-3 grid gap-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-2 border-ink/20 bg-paper p-3" style={{ borderRadius: 8 }}>
                        <div>
                          <p className="text-sm font-black text-coral">{item.startTime}</p>
                          <p className="font-black">{item.activity.name}</p>
                          <p className="text-sm text-ink/60">{money(item.costOverride ?? item.activity.estimatedCost)}</p>
                        </div>
                        <form action={deleteItineraryItemAction}>
                          <input name="tripId" type="hidden" value={trip.id} />
                          <input name="itemId" type="hidden" value={item.id} />
                          <button className="btn-ghost text-coral" type="submit">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
      {days.length === 0 ? (
        <div className="sketch-panel p-8 text-center">
          <h2 className="text-2xl font-black">No route days yet</h2>
          <Link className="btn-primary mt-5" href={`/trips/${trip.id}/builder?step=route`}>
            Add route stops
          </Link>
        </div>
      ) : null}
    </section>
  );
}

function ReviewStep({ trip, activityEstimate }: { trip: BuilderTrip; activityEstimate: number }) {
  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_0.85fr]" data-tour="builder-review">
      <div className="sketch-panel doodle-map grid content-start gap-4 p-6">
        <h2 className="text-3xl font-black">Ready to review</h2>
        <p className="text-sm leading-6 text-ink/70">
          Your route has {trip.stops.length} stops and {trip.stops.flatMap((stop) => stop.itinerary).length} scheduled activities. Activity estimates currently total {money(activityEstimate)}.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link className="btn-primary" href={`/trips/${trip.id}`}>
            Open itinerary
          </Link>
          <Link className="btn-secondary" href={`/trips/${trip.id}/budget`}>
            <CircleDollarSign className="h-4 w-4" />
            Budget
          </Link>
        </div>
      </div>
      <div className="sketch-panel grid content-start gap-3 p-5">
        <h3 className="text-2xl font-black">Route summary</h3>
        {trip.stops.map((stop, index) => (
          <div key={stop.id} className="border-b-2 border-ink/10 pb-3">
            <p className="font-black">{index + 1}. {stop.city.name}</p>
            <p className="text-sm text-ink/60">{formatDate(stop.startDate)} - {formatDate(stop.endDate)} - {stop.itinerary.length} activities</p>
          </div>
        ))}
      </div>
    </section>
  );
}
