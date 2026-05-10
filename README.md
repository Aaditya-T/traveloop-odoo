# Traveloop

Traveloop is a hackathon-ready travel planning app for building multi-city itineraries, budgets, notes, packing lists, and shareable public trip pages.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- Prisma with Postgres
- Neon Postgres for team sync, local Postgres by swapping `DATABASE_URL`
- Cookie-based credentials auth using Node `scrypt`
- Framer Motion and Lucide icons for lightweight motion and UI polish

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

The seed adds curated city/activity content plus a demo account:

```text
demo@traveloop.dev
traveloop123
```

## Core Routes

- `/login` and `/signup` for auth
- `/dashboard` for the travel home
- `/trips` and `/trips/new` for trip CRUD
- `/trips/[tripId]/builder` for city/activity planning
- `/trips/[tripId]` for the day-wise itinerary
- `/trips/[tripId]/budget`, `/checklist`, and `/notes`
- `/share/[slug]` for public read-only itinerary sharing
