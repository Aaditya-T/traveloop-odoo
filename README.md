# Traveloop

Traveloop is a multi-city travel planning platform for building, publishing, and discovering complete itineraries. It combines trip planning, curated destination content, budgeting, invoice views, notes, packing, public sharing, community discovery, and admin moderation in one workspace.

The product is designed for a travel planning workflow where users can start privately, shape a detailed trip, publish it when ready, and let other travellers browse or copy it into their own account.

To see our market research report, see [`market-research.md`](./market-research.md).

## Platform Features

### Trip Planning

- Multi-city trip creation with date ranges, cover images, descriptions, budget limits, and visibility controls.
- Guided itinerary builder for adding route stops, selecting activities, scheduling days, and reviewing the plan.
- Day-wise itinerary view with stops, activities, timing, notes, and estimated costs.
- Public share pages for read-only itinerary access.

### Destination Catalog

- Admin-curated cities and activities.
- City metadata for region, country, popularity, cost index, featured status, archived status, image, and summary.
- Activity metadata for category, duration, estimated cost, tags, featured status, archived status, and image.
- Catalog-first content strategy so demos and discovery remain reliable without depending on external APIs.

### Budgeting and Invoice Views

- Structured expense tracking by category, vendor, date, quantity, unit cost, payment status, and receipt URL.
- Budget summaries and category breakdowns.
- Invoice-style route for printable expense review.
- Paid, unpaid, and partial payment states.

### Community Discovery

- Public community feed available without login.
- Search and filter public itineraries by destination, region, and budget.
- Authenticated actions for liking, saving, commenting, reporting, and copying public trips.
- Copied trips retain attribution to the source itinerary while becoming private plans for the new owner.

### Profile and Settings

- Editable profile details including name, email, photo URL, phone, home city/country, language, bio, and default trip visibility.
- Password change and account deletion flow.
- Saved trips, copied trips, and public itinerary sections.
- Replayable onboarding/tutorial mode from the app shell.

### Admin and Moderation

- Admin dashboard for platform metrics, recent users, public trips, catalog performance, budget totals, and community activity.
- Catalog management for cities and activities.
- Moderation console for trip reports, comment reports, hidden comments, taken-down trips, and report resolution.
- Soft takedown flow for public trips and soft hide flow for comments.
- Hard delete available for comments when needed.

## Architecture

Traveloop is built with the Next.js App Router and a PostgreSQL database accessed through Prisma.

```text
Next.js App Router
  app/                 Route groups, pages, server-rendered views, API routes
  components/          Shared UI, forms, tutorial, upload components
  lib/                 Auth, server actions, Prisma client, business logic
  prisma/              Schema and seed data
  tests/               Unit tests for planning, invoice, and platform helpers
```

Core implementation choices:

- Server-rendered pages for authenticated and public product flows.
- Server actions for mutations such as trip edits, budget updates, comments, reports, moderation, catalog updates, and auth.
- Cookie-based credentials auth with signed HTTP-only session cookies.
- Prisma schema designed to work with Neon Postgres in team environments and local Postgres in development.
- Tailwind CSS design system with a playful travel/sketch visual language.
- Optional Cloudflare R2 support for direct image uploads.

## Route Map

| Route | Access | Description |
| --- | --- | --- |
| `/` | Public | Product preview with featured itineraries and curated cities |
| `/community` | Public read, auth actions | Public itinerary discovery and community actions |
| `/share/[slug]` | Public | Read-only public or unlisted itinerary |
| `/login` | Public | Sign in |
| `/signup` | Public | Create account |
| `/dashboard` | Authenticated | Main workspace dashboard |
| `/trips` | Authenticated | User trip list |
| `/trips/new` | Authenticated | Trip creation |
| `/trips/[tripId]` | Owner | Trip itinerary view |
| `/trips/[tripId]/builder` | Owner | Guided itinerary builder |
| `/trips/[tripId]/budget` | Owner | Budget and expenses |
| `/trips/[tripId]/invoice` | Owner | Invoice-style expense view |
| `/trips/[tripId]/checklist` | Owner | Packing checklist |
| `/trips/[tripId]/notes` | Owner | Trip notes |
| `/settings` | Authenticated | Profile, password, saved trips, copied trips |
| `/admin` | Admin | Platform metrics |
| `/admin/catalog` | Admin | City and activity catalog management |
| `/admin/moderation` | Admin | Reports, comments, trip takedowns, restores |

## Database Design

The schema is centered on trips, curated content, and community activity.

### Primary Entities

