import { LockKeyhole, ShieldAlert, Star } from "lucide-react";
import Link from "next/link";
import { ProfileForm, type ProfileFormUser } from "@/components/profile-form";
import { SubmitButton } from "@/components/submit-button";
import { changePasswordAction, deleteAccountAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/date";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const user = await requireUser();
  const [publicTrips, savedTrips, copiedTrips] = await Promise.all([
    prisma.trip.findMany({ where: { ownerId: user.id, visibility: "PUBLIC" }, orderBy: { updatedAt: "desc" }, take: 6 }),
    prisma.tripSave.findMany({ where: { userId: user.id }, include: { trip: true }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.trip.findMany({ where: { ownerId: user.id, sourceTripId: { not: null } }, include: { sourceTrip: true }, orderBy: { createdAt: "desc" }, take: 6 })
  ]);

  const profileUser: ProfileFormUser = {
    name: user.name,
    email: user.email,
    phone: user.phone,
    photoUrl: user.photoUrl,
    homeCity: user.homeCity,
    homeCountry: user.homeCountry,
    language: user.language,
    bio: user.bio,
    defaultTripVisibility: user.defaultTripVisibility
  };

  return (
    <div className="grid gap-6">
      <div>
        <p className="label">Settings</p>
        <h1 className="text-4xl font-black text-ink">Profile and trust center</h1>
      </div>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
        <ProfileForm user={profileUser} />

        <div className="grid content-start gap-5">
          <form action={changePasswordAction} className="sketch-panel grid gap-4 p-5">
            <div className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-coral" />
              <h2 className="text-2xl font-black">Password</h2>
            </div>
            <input className="input" name="currentPassword" type="password" placeholder="Current password" required />
            <input className="input" name="nextPassword" type="password" minLength={8} placeholder="New password" required />
            <SubmitButton className="btn-secondary" pendingLabel="Updating…" type="submit">
              Change password
            </SubmitButton>
          </form>

          <form action={deleteAccountAction} className="sketch-panel grid gap-4 border-coral p-5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-coral" />
              <h2 className="text-2xl font-black">Delete account</h2>
            </div>
            <p className="text-sm leading-6 text-ink/65">This removes your profile, trips, notes, checklist items, public itineraries, and community activity.</p>
            <input className="input" name="confirmation" placeholder={user.email} />
            <SubmitButton className="btn-ghost justify-self-start text-coral" pendingLabel="Deleting…" type="submit">
              Delete account
            </SubmitButton>
          </form>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <ProfileList title="My public itineraries" items={publicTrips.map((trip) => ({ id: trip.id, title: trip.name, href: `/trips/${trip.id}`, meta: formatDate(trip.updatedAt) }))} />
        <ProfileList title="Saved trips" items={savedTrips.map((save) => ({ id: save.id, title: save.trip.name, href: `/share/${save.trip.shareSlug}`, meta: formatDate(save.createdAt) }))} />
        <ProfileList title="Copied trips" items={copiedTrips.map((trip) => ({ id: trip.id, title: trip.name, href: `/trips/${trip.id}`, meta: trip.sourceTrip?.name ?? "Community copy" }))} />
      </section>
    </div>
  );
}

function ProfileList({ title, items }: { title: string; items: Array<{ id: string; title: string; href: string; meta: string }> }) {
  return (
    <article className="sketch-panel grid content-start gap-3 p-5">
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 text-ticket" />
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      {items.map((item) => (
        <Link key={item.id} className="border-b-2 border-ink/10 pb-3" href={item.href} prefetch>
          <p className="font-black text-ink">{item.title}</p>
          <p className="text-xs font-bold text-ink/55">{item.meta}</p>
        </Link>
      ))}
      {items.length === 0 ? <p className="text-sm leading-6 text-ink/65">Nothing here yet.</p> : null}
    </article>
  );
}
