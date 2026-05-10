/**
 * Traveloop database seed.
 *
 * Re-seeding deletes itinerary rows that point at each catalog city’s activities, then recreates
 * those activities. Trips that used catalog entries will lose those itinerary lines (dev-friendly).
 *
 * Env: this script is run with `tsx`, not Next.js—load `.env` / `.env.local` here so TRAVELOOP_*
 * and DATABASE_URL match what you use in `npm run dev`.
 */

import {
  PrismaClient,
  type ActivityCategory,
  type BudgetCategory,
  type ChecklistCategory
} from "@prisma/client";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { scryptSync } from "node:crypto";

const repoRoot = process.cwd();
loadEnv({ path: resolve(repoRoot, ".env") });
loadEnv({ path: resolve(repoRoot, ".env.local"), override: true });

const prisma = new PrismaClient();

const DEFAULT_SEED_IMG =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80";

/** Full HTTPS URL unchanged; relative paths use R2_PUBLIC_BASE_URL when set, else a neutral default. */
function seedMedia(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }
  const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  return base ? `${base}/${pathOrUrl.replace(/^\//, "")}` : DEFAULT_SEED_IMG;
}

type ActivityTuple =
  | readonly [string, ActivityCategory, string, number, number, string[]]
  | readonly [string, ActivityCategory, string, number, number, string[], string];

function activityImage(tuple: ActivityTuple, cityHero: string): string {
  const len = tuple.length;
  const override = len >= 7 ? tuple[6] : undefined;
  return override ? seedMedia(override as string) : cityHero;
}

function activityTupleParts(tuple: ActivityTuple): {
  name: string;
  category: ActivityCategory;
  description: string;
  durationHours: number;
  estimatedCost: number;
  tags: string[];
} {
  const [name, category, description, durationHours, estimatedCost, tags] = tuple;
  return { name, category, description, durationHours, estimatedCost, tags };
}

