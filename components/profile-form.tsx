"use client";

import { TripVisibility } from "@prisma/client";
import { UserRound } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { type ActionResult, updateProfileFormAction } from "@/lib/actions";
import { SubmitButton } from "@/components/submit-button";

export type ProfileFormUser = {
  name: string;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  homeCity: string | null;
  homeCountry: string | null;
  language: string;
  bio: string | null;
  defaultTripVisibility: TripVisibility;
};

export function ProfileForm({ user }: { user: ProfileFormUser }) {
  const [state, formAction] = useActionState(updateProfileFormAction, null as ActionResult | null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success("Profile saved");
    } else {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={formAction} className="sketch-panel doodle-map grid gap-4 p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-14 w-14 place-items-center border-2 border-ink bg-ticket shadow-sketch" style={{ borderRadius: 8 }}>
          <UserRound className="h-7 w-7" />
        </span>
        <div>
          <h2 className="text-2xl font-black">{user.name}</h2>
          <p className="text-sm font-bold text-ink/60">{user.email}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="label">Name</span>
          <input className="input" name="name" defaultValue={user.name} required />
        </label>
        <label className="grid gap-2">
          <span className="label">Email</span>
          <input className="input" name="email" type="email" defaultValue={user.email} required />
        </label>
        <label className="grid gap-2">
          <span className="label">Phone</span>
          <input className="input" name="phone" defaultValue={user.phone ?? ""} />
        </label>
        <label className="grid gap-2">
          <span className="label">Photo URL</span>
          <input className="input" name="photoUrl" defaultValue={user.photoUrl ?? ""} />
        </label>
        <label className="grid gap-2">
          <span className="label">Home city</span>
          <input className="input" name="homeCity" defaultValue={user.homeCity ?? ""} />
        </label>
        <label className="grid gap-2">
          <span className="label">Home country</span>
          <input className="input" name="homeCountry" defaultValue={user.homeCountry ?? ""} />
        </label>
        <label className="grid gap-2">
          <span className="label">Language</span>
          <input className="input" name="language" defaultValue={user.language} />
        </label>
        <label className="grid gap-2">
          <span className="label">Default trip privacy</span>
          <select className="input" name="defaultTripVisibility" defaultValue={user.defaultTripVisibility}>
            {Object.values(TripVisibility).map((visibility) => (
              <option key={visibility} value={visibility}>
                {visibility.toLowerCase()}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="grid gap-2">
        <span className="label">Bio</span>
        <textarea className="input min-h-28" name="bio" defaultValue={user.bio ?? ""} placeholder="Travel style, favorite regions, planning quirks..." />
      </label>
      <SubmitButton className="btn-primary justify-self-start" pendingLabel="Saving…" type="submit">
        Save profile
      </SubmitButton>
    </form>
  );
}
