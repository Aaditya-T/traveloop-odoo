import { describe, expect, it } from "vitest";
import { averagePerDay, budgetByCategory, totalActivityCost, totalExpenseCost } from "@/lib/budget";
import { daysBetweenInclusive, enumerateDays } from "@/lib/date";
import { groupItineraryByDay, type StopWithItems } from "@/lib/itinerary";

describe("date helpers", () => {
  it("counts inclusive travel days", () => {
    expect(daysBetweenInclusive(new Date("2026-06-01T00:00:00Z"), new Date("2026-06-05T00:00:00Z"))).toBe(5);
    expect(enumerateDays(new Date("2026-06-01T00:00:00Z"), new Date("2026-06-03T00:00:00Z"))).toHaveLength(3);
  });
});

describe("budget helpers", () => {
  it("combines manual and activity costs by category", () => {
    const expenses = [
      { category: "TRANSPORT" as const, amount: 300 },
      { category: "MEALS" as const, amount: 90 }
    ];
    const activities = [
      { costOverride: null, activity: { estimatedCost: 45 } },
      { costOverride: 80, activity: { estimatedCost: 60 } }
    ];

    expect(totalExpenseCost(expenses)).toBe(390);
    expect(totalActivityCost(activities)).toBe(125);
    expect(budgetByCategory(expenses, 125).get("ACTIVITIES")).toBe(125);
    expect(averagePerDay(515, new Date("2026-06-01T00:00:00Z"), new Date("2026-06-05T00:00:00Z"))).toBe(103);
  });
});

describe("itinerary grouping", () => {
  it("creates day buckets with sorted activities", () => {
    const stop = {
      id: "stop_1",
      tripId: "trip_1",
      cityId: "city_1",
      position: 1,
      startDate: new Date("2026-06-01T00:00:00Z"),
      endDate: new Date("2026-06-02T00:00:00Z"),
      notes: null,
      city: {
        id: "city_1",
        name: "Tokyo",
        country: "Japan",
        region: "Asia",
        costIndex: 4,
        popularity: 98,
        imageUrl: "",
        summary: ""
      },
      itinerary: [
        {
          id: "item_2",
          stopId: "stop_1",
          activityId: "activity_2",
          date: new Date("2026-06-01T00:00:00Z"),
          startTime: "14:00",
          costOverride: null,
          notes: null,
          activity: {
            id: "activity_2",
            cityId: "city_1",
            name: "Ramen crawl",
            category: "FOOD",
            description: "",
            durationHours: 2,
            estimatedCost: 35,
            imageUrl: "",
            tags: []
          }
        },
        {
          id: "item_1",
          stopId: "stop_1",
          activityId: "activity_1",
          date: new Date("2026-06-01T00:00:00Z"),
          startTime: "09:00",
          costOverride: null,
          notes: null,
          activity: {
            id: "activity_1",
            cityId: "city_1",
            name: "Temple walk",
            category: "CULTURE",
            description: "",
            durationHours: 3,
            estimatedCost: 15,
            imageUrl: "",
            tags: []
          }
        }
      ]
    } satisfies StopWithItems;

    const days = groupItineraryByDay([stop]);
    expect(days).toHaveLength(2);
    expect(days[0].stops[0].items.map((item) => item.startTime)).toEqual(["09:00", "14:00"]);
    expect(days[1].stops[0].items).toHaveLength(0);
  });
});