const cities = [
  {
    name: "Tokyo",
    country: "Japan",
    region: "Asia",
    costIndex: 4,
    popularity: 99,
    imageUrl: seedMedia(
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80"
    ),
    summary:
      "Neon crossings, quiet temples, tiny ramen counters, and a rhythm that rewards curious walkers.",
    activities: [
      [
        "Tsukiji breakfast crawl",
        "FOOD",
        "Taste tamagoyaki, tuna bowls, and matcha from market stalls.",
        3,
        45,
        ["food", "market"],
        "https://images.unsplash.com/photo-1580822185323-3c4c6c0b1b3b?auto=format&fit=crop&w=1200&q=80"
      ],
      [
        "Asakusa temple sketch walk",
        "CULTURE",
        "Follow lanterns, side streets, and Senso-ji details worth saving.",
        2,
        12,
        ["temple", "history"],
        "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80"
      ],
      [
        "Shibuya night loop",
        "NIGHTLIFE",
        "Cross the scramble, catch rooftop views, and map the glowing side lanes.",
        3,
        35,
        ["night", "views"]
      ]
    ] as ActivityTuple[]
  },
  {
    name: "Kyoto",
    country: "Japan",
    region: "Asia",
    costIndex: 3,
    popularity: 94,
    imageUrl: seedMedia(
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80"
    ),
    summary:
      "Shrines, gardens, tea houses, bamboo paths, and calm lanes that feel made for slow days.",
    activities: [
      [
        "Fushimi Inari sunrise",
        "CULTURE",
        "Walk through the vermilion gates before the crowds arrive.",
        3,
        8,
        ["shrine", "walk"]
      ],
      [
        "Arashiyama bamboo ride",
        "RELAX",
        "Pair the grove with a riverside pause and tiny sweet shops.",
        4,
        28,
        ["nature", "slow"],
        "https://images.unsplash.com/photo-1478436120817-70e3238653eb?auto=format&fit=crop&w=1200&q=80"
      ],
      ["Gion tasting evening", "FOOD", "Snack through lantern-lit lanes with tea, sweets, and small plates.", 3, 55, ["food", "culture"]]
    ] as ActivityTuple[]
  },
  {
    name: "Paris",
    country: "France",
    region: "Europe",
    costIndex: 4,
    popularity: 97,
    imageUrl: seedMedia("https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80"),
    summary:
      "Museum mornings, bakery detours, river walks, and neighborhoods that make every turn feel cinematic.",
    activities: [
      ["Louvre highlights sprint", "CULTURE", "A focused route through the big icons and quieter halls.", 3, 25, ["museum", "art"]],
      ["Left Bank picnic map", "FOOD", "Collect bread, cheese, fruit, and a river spot for golden hour.", 2, 32, ["food", "picnic"]],
      ["Montmartre sketch climb", "SIGHTSEEING", "Climb lanes, staircases, and viewpoints above the city.", 3, 10, ["views", "walk"]]
    ] as ActivityTuple[]
  },
  {
    name: "Barcelona",
    country: "Spain",
    region: "Europe",
    costIndex: 3,
    popularity: 91,
    imageUrl: seedMedia("https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80"),
    summary: "Gaudi curves, beach air, late dinners, tiled corners, and sunny routes between plazas.",
    activities: [
      [
        "Sagrada Familia deep dive",
        "CULTURE",
        "Study the basilica details and stained-glass color shifts.",
        2,
        34,
        ["architecture", "icon"],
        "https://images.unsplash.com/photo-1570168007204-dfb528d695d8?auto=format&fit=crop&w=1200&q=80"
      ],
      ["Tapas lane sampler", "FOOD", "Hop through vermouth, patatas bravas, and tucked-away bars.", 3, 48, ["food", "night"]],
      ["Bunkers sunset view", "SIGHTSEEING", "Catch the city grid rolling toward the sea.", 2, 6, ["sunset", "views"]]
    ] as ActivityTuple[]
  },
  {
    name: "Marrakesh",
    country: "Morocco",
    region: "Africa",
    costIndex: 2,
    popularity: 86,
    imageUrl: seedMedia("https://images.unsplash.com/photo-1548018560-c7196548e84d?auto=format&fit=crop&w=1200&q=80"),
    summary:
      "Colorful souks, courtyard stays, spice stalls, desert edges, and sensory-heavy wandering.",
    activities: [
      ["Medina souk trail", "SHOPPING", "Thread through rugs, lamps, spices, and artisan alleys.", 3, 30, ["market", "shopping"]],
      ["Tagine cooking class", "FOOD", "Shop ingredients and learn a slow, fragrant local meal.", 4, 62, ["food", "class"]],
      ["Majorelle garden pause", "RELAX", "Take a cool blue-green break from the medina pulse.", 2, 16, ["garden", "design"]]
    ] as ActivityTuple[]
  },
  {
    name: "Reykjavik",
    country: "Iceland",
    region: "Europe",
    costIndex: 5,
    popularity: 83,
    imageUrl: seedMedia("https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=1200&q=80"),
    summary:
      "A compact creative basecamp for hot springs, waterfalls, lava fields, and northern light chances.",
    activities: [
      [
        "Golden Circle day loop",
        "ADVENTURE",
        "Waterfalls, geysers, rift valleys, and big sky in one circuit.",
        8,
        115,
        ["nature", "drive"],
        "https://images.unsplash.com/photo-1504829857797-ddff29c27927?auto=format&fit=crop&w=1200&q=80"
      ],
      ["Harbor food walk", "FOOD", "Try seafood soup, bakery stops, and cozy local counters.", 2, 52, ["food", "harbor"]],
      ["Lava field soak", "RELAX", "Warm water, black rock, and a slow reset after exploring.", 3, 75, ["spa", "nature"]]
    ] as ActivityTuple[]
  },
  {
    name: "Cusco",
    country: "Peru",
    region: "South America",
    costIndex: 2,
    popularity: 88,
    imageUrl: seedMedia("https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1200&q=80"),
    summary:
      "Andean streets, archaeological layers, market breakfasts, and mountain routes with altitude drama.",
    activities: [
      ["San Pedro market breakfast", "FOOD", "Juices, soups, breads, and a bright start near the old center.", 2, 14, ["market", "food"]],
      ["Sacred Valley ruins", "CULTURE", "A full day tracing terraces, villages, and Inca engineering.", 7, 80, ["history", "daytrip"]],
      ["Rainbow Mountain trek", "ADVENTURE", "A high-altitude hike to striped ridges and vast views.", 10, 95, ["hike", "mountain"]]
    ] as ActivityTuple[]
  },
  {
    name: "Queenstown",
    country: "New Zealand",
    region: "Oceania",
    costIndex: 4,
    popularity: 85,
    imageUrl: seedMedia("https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=1200&q=80"),
    summary:
      "Lake views, mountain air, adventure days, scenic drives, and cozy evenings after big views.",
    activities: [
      ["Lake Wakatipu cruise", "RELAX", "Float through mountain views with an easy half-day pace.", 3, 58, ["lake", "views"]],
      ["Kawarau bridge jump", "ADVENTURE", "A classic adrenaline stop for the brave part of the group.", 2, 145, ["adventure", "icon"]],
      ["Fergburger picnic run", "FOOD", "Grab the famous burger and find a lakefront bench.", 1, 18, ["food", "casual"]]
    ] as ActivityTuple[]
  },
  {
    name: "New York",
    country: "United States",
    region: "North America",
    costIndex: 4,
    popularity: 96,
    imageUrl: seedMedia("https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80"),
    summary: "Broadway sparks, deli counters, skyline walks, museums, and late-night deli runs.",
    activities: [
      ["Brooklyn bridge sunrise", "SIGHTSEEING", "Golden hour arches, skyline selfies, cold coffee takeaway.", 2, 10, ["walk", "icon"]],
      ["West Village food crawl", "FOOD", "Pizza slices, oyster happy hour, pastry windows on quiet blocks.", 3, 72, ["food", "neighborhood"]],
      ["Broadway matinee sprint", "CULTURE", "Queue culture, marquee photos, velvet seats and big emotions.", 3, 165, ["theatre", "icon"]]
    ] as ActivityTuple[]
  },
  {
    name: "Vancouver",
    country: "Canada",
    region: "North America",
    costIndex: 3,
    popularity: 84,
    imageUrl: seedMedia("https://images.unsplash.com/photo-1559511260-8559d6e5d6c4?auto=format&fit=crop&w=1200&q=80"),
    summary: "Mountain-backed harbor, temperate rain forests, ramen rows, and easy Pacific air.",
    activities: [
      ["Stanley Park seawall spin", "RELAX", "Rent bikes or stroll the rim with lighthouse views.", 3, 18, ["nature", "bike"]],
      ["Granville Island tasting", "FOOD", "Oysters, cider, donut holes, and market browsing.", 2, 56, ["market", "food"]],
      ["Capilano bridge walk", "ADVENTURE", "Suspension bridges between evergreens north of downtown.", 3, 72, ["forest", "icon"]]
    ] as ActivityTuple[]
  },
  {
    name: "Mexico City",
    country: "Mexico",
    region: "North America",
    costIndex: 2,
    popularity: 90,
    imageUrl: seedMedia("https://images.unsplash.com/photo-1518659526055-fa7d4c937d4b?auto=format&fit=crop&w=1200&q=80"),
    summary: "High-altitude energy, mole depth, mural streets, and mercados that never sleep.",
    activities: [
      ["Historic center corridor", "CULTURE", "Zocalo, cathedral layers, and street music between plazas.", 3, 14, ["history", "walk"]],
      ["Roma Norte tacos late", "FOOD", "Mezcalerias, taco counters, bakery stops after dark.", 3, 38, ["food", "night"]],
      ["Xochimilco trajinera float", "RELAX", "Colorful canals, mariachi boats, coolers of snacks.", 4, 45, ["water", "culture"]]
    ] as ActivityTuple[]
  },
  {
    name: "Lisbon",
    country: "Portugal",
    region: "Europe",
    costIndex: 2,
    popularity: 89,
    imageUrl: seedMedia("https://images.unsplash.com/photo-1585208798174-6cedcd87e318?auto=format&fit=crop&w=1200&q=80"),
    summary: "Tram climbs, custard tints, tiled facades, and Atlantic light on seven hills.",
    activities: [
      ["Alfama fado eve", "CULTURE", "Stair climbs, viewpoints, velvet-voiced small rooms.", 3, 42, ["music", "history"]],
      ["Pastais de Belém run", "FOOD", "Queue for warm tarts, river breeze, monastery walls.", 2, 9, ["food", "icon"]],
      ["Cascais day rail", "SIGHTSEEING", "Ocean promenade breeze with ice cream pastel buildings.", 4, 24, ["beach", "daytrip"]]
    ] as ActivityTuple[]
  },
  {
    name: "Singapore",
    country: "Singapore",
    region: "Asia",
    costIndex: 4,
    popularity: 92,
    imageUrl: seedMedia("https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80"),
    summary: "Hawker brilliance, futuristic gardens, humidity polish, and clean metro hops.",
    activities: [
      ["Hawker center hop", "FOOD", "Laksa, carrot cake, chicken rice trays under neon fans.", 2, 22, ["food", "hawker"]],
      ["Cloud forest dome", "SIGHTSEEING", "Climate-controlled waterfalls and sky bridges.", 2, 40, ["gardens", "icon"]],
      ["Kampong Glam stroll", "CULTURE", "Sultan Mosque lanes, murals, spiced tea cafes.", 2, 14, ["heritage", "walk"]]
    ] as ActivityTuple[]
  },
  {
    name: "Bangkok",
    country: "Thailand",
    region: "Asia",
    costIndex: 2,
    popularity: 93,
    imageUrl: seedMedia("https://images.unsplash.com/photo-1508009603885-e7d4c93c4c6b?auto=format&fit=crop&w=1200&q=80"),
    summary: "Canal crossings, incense mornings, chilli balance, rooftop cocktails after tuk rides.",
    activities: [
      ["Wat Pho sunrise", "CULTURE", "Reclining gold, quieter courtyards, temple cats.", 2, 12, ["temple", "morning"]],
      ["Chinatown noodle alley", "FOOD", "Duck carts, oyster omelets, tiny plastic stools glow.", 2, 26, ["food", "street"]],
      ["Chao Phraya express", "RELAX", "Orange-flag ferries hopping old town with breeze.", 2, 15, ["river", "commute"]]
    ] as ActivityTuple[]
  },
  {
    name: "Dubai",
    country: "United Arab Emirates",
    region: "Middle East",
    costIndex: 4,
    popularity: 87,
    imageUrl: seedMedia("https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80"),
    summary: "Desert metropolis, skyline drama, spicy mall food courts, creek contrast.",
    activities: [
      ["Old Dubai abra glide", "CULTURE", "Spice sacks, creek abras, textiles and gold glimpses.", 2, 8, ["heritage", "water"]],
      ["Desert dusk safari", "ADVENTURE", "Dunes, barbecue camp, astronomy if skies stay clear.", 5, 95, ["desert", "icon"]],
      ["JBR marina walk", "NIGHTLIFE", "Skyline glow, smoothies, barefoot sand sections.", 2, 38, ["beach", "night"]]
    ] as ActivityTuple[]
  },
  {
    name: "Cape Town",
    country: "South Africa",
    region: "Africa",
    costIndex: 3,
    popularity: 89,
    imageUrl: seedMedia("https://images.unsplash.com/photo-1580060839134-75a309edba60?auto=format&fit=crop&w=1200&q=80"),
    summary: "Table Mountain shadow, vineyard day trips, harbour seals, windy perfection.",
    activities: [
      ["Table Mountain rotating view", "SIGHTSEEING", "Cable spin, fynbos air, cape-wide panoramas.", 3, 35, ["mountain", "icon"]],
      ["Woodstock murals & coffee", "CULTURE", "Street galleries, Ethiopian pour-overs, design shops.", 2, 24, ["art", "cafe"]],
      ["Simonstown penguin beach", "RELAX", "Boulders swims with awkward tuxedo birds.", 4, 18, ["wildlife", "beach"]]
    ] as ActivityTuple[]
  }
] satisfies Array<{
  name: string;
  country: string;
  region: string;
  costIndex: number;
  popularity: number;
  imageUrl: string;
  summary: string;
  activities: ActivityTuple[];
}>;

