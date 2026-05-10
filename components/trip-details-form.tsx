"use client";

import { TripVisibility } from "@prisma/client";
import { Pencil } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { type ActionResult, updateTripFormAction } from "@/lib/actions";
import { SubmitButton } from "@/components/submit-button";

export type TripDetails = {
  id: string;
  name: string;
  startDateInput: string;
  endDateInput: string;
  budgetLimit: number;
  visibility: TripVisibility;
  coverPhotoUrl: string | null;
  description: string | null;
};

export function TripDetailsForm({ trip }: { trip: TripDetails }) {
  const [state, formAction] = useActionState(updateTripFormAction, null as ActionResult | null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success("Trip details saved");
    } else {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={formAction} className="sketch-panel grid content-start gap-4 p-5">
      <div className="flex items-center gap-2">
        <Pencil className="h-5 w-5 text-coral" />
        <h2 className="text-2xl font-black text-ink">Trip details</h2>
      </div>
      <input name="tripId" type="hidden" value={trip.id} />
      <label className="grid gap-2">
        <span className="label">Name</span>
        <input className="input" name="name" defaultValue={trip.name} required />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="label">Start</span>
          <input className="input" name="startDate" type="date" defaultValue={trip.startDateInput} required />
        </label>
        <label className="grid gap-2">
          <span className="label">End</span>
          <input className="input" name="endDate" type="date" defaultValue={trip.endDateInput} required />
        </label>
      </div>
      <label className="grid gap-2">
        <span className="label">Budget limit</span>
        <input className="input" name="budgetLimit" type="number" defaultValue={trip.budgetLimit} min={0} />
      </label>
      <label className="grid gap-2">
        <span className="label">Visibility</span>
        <select className="input" name="visibility" defaultValue={trip.visibility}>
          {Object.values(TripVisibility).map((visibility) => (
            <option key={visibility} value={visibility}>
              {visibility.toLowerCase()}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2">
        <span className="label">Cover photo URL</span>
        <input className="input" name="coverPhotoUrl" defaultValue={trip.coverPhotoUrl ?? ""} />
      </label>
      <label className="grid gap-2">
        <span className="label">Description</span>
        <textarea className="input min-h-28" name="description" defaultValue={trip.description ?? ""} />
        <span className="text-xs leading-5 text-ink/55">
          Shown under the trip title on this page. Use <span className="font-bold text-ink/70">Notes</span> in the nav for
          reminders and booking details—they surface in Sticky notes above your itinerary.
        </span>
      </label>
      <SubmitButton className="btn-primary" pendingLabel="Saving…" type="submit">
        Save details
      </SubmitButton>
    </form>
  );
}
