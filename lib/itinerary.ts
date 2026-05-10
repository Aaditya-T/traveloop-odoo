import type { Activity, City, ItineraryItem, TripStop } from "@prisma/client";
import { enumerateDays } from "@/lib/date";

export type ItineraryItemWithActivity = ItineraryItem & {
  activity: Activity;
};

export type StopWithItems = TripStop & {
  city: City;
  itinerary: ItineraryItemWithActivity[];
};

export function groupItineraryByDay(stops: StopWithItems[]) {
  const days = new Map<string, { date: Date; stops: Array<{ stop: StopWithItems; items: ItineraryItemWithActivity[] }> }>();

  for (const stop of stops) {
    for (const day of enumerateDays(stop.startDate, stop.endDate)) {
      const key = day.toISOString().slice(0, 10);
      const existing = days.get(key) ?? { date: day, stops: [] };
      const items = stop.itinerary
        .filter((item) => item.date.toISOString().slice(0, 10) === key)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      existing.stops.push({ stop, items });
      days.set(key, existing);
    }
  }

  return Array.from(days.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}
