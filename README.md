# Traveloop

Traveloop is a playful travel planning platform for building multi-city itineraries, budgets, notes, packing lists, public inspiration pages, and community-discoverable trips.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- Prisma with Postgres
- Neon Postgres for team sync, local Postgres by swapping `DATABASE_URL`
- Cookie-based credentials auth using Node `scrypt`
- Framer Motion and Lucide icons for lightweight motion and UI polish
- Admin-curated city/activity catalog and community itinerary feed

## Setup

1. Copy `.env.example` to `.env.local`.
2. Set `DATABASE_URL` to a Neon Postgres URL, or a local Postgres URL.
3. Set `NEXTAUTH_SECRET` to a long random value.
4. Install dependencies and prepare the database:

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

The seed loads a curated multi-region city and activity catalog. For a populated demo (`/community`, budgets, likes), set `TRAVELOOP_SEED_SHOWCASE=true` and `TRAVELOOP_SHOWCASE_PASSWORD`; see `.env.example` for the fixed demo emails that share that password and for notes on re-seeding (catalog activity refresh clears itinerary rows tied to those catalog entries).

**Admin (`/admin`, `/admin/catalog`):** set `TRAVELOOP_ADMIN_EMAIL` and `TRAVELOOP_ADMIN_PASSWORD` in `.env` or `.env.local`, then run `npm run db:seed`. The seed script reads both files (same as typical local setup—previously only `.env` was picked up reliably). Watch the terminal: it logs `Admin user upserted: …` or a skip reason. Promoting a user in the database (`role = ADMIN`) works only if Prisma connects to the **same** `DATABASE_URL` as the app and you use the Prisma enum value `ADMIN` (see `UserRole` in `prisma/schema.prisma`).

## Core Routes

- `/login` and `/signup` for auth
- `/dashboard` for the travel home
- `/community` for public itinerary discovery, likes, saves, comments, and copying trips
- `/admin` and `/admin/catalog` for metrics and curated catalog management
- `/trips` and `/trips/new` for trip CRUD
- `/trips/[tripId]/builder` for city/activity planning
- `/trips/[tripId]` for the day-wise itinerary
- `/trips/[tripId]/budget`, `/invoice`, `/checklist`, and `/notes`
- `/share/[slug]` for public read-only itinerary sharing
