import { PrismaClient, type ActivityCategory, type BudgetCategory, type ChecklistCategory } from "@prisma/client";
import { scryptSync } from "node:crypto";

const prisma = new PrismaClient();

const cities = [
  {
    name: "Tokyo",
    country: "Japan",
    region: "Asia",
    costIndex: 4,
    popularity: 99,
    imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
    summary: "Neon crossings, quiet temples, tiny ramen counters, and a rhythm that rewards curious walkers.",
    activities: [
      ["Tsukiji breakfast crawl", "FOOD", "Taste tamagoyaki, tuna bowls, and matcha from market stalls.", 3, 45, ["food", "market"]],
      ["Asakusa temple sketch walk", "CULTURE", "Follow lanterns, side streets, and Senso-ji details worth saving.", 2, 12, ["temple", "history"]],
      ["Shibuya night loop", "NIGHTLIFE", "Cross the scramble, catch rooftop views, and map the glowing side lanes.", 3, 35, ["night", "views"]]
    ]
  },
  {
    name: "Kyoto",
    country: "Japan",
    region: "Asia",
    costIndex: 3,
    popularity: 94,
    imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
    summary: "Shrines, gardens, tea houses, bamboo paths, and calm lanes that feel made for slow days.",
    activities: [
      ["Fushimi Inari sunrise", "CULTURE", "Walk through the vermilion gates before the crowds arrive.", 3, 8, ["shrine", "walk"]],
      ["Arashiyama bamboo ride", "RELAX", "Pair the grove with a riverside pause and tiny sweet shops.", 4, 28, ["nature", "slow"]],
      ["Gion tasting evening", "FOOD", "Snack through lantern-lit lanes with tea, sweets, and small plates.", 3, 55, ["food", "culture"]]
    ]
  },
  {
    name: "Paris",
    country: "France",
    region: "Europe",
    costIndex: 4,
    popularity: 97,
    imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
    summary: "Museum mornings, bakery detours, river walks, and neighborhoods that make every turn feel cinematic.",
    activities: [
      ["Louvre highlights sprint", "CULTURE", "A focused route through the big icons and quieter halls.", 3, 25, ["museum", "art"]],
      ["Left Bank picnic map", "FOOD", "Collect bread, cheese, fruit, and a river spot for golden hour.", 2, 32, ["food", "picnic"]],
      ["Montmartre sketch climb", "SIGHTSEEING", "Climb lanes, staircases, and viewpoints above the city.", 3, 10, ["views", "walk"]]
    ]
  },
  {
    name: "Barcelona",
    country: "Spain",
    region: "Europe",
    costIndex: 3,
    popularity: 91,
    imageUrl: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80",
    summary: "Gaudi curves, beach air, late dinners, tiled corners, and sunny routes between plazas.",
    activities: [
      ["Sagrada Familia deep dive", "CULTURE", "Study the basilica details and stained-glass color shifts.", 2, 34, ["architecture", "icon"]],
      ["Tapas lane sampler", "FOOD", "Hop through vermouth, patatas bravas, and tucked-away bars.", 3, 48, ["food", "night"]],
      ["Bunkers sunset view", "SIGHTSEEING", "Catch the city grid rolling toward the sea.", 2, 6, ["sunset", "views"]]
    ]
  },
  {
    name: "Marrakesh",
    country: "Morocco",
    region: "Africa",
    costIndex: 2,
    popularity: 86,
    imageUrl: "https://images.unsplash.com/photo-1548018560-c7196548e84d?auto=format&fit=crop&w=1200&q=80",
    summary: "Colorful souks, courtyard stays, spice stalls, desert edges, and sensory-heavy wandering.",
    activities: [
      ["Medina souk trail", "SHOPPING", "Thread through rugs, lamps, spices, and artisan alleys.", 3, 30, ["market", "shopping"]],
      ["Tagine cooking class", "FOOD", "Shop ingredients and learn a slow, fragrant local meal.", 4, 62, ["food", "class"]],
      ["Majorelle garden pause", "RELAX", "Take a cool blue-green break from the medina pulse.", 2, 16, ["garden", "design"]]
    ]
  },
  {
    name: "Reykjavik",
    country: "Iceland",
    region: "Europe",
    costIndex: 5,
    popularity: 83,
    imageUrl: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=1200&q=80",
    summary: "A compact creative basecamp for hot springs, waterfalls, lava fields, and northern light chances.",
    activities: [
      ["Golden Circle day loop", "ADVENTURE", "Waterfalls, geysers, rift valleys, and big sky in one circuit.", 8, 115, ["nature", "drive"]],
      ["Harbor food walk", "FOOD", "Try seafood soup, bakery stops, and cozy local counters.", 2, 52, ["food", "harbor"]],
      ["Lava field soak", "RELAX", "Warm water, black rock, and a slow reset after exploring.", 3, 75, ["spa", "nature"]]
    ]
  },
  {
    name: "Cusco",
    country: "Peru",
    region: "South America",
    costIndex: 2,
    popularity: 88,
    imageUrl: "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1200&q=80",
    summary: "Andean streets, archaeological layers, market breakfasts, and mountain routes with altitude drama.",
    activities: [
      ["San Pedro market breakfast", "FOOD", "Juices, soups, breads, and a bright start near the old center.", 2, 14, ["market", "food"]],
      ["Sacred Valley ruins", "CULTURE", "A full day tracing terraces, villages, and Inca engineering.", 7, 80, ["history", "daytrip"]],
      ["Rainbow Mountain trek", "ADVENTURE", "A high-altitude hike to striped ridges and vast views.", 10, 95, ["hike", "mountain"]]
    ]
  },
  {
    name: "Queenstown",
    country: "New Zealand",
    region: "Oceania",
    costIndex: 4,
    popularity: 85,
    imageUrl: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=1200&q=80",
    summary: "Lake views, mountain air, adventure days, scenic drives, and cozy evenings after big views.",
    activities: [
      ["Lake Wakatipu cruise", "RELAX", "Float through mountain views with an easy half-day pace.", 3, 58, ["lake", "views"]],
      ["Kawarau bridge jump", "ADVENTURE", "A classic adrenaline stop for the brave part of the group.", 2, 145, ["adventure", "icon"]],
      ["Fergburger picnic run", "FOOD", "Grab the famous burger and find a lakefront bench.", 1, 18, ["food", "casual"]]
    ]
  }
] satisfies Array<{
  name: string;
  country: string;
  region: string;
  costIndex: number;
  popularity: number;
  imageUrl: string;
  summary: string;
  activities: Array<[string, ActivityCategory, string, number, number, string[]]>;
}>;

