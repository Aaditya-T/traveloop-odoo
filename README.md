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

The seed adds curated city/activity catalog content. To create an admin account during seeding, set `TRAVELOOP_ADMIN_EMAIL`, `TRAVELOOP_ADMIN_PASSWORD`, and `TRAVELOOP_ADMIN_NAME` first.

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