| Model | Purpose |
| --- | --- |
| `User` | Account, profile, role, tutorial state, auth ownership |
| `Trip` | Main trip record with dates, visibility, share slug, budget, moderation state |
| `TripStop` | Ordered city stops inside a trip |
| `City` | Admin-curated destination catalog |
| `Activity` | Admin-curated activities attached to cities |
| `ItineraryItem` | Scheduled activity inside a trip stop |
| `TripExpense` | Budget and invoice expense record |
| `PackingItem` | Checklist item attached to a trip |
| `TripNote` | Notes attached to a trip, optionally scoped to a stop |
| `TripLike` | Community like join table |
| `TripSave` | Saved public itinerary join table |
| `TripComment` | Community comments with moderation state |
| `TripReport` | User reports against public trips |
| `CommentReport` | User reports against comments |

### Key Relationships

```mermaid
erDiagram
  User ||--o{ Trip : owns
  User ||--o{ TripLike : likes
  User ||--o{ TripSave : saves
  User ||--o{ TripComment : writes
  User ||--o{ TripReport : reports
  User ||--o{ CommentReport : reports

  Trip ||--o{ TripStop : contains
  Trip ||--o{ TripExpense : tracks
  Trip ||--o{ PackingItem : includes
  Trip ||--o{ TripNote : stores
  Trip ||--o{ TripLike : receives
  Trip ||--o{ TripSave : receives
  Trip ||--o{ TripComment : receives
  Trip ||--o{ TripReport : receives
  Trip ||--o{ Trip : copied_from

  City ||--o{ TripStop : appears_in
  City ||--o{ Activity : offers
  TripStop ||--o{ ItineraryItem : schedules
  TripStop ||--o{ TripExpense : scopes
  TripStop ||--o{ TripNote : scopes
  Activity ||--o{ ItineraryItem : selected_as
  TripComment ||--o{ CommentReport : receives
```

### Enums

| Enum | Values |
| --- | --- |
| `UserRole` | `USER`, `ADMIN` |
| `TripVisibility` | `PRIVATE`, `UNLISTED`, `PUBLIC` |
| `ModerationStatus` | `ACTIVE`, `HIDDEN`, `TAKEN_DOWN` |
| `ReportStatus` | `PENDING`, `RESOLVED`, `DISMISSED` |
| `PaymentStatus` | `UNPAID`, `PARTIAL`, `PAID` |
| `ActivityCategory` | `SIGHTSEEING`, `FOOD`, `ADVENTURE`, `CULTURE`, `RELAX`, `SHOPPING`, `NIGHTLIFE` |
| `BudgetCategory` | `TRANSPORT`, `STAY`, `ACTIVITIES`, `MEALS`, `SHOPPING`, `BUFFER` |
| `ChecklistCategory` | `CLOTHING`, `DOCUMENTS`, `ELECTRONICS`, `HEALTH`, `MISC` |

### Indexes and Constraints

| Model | Indexes and Constraints |
| --- | --- |
| `User` | unique `email` |
| `Trip` | unique `shareSlug`, indexes on `ownerId`, `visibility`, `sourceTripId`, `moderationStatus` |
| `City` | unique `name + country`, indexes on `region`, `isFeatured`, `isArchived` |
| `Activity` | indexes on `cityId`, `category`, `isFeatured`, `isArchived` |
| `TripStop` | index on `tripId + position`, index on `cityId` |
| `ItineraryItem` | index on `stopId + date` |
| `TripExpense` | indexes on `tripId`, `category` |
| `PackingItem` | index on `tripId` |
| `TripNote` | index on `tripId` |
| `TripLike` | unique `userId + tripId`, index on `tripId` |
| `TripSave` | unique `userId + tripId`, index on `tripId` |
| `TripComment` | index on `tripId + createdAt`, index on `userId`, index on `moderationStatus` |
| `TripReport` | indexes on `tripId`, `reporterId`, `status + createdAt` |
| `CommentReport` | indexes on `commentId`, `reporterId`, `status + createdAt` |

### Deletion Behavior

- Deleting a user cascades owned trips, likes, saves, comments, and reports.
- Deleting a trip cascades stops, expenses, notes, checklist items, likes, saves, comments, and reports.
- Deleting a city cascades activities and removes catalog-backed destination content.
- Deleting a trip stop cascades itinerary items and nulls related scoped expenses/notes where configured.
- Copied trips keep a nullable source reference, with `SetNull` if the source trip is removed.

## Access Control

Traveloop has three major access levels:

- Public visitors can view the landing page, community feed, and share pages.
- Authenticated users can create trips, manage their own workspace, and interact with community content.
- Admin users can access platform metrics, catalog management, and moderation tools.

Trip visibility:

- `PRIVATE`: visible only to the owner.
- `UNLISTED`: accessible by share URL but not community-discoverable.
- `PUBLIC`: visible in community discovery.

Moderation status is applied on top of visibility. Public surfaces exclude taken-down trips and hidden comments.

## Local Setup

### Requirements

- Node.js 20+
- npm
- PostgreSQL, either Neon or local

### Install