function hashPassword(password: string) {
  const salt = "traveloop-seed-salt";
  const hash = scryptSync(password, salt, 64).toString("base64url");
  return `${salt}:${hash}`;
}

async function main() {
  const cityRecords = new Map<string, string>();

  for (const city of cities) {
    const record = await prisma.city.upsert({
      where: { name_country: { name: city.name, country: city.country } },
      update: {
        region: city.region,
        costIndex: city.costIndex,
        popularity: city.popularity,
        imageUrl: city.imageUrl,
        summary: city.summary,
        isFeatured: city.popularity >= 90,
        isArchived: false
      },
      create: {
        name: city.name,
        country: city.country,
        region: city.region,
        costIndex: city.costIndex,
        popularity: city.popularity,
        imageUrl: city.imageUrl,
        summary: city.summary,
        isFeatured: city.popularity >= 90
      }
    });

    await prisma.activity.deleteMany({ where: { cityId: record.id } });
    await prisma.activity.createMany({
      data: city.activities.map(([name, category, description, durationHours, estimatedCost, tags]) => ({
        cityId: record.id,
        name,
        category,
        description,
        durationHours,
        estimatedCost,
        tags,
        imageUrl: city.imageUrl,
        isFeatured: estimatedCost <= 50
      }))
    });
    cityRecords.set(city.name, record.id);
  }

  if (process.env.TRAVELOOP_ADMIN_EMAIL && process.env.TRAVELOOP_ADMIN_PASSWORD) {
    await prisma.user.upsert({
      where: { email: process.env.TRAVELOOP_ADMIN_EMAIL.toLowerCase() },
      update: {
        role: "ADMIN",
        passwordHash: hashPassword(process.env.TRAVELOOP_ADMIN_PASSWORD)
      },
      create: {
        name: process.env.TRAVELOOP_ADMIN_NAME ?? "Traveloop Admin",
        email: process.env.TRAVELOOP_ADMIN_EMAIL.toLowerCase(),
        role: "ADMIN",
        passwordHash: hashPassword(process.env.TRAVELOOP_ADMIN_PASSWORD)
      }
    });
  }

  if (process.env.TRAVELOOP_SEED_SHOWCASE === "true" && process.env.TRAVELOOP_SHOWCASE_PASSWORD) {
    const sampleUser = await prisma.user.upsert({
      where: { email: "traveller@example.com" },
      update: {
        name: "Sample Traveller",
        passwordHash: hashPassword(process.env.TRAVELOOP_SHOWCASE_PASSWORD)
      },
      create: {
        name: "Sample Traveller",
        email: "traveller@example.com",
        passwordHash: hashPassword(process.env.TRAVELOOP_SHOWCASE_PASSWORD)
      }
    });

    await prisma.trip.deleteMany({
      where: {
        ownerId: sampleUser.id,
        name: "Tokyo to Kyoto Sketchbook"
      }
    });

    const tokyo = await prisma.city.findUniqueOrThrow({ where: { name_country: { name: "Tokyo", country: "Japan" } } });
    const kyoto = await prisma.city.findUniqueOrThrow({ where: { name_country: { name: "Kyoto", country: "Japan" } } });
    const tokyoActivities = await prisma.activity.findMany({ where: { cityId: tokyo.id }, orderBy: { estimatedCost: "asc" } });
    const kyotoActivities = await prisma.activity.findMany({ where: { cityId: kyoto.id }, orderBy: { estimatedCost: "asc" } });

    await prisma.trip.create({
      data: {
        ownerId: sampleUser.id,
        name: "Tokyo to Kyoto Sketchbook",
        description: "Food counters, temple mornings, rail days, and a calm Kyoto finish.",
        startDate: new Date("2026-06-12T00:00:00.000Z"),
        endDate: new Date("2026-06-18T00:00:00.000Z"),
        coverPhotoUrl: tokyo.imageUrl,
        budgetLimit: 1800,
        isPublic: true,
        visibility: "PUBLIC",
        shareSlug: "tokyo-kyoto-sketchbook",
        stops: {
          create: [
            {
              cityId: cityRecords.get("Tokyo")!,
              position: 1,
              startDate: new Date("2026-06-12T00:00:00.000Z"),
              endDate: new Date("2026-06-14T00:00:00.000Z"),
              itinerary: {
                create: [
                  { activityId: tokyoActivities[0].id, date: new Date("2026-06-12T00:00:00.000Z"), startTime: "09:00" },
                  { activityId: tokyoActivities[1].id, date: new Date("2026-06-13T00:00:00.000Z"), startTime: "11:00" }
                ]
              }
            },
            {
              cityId: cityRecords.get("Kyoto")!,
              position: 2,
              startDate: new Date("2026-06-15T00:00:00.000Z"),
              endDate: new Date("2026-06-18T00:00:00.000Z"),
              itinerary: {
                create: [
                  { activityId: kyotoActivities[0].id, date: new Date("2026-06-15T00:00:00.000Z"), startTime: "07:30" },
                  { activityId: kyotoActivities[1].id, date: new Date("2026-06-16T00:00:00.000Z"), startTime: "10:00" }
                ]
              }
            }
          ]
        },
        expenses: {
          create: [
            { category: "TRANSPORT" satisfies BudgetCategory, label: "Rail pass estimate", amount: 340, vendor: "Rail operator", quantity: 1, unitCost: 340, paidStatus: "PARTIAL", date: new Date("2026-06-12T00:00:00.000Z") },
            { category: "STAY" satisfies BudgetCategory, label: "Hotels and ryokan", amount: 780, vendor: "Lodging", quantity: 6, unitCost: 130, paidStatus: "UNPAID", date: new Date("2026-06-12T00:00:00.000Z") },
            { category: "MEALS" satisfies BudgetCategory, label: "Daily food cushion", amount: 360, vendor: "Various", quantity: 6, unitCost: 60, paidStatus: "UNPAID", date: new Date("2026-06-12T00:00:00.000Z") }
          ]
        },
        checklistItems: {
          create: [
            { title: "Passport", category: "DOCUMENTS" satisfies ChecklistCategory, isPacked: true },
            { title: "Universal adapter", category: "ELECTRONICS" satisfies ChecklistCategory },
            { title: "Light rain jacket", category: "CLOTHING" satisfies ChecklistCategory },
            { title: "Transit card", category: "MISC" satisfies ChecklistCategory }
          ]
        },
        notes: {
          create: [
            {
              title: "Hotel check-in",
              body: "Keep reservation details and late arrival notes here.",
              createdAt: new Date("2026-05-10T00:00:00.000Z")
            }
          ]
        }
      }
    });
  }

  console.log(`Loaded ${cities.length} cities and ${cities.length * 3} activities.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