const DEMO_ACCOUNTS = [
  {
    email: "traveller@example.com",
    name: "Mira Okada",
    bio: "Urban sketcher swapping metro maps for ramen counters.",
    homeCity: "Osaka",
    homeCountry: "Japan",
    photoUrl: seedMedia("https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80")
  },
  {
    email: "mira.chang@traveloop.demo",
    name: "Mira Chang",
    bio: "Product designer hunting golden-hour rooftops.",
    homeCity: "Singapore",
    homeCountry: "Singapore",
    photoUrl: seedMedia("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80")
  },
  {
    email: "jules.renard@traveloop.demo",
    name: "Jules Renard",
    bio: "Slow trains, pastry detours, one museum sprint per trip.",
    homeCity: "Lyon",
    homeCountry: "France",
    photoUrl: seedMedia("https://images.unsplash.com/photo-1539578705168-3c5c4c4c8c73?auto=format&fit=crop&w=400&q=80")
  },
  {
    email: "sam.diaz@traveloop.demo",
    name: "Sam Diaz",
    bio: "Hostel breakfasts and sunrise hikes—I pack light.",
    homeCity: "Mexico City",
    homeCountry: "Mexico",
    photoUrl: seedMedia("https://images.unsplash.com/photo-1599566150163-3eafd3bdc7c9?auto=format&fit=crop&w=400&q=80")
  },
  {
    email: "nina.patel@traveloop.demo",
    name: "Nina Patel",
    bio: "Points hacker building long weekends everywhere.",
    homeCity: "Toronto",
    homeCountry: "Canada",
    photoUrl: seedMedia("https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80")
  },
  {
    email: "omar.haddad@traveloop.demo",
    name: "Omar Haddad",
    bio: "Desert campfires and third-wave espresso in equal measure.",
    homeCity: "Dubai",
    homeCountry: "United Arab Emirates",
    photoUrl: seedMedia("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80")
  },
  {
    email: "zoe.mbatha@traveloop.demo",
    name: "Zoe Mbatha",
    bio: "Wildlife nerd. Always binoculars adjacent.",
    homeCity: "Cape Town",
    homeCountry: "South Africa",
    photoUrl: seedMedia("https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80")
  },
  {
    email: "alex.volkov@traveloop.demo",
    name: "Alex Volkov",
    bio: "Chasing glaciers and hot pools with a GoPro soaked half the time.",
    homeCity: "Reykjavik",
    homeCountry: "Iceland",
    photoUrl: seedMedia("https://images.unsplash.com/photo-1500648767791-00dcc99495ef?auto=format&fit=crop&w=400&q=80")
  }
] satisfies Array<{
  email: string;
  name: string;
  bio: string;
  homeCity: string;
  homeCountry: string;
  photoUrl: string;
}>;