```bash
npm install
```

### Environment

Create `.env.local`:

```bash
cp .env.example .env.local
```

Required values:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/traveloop?sslmode=require"
NEXTAUTH_SECRET="replace-with-a-secure-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Generate a secret:

```bash
openssl rand -base64 32
```

### Database

Sync schema:

```bash
npm run db:push
```

Seed catalog data:

```bash
npm run db:seed
```

Optional admin seed:

```bash
TRAVELOOP_ADMIN_EMAIL="admin@traveloop.dev" \
TRAVELOOP_ADMIN_PASSWORD="replace-with-a-secure-password" \
TRAVELOOP_ADMIN_NAME="Traveloop Admin" \
npm run db:seed
```

Optional showcase seed:

```bash
TRAVELOOP_SEED_SHOWCASE=true \
TRAVELOOP_SHOWCASE_PASSWORD="replace-with-a-secure-password" \
npm run db:seed
```

### Run

```bash
npm run dev
```

Open `http://localhost:3000`.

Stop the server with `Ctrl+C` when finished.

## Neon and Local Postgres

The app is Neon-first but not Neon-locked. Prisma uses `DATABASE_URL`, so switching databases is just an environment change.

### Neon

```bash
DATABASE_URL="postgresql://USER:PASSWORD@NEON_HOST/neondb?sslmode=require"
npm run db:push
npm run db:seed
```

### Local Postgres

```bash
createdb traveloop
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/traveloop"
npm run db:push
npm run db:seed
```

For team parity, use the same seed flags locally that were used for the shared Neon database.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` or `AUTH_SECRET` | Yes | Session cookie signing secret |
| `NEXT_PUBLIC_APP_URL` | Recommended | Base URL used for share links |
| `TRAVELOOP_ADMIN_EMAIL` | Optional | Admin email to upsert during seed |
| `TRAVELOOP_ADMIN_PASSWORD` | Optional | Admin password for seeded admin |
| `TRAVELOOP_ADMIN_NAME` | Optional | Admin display name |
| `TRAVELOOP_SEED_SHOWCASE` | Optional | Enables showcase users and trips when set to `true` |
| `TRAVELOOP_SHOWCASE_PASSWORD` | Optional | Password used for showcase accounts |
| `R2_ACCOUNT_ID` | Optional | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | Optional | R2 access key |
| `R2_SECRET_ACCESS_KEY` | Optional | R2 secret key |
| `R2_BUCKET` or `R2_BUCKET_NAME` | Optional | R2 bucket name |
| `R2_PUBLIC_BASE_URL` | Optional | Public object base URL |
| `R2_S3_API` | Optional | Custom S3-compatible endpoint |

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Generate Prisma client and create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run Next lint |
| `npm run typecheck` | Run TypeScript checks |
| `npm test` | Run Vitest |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema changes to the configured database |
| `npm run db:migrate` | Create and run Prisma migrations locally |
| `npm run db:seed` | Seed catalog, optional admin, optional showcase data |

## Deployment

### Recommended deployment stack

- Vercel for the Next.js app.
- Neon for PostgreSQL.
- Cloudflare R2 for optional image uploads.

### Production checklist

1. Create a Neon database.
2. Configure production environment variables.
3. Run `npm run db:push` against the production database.
4. Run `npm run db:seed` once to load catalog content.
5. Create an admin through seed variables or update a user role to `ADMIN`.
6. Build with `npm run build`.
7. Deploy the Next.js app.

### Vercel notes

Set these variables in the Vercel project:

```bash
DATABASE_URL=
NEXTAUTH_SECRET=
NEXT_PUBLIC_APP_URL=
```

Add R2 variables only if uploads are enabled.

For Cloudflare R2 uploads, configure bucket CORS to allow the deployed origin and methods `PUT`, `GET`, and `HEAD`.

## Quality and Verification

Run the standard checks before merging or demoing:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Current tests cover:

- planning and date helpers
- budget and invoice calculations
- public visibility and moderation helpers

## Demo Flow

1. Open `/` and show the public product preview.
2. Open `/community` as a guest and browse public trips.
3. Open a `/share/[slug]` itinerary.
4. Sign up or log in.
5. Create a trip and use the builder.
6. Add budget items and review the invoice.
7. Add packing items and notes.
8. Publish or share the itinerary.
9. Use the community feed to like, save, copy, comment, and report.
10. Log in as admin and review `/admin` plus `/admin/moderation`.

## Status

Traveloop currently supports the core platform loop:

- plan a trip
- organize itinerary details
- manage trip operations
- publish and discover public itineraries
- moderate community content
- run against shared Neon or local Postgres

The codebase is structured for future additions such as collaborator invites, external travel APIs, advanced recommendation ranking, richer analytics, and production-grade email/password recovery.

## License

Private project.