function hashPassword(password: string) {
  const salt = "traveloop-seed-salt";
  const hash = scryptSync(password, salt, 64).toString("base64url");
  return `${salt}:${hash}`;
}

async function requireActivity(country: string, cityName: string, activityName: string) {
  const row = await prisma.activity.findFirst({
    where: { name: activityName, city: { name: cityName, country } }
  });
  if (!row) {
    throw new Error(`Seed missing activity "${activityName}" in ${cityName}, ${country}`);
  }
  return row;
}

async function seedShowcase(cityRecords: Map<string, string>) {
  const password = process.env.TRAVELOOP_SHOWCASE_PASSWORD!;
  const hash = hashPassword(password);

  const userByEmail = new Map<string, string>();
  for (const acc of DEMO_ACCOUNTS) {
    const email = acc.email.toLowerCase();
    const row = await prisma.user.upsert({
      where: { email },
      update: {
        name: acc.name,
        bio: acc.bio,
        homeCity: acc.homeCity,
        homeCountry: acc.homeCountry,
        photoUrl: acc.photoUrl,
        passwordHash: hash,
        hasCompletedOnboarding: true
      },
      create: {
        name: acc.name,
        email,
        passwordHash: hash,
        bio: acc.bio,
        homeCity: acc.homeCity,
        homeCountry: acc.homeCountry,
        photoUrl: acc.photoUrl,
        hasCompletedOnboarding: true
      }
    });
    userByEmail.set(email, row.id);
  }

  await prisma.trip.deleteMany({
    where: { ownerId: { in: [...userByEmail.values()] } }
  });

  const japanTokyoKyotoBook = async () => {
    const ownerId = userByEmail.get("traveller@example.com")!;
    const tokyo = await prisma.city.findUniqueOrThrow({ where: { name_country: { name: "Tokyo", country: "Japan" } } });
    const kyoto = await prisma.city.findUniqueOrThrow({ where: { name_country: { name: "Kyoto", country: "Japan" } } });
    const t0 = await requireActivity("Japan", "Tokyo", "Asakusa temple sketch walk");
    const t1 = await requireActivity("Japan", "Tokyo", "Tsukiji breakfast crawl");
    const k0 = await requireActivity("Japan", "Kyoto", "Fushimi Inari sunrise");
    const k1 = await requireActivity("Japan", "Kyoto", "Arashiyama bamboo ride");
    await prisma.trip.create({
      data: {
        ownerId,
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
                  { activityId: t1.id, date: new Date("2026-06-12T00:00:00.000Z"), startTime: "09:00" },
                  { activityId: t0.id, date: new Date("2026-06-13T00:00:00.000Z"), startTime: "11:00" }
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
                  { activityId: k0.id, date: new Date("2026-06-15T00:00:00.000Z"), startTime: "07:30" },
                  { activityId: k1.id, date: new Date("2026-06-16T00:00:00.000Z"), startTime: "10:00" }
                ]
              }
            }
          ]
        },
        expenses: {
          create: [
            {
              category: "TRANSPORT" satisfies BudgetCategory,
              label: "Rail pass estimate",
              amount: 340,
              vendor: "Rail operator",
              quantity: 1,
              unitCost: 340,
              paidStatus: "PARTIAL",
              date: new Date("2026-06-12T00:00:00.000Z")
            },
            {
              category: "STAY" satisfies BudgetCategory,
              label: "Hotels and ryokan",
              amount: 780,
              vendor: "Lodging",
              quantity: 6,
              unitCost: 130,
              paidStatus: "UNPAID",
              date: new Date("2026-06-12T00:00:00.000Z")
            },
            {
              category: "MEALS" satisfies BudgetCategory,
              label: "Daily food cushion",
              amount: 360,
              vendor: "Various",
              quantity: 6,
              unitCost: 60,
              paidStatus: "UNPAID",
              date: new Date("2026-06-12T00:00:00.000Z")
            }
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
  };

  const europeRiviera = async () => {
    const ownerId = userByEmail.get("jules.renard@traveloop.demo")!;
    const p0 = await requireActivity("France", "Paris", "Louvre highlights sprint");
    const p1 = await requireActivity("France", "Paris", "Left Bank picnic map");
    const b0 = await requireActivity("Spain", "Barcelona", "Tapas lane sampler");
    const b1 = await requireActivity("Spain", "Barcelona", "Bunkers sunset view");
    const parisCity = await prisma.city.findUniqueOrThrow({
      where: { name_country: { name: "Paris", country: "France" } }
    });
    await prisma.trip.create({
      data: {
        ownerId,
        name: "Paris–Barcelona art week",
        description: "Museum mornings in Paris then Gaudi tiles and bunker sunsets on the Mediterranean.",
        startDate: new Date("2026-07-04T00:00:00.000Z"),
        endDate: new Date("2026-07-11T00:00:00.000Z"),
        coverPhotoUrl: parisCity.imageUrl,
        budgetLimit: 2400,
        isPublic: true,
        visibility: "PUBLIC",
        shareSlug: "paris-barcelona-art-week",
        stops: {
          create: [
            {
              cityId: cityRecords.get("Paris")!,
              position: 1,
              startDate: new Date("2026-07-04T00:00:00.000Z"),
              endDate: new Date("2026-07-07T00:00:00.000Z"),
              itinerary: {
                create: [
                  { activityId: p0.id, date: new Date("2026-07-04T00:00:00.000Z"), startTime: "10:00" },
                  { activityId: p1.id, date: new Date("2026-07-05T00:00:00.000Z"), startTime: "18:00" }
                ]
              }
            },
            {
              cityId: cityRecords.get("Barcelona")!,
              position: 2,
              startDate: new Date("2026-07-08T00:00:00.000Z"),
              endDate: new Date("2026-07-11T00:00:00.000Z"),
              itinerary: {
                create: [
                  { activityId: b0.id, date: new Date("2026-07-08T00:00:00.000Z"), startTime: "20:00" },
                  { activityId: b1.id, date: new Date("2026-07-09T00:00:00.000Z"), startTime: "19:30" }
                ]
              }
            }
          ]
        },
        expenses: {
          create: [
            {
              category: "TRANSPORT" satisfies BudgetCategory,
              label: "Paris–BCN trains",
              amount: 155,
              vendor: "Rail",
              paidStatus: "PAID",
              date: new Date("2026-07-06T00:00:00.000Z")
            },
            {
              category: "STAY" satisfies BudgetCategory,
              label: "Central stays",
              amount: 910,
              quantity: 7,
              unitCost: 130,
              paidStatus: "PARTIAL",
              date: new Date("2026-07-04T00:00:00.000Z")
            }
          ]
        },
        checklistItems: {
          create: [
            { title: "Museum reservations", category: "DOCUMENTS" satisfies ChecklistCategory },
            { title: "Comfortable flats", category: "CLOTHING" satisfies ChecklistCategory }
          ]
        },
        notes: {
          create: [
            {
              title: "Museum blackout dates",
              body: "Check Louvre closures before locking tickets."
            }
          ]
        }
      }
    });
  };

  const icelandBlitz = async () => {
    const ownerId = userByEmail.get("alex.volkov@traveloop.demo")!;
    const a0 = await requireActivity("Iceland", "Reykjavik", "Golden Circle day loop");
    const a1 = await requireActivity("Iceland", "Reykjavik", "Harbor food walk");
    const a2 = await requireActivity("Iceland", "Reykjavik", "Lava field soak");
    const rvk = await prisma.city.findUniqueOrThrow({
      where: { name_country: { name: "Reykjavik", country: "Iceland" } }
    });
    await prisma.trip.create({
      data: {
        ownerId,
        name: "Reykjavik steam and sky",
        description: "Go big outside the capital, thaw in milky blues, harbor snacks between.",
        startDate: new Date("2026-11-07T00:00:00.000Z"),
        endDate: new Date("2026-11-12T00:00:00.000Z"),
        coverPhotoUrl: rvk.imageUrl,
        budgetLimit: 2200,
        isPublic: true,
        visibility: "PUBLIC",
        shareSlug: "reykjavik-steam-and-sky",
        stops: {
          create: [
            {
              cityId: cityRecords.get("Reykjavik")!,
              position: 1,
              startDate: new Date("2026-11-07T00:00:00.000Z"),
              endDate: new Date("2026-11-12T00:00:00.000Z"),
              itinerary: {
                create: [
                  { activityId: a1.id, date: new Date("2026-11-07T00:00:00.000Z"), startTime: "12:30" },
                  { activityId: a0.id, date: new Date("2026-11-09T00:00:00.000Z"), startTime: "08:00" },
                  { activityId: a2.id, date: new Date("2026-11-11T00:00:00.000Z"), startTime: "15:00" }
                ]
              }
            }
          ]
        },
        expenses: {
          create: [
            {
              category: "ACTIVITIES" satisfies BudgetCategory,
              label: "Guided geothermal bundle",
              amount: 285,
              paidStatus: "PARTIAL"
            },
            {
              category: "BUFFER" satisfies BudgetCategory,
              label: "Weather flex pot",
              amount: 240,
              paidStatus: "UNPAID"
            }
          ]
        },
        checklistItems: {
          create: [
            { title: "Thermal base layers", category: "CLOTHING" satisfies ChecklistCategory },
            { title: "Waterproof shell", category: "CLOTHING" satisfies ChecklistCategory },
            { title: "Driving license photocopy", category: "DOCUMENTS" satisfies ChecklistCategory }
          ]
        },
        notes: {
          create: [{ title: "Aurora window", body: "Check cloud cover app nightly after 21:00." }]
        }
      }
    });
  };

  const andeanAnchors = async () => {
    const ownerId = userByEmail.get("sam.diaz@traveloop.demo")!;
    const c0 = await requireActivity("Peru", "Cusco", "San Pedro market breakfast");
    const c1 = await requireActivity("Peru", "Cusco", "Sacred Valley ruins");
    const c2 = await requireActivity("Peru", "Cusco", "Rainbow Mountain trek");
    const cusco = await prisma.city.findUniqueOrThrow({
      where: { name_country: { name: "Cusco", country: "Peru" } }
    });
    await prisma.trip.create({
      data: {
        ownerId,
        name: "Altitude classroom in Cusco",
        description: "Market fuel, terraces, high strips of color—with enough buffer for tea leaves.",
        startDate: new Date("2026-08-02T00:00:00.000Z"),
        endDate: new Date("2026-08-09T00:00:00.000Z"),
        coverPhotoUrl: cusco.imageUrl,
        budgetLimit: 1600,
        isPublic: true,
        visibility: "PUBLIC",
        shareSlug: "cusco-altitude-classroom",
        stops: {
          create: [
            {
              cityId: cityRecords.get("Cusco")!,
              position: 1,
              startDate: new Date("2026-08-02T00:00:00.000Z"),
              endDate: new Date("2026-08-09T00:00:00.000Z"),
              itinerary: {
                create: [
                  { activityId: c0.id, date: new Date("2026-08-02T00:00:00.000Z"), startTime: "07:45" },
                  { activityId: c1.id, date: new Date("2026-08-05T00:00:00.000Z"), startTime: "06:45" },
                  { activityId: c2.id, date: new Date("2026-08-07T00:00:00.000Z"), startTime: "05:15" }
                ]
              }
            }
          ]
        },
        expenses: {
          create: [
            {
              category: "ACTIVITIES" satisfies BudgetCategory,
              label: "Guided Sacred Valley bundle",
              amount: 260,
              paidStatus: "UNPAID"
            },
            { category: "BUFFER" satisfies BudgetCategory, label: "Coca candies + electrolytes", amount: 28 },
            {
              category: "STAY" satisfies BudgetCategory,
              label: "Courtyard Airbnb block",
              amount: 486,
              quantity: 6,
              unitCost: 81
            }
          ]
        }
      }
    });
  };

  const nzSouthernAir = async () => {
    const ownerId = userByEmail.get("nina.patel@traveloop.demo")!;
    const q0 = await requireActivity("New Zealand", "Queenstown", "Lake Wakatipu cruise");
    const q1 = await requireActivity("New Zealand", "Queenstown", "Kawarau bridge jump");
    const q2 = await requireActivity("New Zealand", "Queenstown", "Fergburger picnic run");
    const qt = await prisma.city.findUniqueOrThrow({
      where: { name_country: { name: "Queenstown", country: "New Zealand" } }
    });
    await prisma.trip.create({
      data: {
        ownerId,
        name: "Queenstown lake dopamine loop",
        description: "Cruise days, adrenaline receipts, burgers on the grass—south island shorthand.",
        startDate: new Date("2027-02-03T00:00:00.000Z"),
        endDate: new Date("2027-02-08T00:00:00.000Z"),
        coverPhotoUrl: qt.imageUrl,
        budgetLimit: 2700,
        isPublic: true,
        visibility: "PUBLIC",
        shareSlug: "queenstown-dopamine-loop",
        stops: {
          create: [
            {
              cityId: cityRecords.get("Queenstown")!,
              position: 1,
              startDate: new Date("2027-02-03T00:00:00.000Z"),
              endDate: new Date("2027-02-08T00:00:00.000Z"),
              itinerary: {
                create: [
                  { activityId: q2.id, date: new Date("2027-02-03T00:00:00.000Z"), startTime: "12:45" },
                  { activityId: q0.id, date: new Date("2027-02-05T00:00:00.000Z"), startTime: "10:00" },
                  { activityId: q1.id, date: new Date("2027-02-06T00:00:00.000Z"), startTime: "11:00" }
                ]
              }
            }
          ]
        },
        expenses: {
          create: [
            {
              category: "ACTIVITIES" satisfies BudgetCategory,
              label: "Adventure pass split",
              amount: 320,
              paidStatus: "PARTIAL"
            },
            { category: "MEALS" satisfies BudgetCategory, label: "Lakefront picnic kit", amount: 84 }
          ]
        },
        notes: {
          create: [
            {
              title: "Sunscreen discipline",
              body: "Alpine burn is real even when the lake looks cool."
            }
          ]
        }
      }
    });
  };

  const northAmericaArc = async () => {
    const ownerId = userByEmail.get("nina.patel@traveloop.demo")!;
    const n0 = await requireActivity("United States", "New York", "Brooklyn bridge sunrise");
    const n1 = await requireActivity("United States", "New York", "West Village food crawl");
    const v0 = await requireActivity("Canada", "Vancouver", "Stanley Park seawall spin");
    const v1 = await requireActivity("Canada", "Vancouver", "Granville Island tasting");
    const x0 = await requireActivity("Mexico", "Mexico City", "Historic center corridor");
    const x1 = await requireActivity("Mexico", "Mexico City", "Roma Norte tacos late");
    const nyc = await prisma.city.findUniqueOrThrow({
      where: { name_country: { name: "New York", country: "United States" } }
    });
    await prisma.trip.create({
      data: {
        ownerId,
        name: "NYC to CDMX via Pacific air",
        description: "Harbor bike plus tasting in Vancouver bridges coasts before CDMX heat.",
        startDate: new Date("2026-10-18T00:00:00.000Z"),
        endDate: new Date("2026-10-30T00:00:00.000Z"),
        coverPhotoUrl: nyc.imageUrl,
        budgetLimit: 3200,
        isPublic: true,
        visibility: "PUBLIC",
        shareSlug: "nyc-vancouver-cdmx-arc",
        stops: {
          create: [
            {
              cityId: cityRecords.get("New York")!,
              position: 1,
              startDate: new Date("2026-10-18T00:00:00.000Z"),
              endDate: new Date("2026-10-21T00:00:00.000Z"),
              itinerary: {
                create: [
                  { activityId: n0.id, date: new Date("2026-10-18T00:00:00.000Z"), startTime: "06:15" },
                  { activityId: n1.id, date: new Date("2026-10-19T00:00:00.000Z"), startTime: "19:00" }
                ]
              }
            },
            {
              cityId: cityRecords.get("Vancouver")!,
              position: 2,
              startDate: new Date("2026-10-22T00:00:00.000Z"),
              endDate: new Date("2026-10-25T00:00:00.000Z"),
              itinerary: {
                create: [
                  { activityId: v0.id, date: new Date("2026-10-22T00:00:00.000Z"), startTime: "09:30" },
                  { activityId: v1.id, date: new Date("2026-10-23T00:00:00.000Z"), startTime: "12:00" }
                ]
              }
            },
            {
              cityId: cityRecords.get("Mexico City")!,
              position: 3,
              startDate: new Date("2026-10-26T00:00:00.000Z"),
              endDate: new Date("2026-10-30T00:00:00.000Z"),
              itinerary: {
                create: [
                  { activityId: x0.id, date: new Date("2026-10-26T00:00:00.000Z"), startTime: "10:00" },
                  { activityId: x1.id, date: new Date("2026-10-27T00:00:00.000Z"), startTime: "21:30" }
                ]
              }
            }
          ]
        },
        expenses: {
          create: [
            {
              category: "TRANSPORT" satisfies BudgetCategory,
              label: "Cross-continent flights",
              amount: 890,
              paidStatus: "PARTIAL"
            },
            {
              category: "STAY" satisfies BudgetCategory,
              label: "Mixed stays across three cities",
              amount: 1380,
              quantity: 12,
              unitCost: 115
            }
          ]
        },
        checklistItems: {
          create: [
            { title: "Two currencies + card", category: "DOCUMENTS" satisfies ChecklistCategory },
            { title: "Layered carry-on", category: "CLOTHING" satisfies ChecklistCategory }
          ]
        }
      }
    });
  };

  const southeastAsiaLoop = async () => {
    const ownerId = userByEmail.get("mira.chang@traveloop.demo")!;
    const s0 = await requireActivity("Singapore", "Singapore", "Hawker center hop");
    const s1 = await requireActivity("Singapore", "Singapore", "Cloud forest dome");
    const t0 = await requireActivity("Thailand", "Bangkok", "Wat Pho sunrise");
    const t1 = await requireActivity("Thailand", "Bangkok", "Chinatown noodle alley");
    const sg = await prisma.city.findUniqueOrThrow({
      where: { name_country: { name: "Singapore", country: "Singapore" } }
    });
    await prisma.trip.create({
      data: {
        ownerId,
        name: "Heat index: hawker to river",
        description: "Chili precision in Singapore, temple calm and noodles in Bangkok.",
        startDate: new Date("2026-12-02T00:00:00.000Z"),
        endDate: new Date("2026-12-09T00:00:00.000Z"),
        coverPhotoUrl: sg.imageUrl,
        budgetLimit: 1500,
        isPublic: true,
        visibility: "PUBLIC",
        shareSlug: "hawker-river-sprint",
        stops: {
          create: [
            {
              cityId: cityRecords.get("Singapore")!,
              position: 1,
              startDate: new Date("2026-12-02T00:00:00.000Z"),
              endDate: new Date("2026-12-05T00:00:00.000Z"),
              itinerary: {
                create: [
                  { activityId: s0.id, date: new Date("2026-12-02T00:00:00.000Z"), startTime: "12:30" },
                  { activityId: s1.id, date: new Date("2026-12-03T00:00:00.000Z"), startTime: "15:00" }
                ]
              }
            },
            {
              cityId: cityRecords.get("Bangkok")!,
              position: 2,
              startDate: new Date("2026-12-06T00:00:00.000Z"),
              endDate: new Date("2026-12-09T00:00:00.000Z"),
              itinerary: {
                create: [
                  { activityId: t0.id, date: new Date("2026-12-06T00:00:00.000Z"), startTime: "06:00" },
                  { activityId: t1.id, date: new Date("2026-12-07T00:00:00.000Z"), startTime: "20:00" }
                ]
              }
            }
          ]
        },
        expenses: {
          create: [
            {
              category: "TRANSPORT" satisfies BudgetCategory,
              label: "SIN–BKK hop",
              amount: 140,
              paidStatus: "PAID"
            },
            {
              category: "MEALS" satisfies BudgetCategory,
              label: "Street food envelope",
              amount: 210
            }
          ]
        },
        notes: {
          create: [
            {
              title: "SIM cards",
              body: "Grab data at Changi arrivals; True counter in Bangkok if needed."
            }
          ]
        }
      }
    });
  };

  const dubaiLongWeekend = async () => {
    const ownerId = userByEmail.get("omar.haddad@traveloop.demo")!;
    const d0 = await requireActivity("United Arab Emirates", "Dubai", "Old Dubai abra glide");
    const d1 = await requireActivity("United Arab Emirates", "Dubai", "Desert dusk safari");
    const d2 = await requireActivity("United Arab Emirates", "Dubai", "JBR marina walk");
    const db = await prisma.city.findUniqueOrThrow({
      where: { name_country: { name: "Dubai", country: "United Arab Emirates" } }
    });
    await prisma.trip.create({
      data: {
        ownerId,
        name: "Dubai contrast long weekend",
        description: "Creek abras, dunes, marina glow—compression fit for sponsor decks.",
        startDate: new Date("2026-05-21T00:00:00.000Z"),
        endDate: new Date("2026-05-25T00:00:00.000Z"),
        coverPhotoUrl: db.imageUrl,
        budgetLimit: 1100,
        isPublic: true,
        visibility: "PUBLIC",
        shareSlug: "dubai-contrast-weekend",
        stops: {
          create: [
            {
              cityId: cityRecords.get("Dubai")!,
              position: 1,
              startDate: new Date("2026-05-21T00:00:00.000Z"),
              endDate: new Date("2026-05-25T00:00:00.000Z"),
              itinerary: {
                create: [
                  { activityId: d0.id, date: new Date("2026-05-21T00:00:00.000Z"), startTime: "16:00" },
                  { activityId: d1.id, date: new Date("2026-05-22T00:00:00.000Z"), startTime: "15:30" },
                  { activityId: d2.id, date: new Date("2026-05-24T00:00:00.000Z"), startTime: "20:00" }
                ]
              }
            }
          ]
        },
        expenses: {
          create: [
            {
              category: "ACTIVITIES" satisfies BudgetCategory,
              label: "Safari package",
              amount: 195,
              paidStatus: "PAID"
            },
            { category: "SHOPPING" satisfies BudgetCategory, label: "Spice gifts", amount: 75 }
          ]
        }
      }
    });
  };

  await japanTokyoKyotoBook();
  await europeRiviera();
  await icelandBlitz();
  await andeanAnchors();
  await nzSouthernAir();
  await northAmericaArc();
  await southeastAsiaLoop();
  await dubaiLongWeekend();

  const seededTrips = await prisma.trip.findMany({
    where: {
      visibility: "PUBLIC",
      shareSlug: { not: null },
      ownerId: { in: [...userByEmail.values()] }
    },
    select: { id: true, ownerId: true, shareSlug: true }
  });

  type SlugSpec = {
    slug: string;
    commentPairs: readonly { email: string; body: string }[];
    likeEmails: readonly string[];
    saveEmails?: readonly string[];
  };

  const socialBySlug: readonly SlugSpec[] = [
    {
      slug: "tokyo-kyoto-sketchbook",
      commentPairs: [
        { email: "jules.renard@traveloop.demo", body: "Day three ramen counter recs incoming—DM me." },
        { email: "mira.chang@traveloop.demo", body: "Would extend Kyoto one rainy rest day." }
      ],
      likeEmails: [
        "jules.renard@traveloop.demo",
        "sam.diaz@traveloop.demo",
        "nina.patel@traveloop.demo",
        "omar.haddad@traveloop.demo",
        "alex.volkov@traveloop.demo",
        "zoe.mbatha@traveloop.demo",
        "mira.chang@traveloop.demo"
      ],
      saveEmails: ["nina.patel@traveloop.demo", "mira.chang@traveloop.demo"]
    },
    {
      slug: "paris-barcelona-art-week",
      commentPairs: [
        { email: "traveller@example.com", body: "Louvre path is tight—love the picnic night idea." },
        { email: "omar.haddad@traveloop.demo", body: "Swap bunkers for Barceloneta if wind is low." }
      ],
      likeEmails: [
        "traveller@example.com",
        "mira.chang@traveloop.demo",
        "sam.diaz@traveloop.demo",
        "nina.patel@traveloop.demo",
        "zoe.mbatha@traveloop.demo"
      ],
      saveEmails: ["traveller@example.com", "alex.volkov@traveloop.demo"]
    },
    {
      slug: "reykjavik-steam-and-sky",
      commentPairs: [
        { email: "nina.patel@traveloop.demo", body: "Pack microspikes if early November swings icy." },
        { email: "mira.chang@traveloop.demo", body: "Harbor soup stop is underrated vs fine dining splurge." }
      ],
      likeEmails: [
        "traveller@example.com",
        "omar.haddad@traveloop.demo",
        "sam.diaz@traveloop.demo",
        "zoe.mbatha@traveloop.demo",
        "jules.renard@traveloop.demo"
      ],
      saveEmails: ["omar.haddad@traveloop.demo"]
    },
    {
      slug: "cusco-altitude-classroom",
      commentPairs: [
        { email: "alex.volkov@traveloop.demo", body: "Rainbow day needs an earlier van—trust." },
        { email: "nina.patel@traveloop.demo", body: "Market breakfast is the jet-lag reset button." }
      ],
      likeEmails: [
        "mira.chang@traveloop.demo",
        "jules.renard@traveloop.demo",
        "zoe.mbatha@traveloop.demo",
        "omar.haddad@traveloop.demo"
      ]
    },
    {
      slug: "queenstown-dopamine-loop",
      commentPairs: [
        { email: "sam.diaz@traveloop.demo", body: "Bridge slot books out—standby list still works." },
        { email: "traveller@example.com", body: "Ferg run first day beats the dinner queue chaos." }
      ],
      likeEmails: [
        "traveller@example.com",
        "mira.chang@traveloop.demo",
        "jules.renard@traveloop.demo",
        "omar.haddad@traveloop.demo",
        "alex.volkov@traveloop.demo"
      ],
      saveEmails: ["sam.diaz@traveloop.demo", "mira.chang@traveloop.demo"]
    },
    {
      slug: "nyc-vancouver-cdmx-arc",
      commentPairs: [
        { email: "zoe.mbatha@traveloop.demo", body: "Vancouver buffer day saved us from red-eye brain." },
        { email: "jules.renard@traveloop.demo", body: "CDMX altitude still sneaks up after sea level." }
      ],
      likeEmails: [
        "traveller@example.com",
        "mira.chang@traveloop.demo",
        "sam.diaz@traveloop.demo",
        "omar.haddad@traveloop.demo",
        "alex.volkov@traveloop.demo",
        "zoe.mbatha@traveloop.demo"
      ]
    },
    {
      slug: "hawker-river-sprint",
      commentPairs: [
        { email: "nina.patel@traveloop.demo", body: "Cloud forest slot + hawker same day is doable if you hydrate hard." },
        { email: "jules.renard@traveloop.demo", body: "River express beats gridlock taxis every time." }
      ],
      likeEmails: [
        "traveller@example.com",
        "sam.diaz@traveloop.demo",
        "zoe.mbatha@traveloop.demo",
        "omar.haddad@traveloop.demo"
      ]
    },
    {
      slug: "dubai-contrast-weekend",
      commentPairs: [
        { email: "alex.volkov@traveloop.demo", body: "Abras are cash—coins still king at smaller docks." },
        { email: "zoe.mbatha@traveloop.demo", body: "Safari pickups run late Friday—budget buffer dinner." }
      ],
      likeEmails: [
        "traveller@example.com",
        "mira.chang@traveloop.demo",
        "nina.patel@traveloop.demo",
        "sam.diaz@traveloop.demo"
      ]
    },
  ];

  for (const spec of socialBySlug) {
    const tripRow = seededTrips.find((t) => t.shareSlug === spec.slug);
    if (!tripRow) {
      throw new Error(`Missing trip for social seed: ${spec.slug}`);
    }
    await prisma.tripComment.createMany({
      data: spec.commentPairs.map((c) => ({
        tripId: tripRow.id,
        userId: userByEmail.get(c.email.toLowerCase())!,
        body: c.body
      }))
    });
    await prisma.tripLike.createMany({
      data: spec.likeEmails.map((email) => ({
        tripId: tripRow.id,
        userId: userByEmail.get(email.toLowerCase())!
      })),
      skipDuplicates: true
    });
    if (spec.saveEmails?.length) {
      await prisma.tripSave.createMany({
        data: spec.saveEmails.map((email) => ({
          tripId: tripRow.id,
          userId: userByEmail.get(email.toLowerCase())!
        })),
        skipDuplicates: true
      });
    }
  }

  console.log(
    `Showcase: ${DEMO_ACCOUNTS.length} demo users, ${seededTrips.length} public trips, likes/saves/comments applied.`
  );
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

    await prisma.itineraryItem.deleteMany({ where: { activity: { cityId: record.id } } });
    await prisma.activity.deleteMany({ where: { cityId: record.id } });
    await prisma.activity.createMany({
      data: city.activities.map((tuple) => {
        const { name, category, description, durationHours, estimatedCost, tags } = activityTupleParts(tuple);
        return {
          cityId: record.id,
          name,
          category,
          description,
          durationHours,
          estimatedCost,
          tags,
          imageUrl: activityImage(tuple, city.imageUrl),
          isFeatured: estimatedCost <= 50
        };
      })
    });
    cityRecords.set(city.name, record.id);
  }

  const rawAdminEmail = process.env.TRAVELOOP_ADMIN_EMAIL;
  const adminEmail = rawAdminEmail ? rawAdminEmail.trim().toLowerCase() : undefined;
  const adminPassword = process.env.TRAVELOOP_ADMIN_PASSWORD?.trim();

  if (adminEmail && adminPassword) {
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        role: "ADMIN",
        passwordHash: hashPassword(adminPassword)
      },
      create: {
        name: process.env.TRAVELOOP_ADMIN_NAME?.trim() || "Traveloop Admin",
        email: adminEmail,
        role: "ADMIN",
        passwordHash: hashPassword(adminPassword)
      }
    });
    console.log(`Admin user upserted: ${adminEmail}`);
  } else {
    console.log(
      "Skipping admin seed: set TRAVELOOP_ADMIN_EMAIL and TRAVELOOP_ADMIN_PASSWORD in .env or .env.local (plain values, no quotes needed)."
    );
    if (process.env.TRAVELOOP_ADMIN_EMAIL && !adminPassword) {
      console.log("Tip: TRAVELOOP_ADMIN_PASSWORD is missing or empty—admin block was skipped.");
    }
  }

  if (process.env.TRAVELOOP_SEED_SHOWCASE === "true" && process.env.TRAVELOOP_SHOWCASE_PASSWORD) {
    await seedShowcase(cityRecords);
  }

  const activityCount = cities.reduce((n, c) => n + c.activities.length, 0);
  console.log(`Loaded ${cities.length} cities and ${activityCount} activities.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
