import { Eye, WalletCards } from "lucide-react";
import { TripVisibility } from "@prisma/client";
import { R2UploadField } from "@/components/r2-upload-field";
import { createTripAction } from "@/lib/actions";
import { htmlDate } from "@/lib/date";
import { isR2Configured } from "@/lib/r2";

export default function NewTripPage() {
  const uploadsEnabled = isR2Configured();
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div>
        <p className="label">Create trip</p>
        <h1 className="text-4xl font-black text-ink">Start with the broad strokes</h1>
      </div>
      <form action={createTripAction} className="sketch-panel doodle-map grid gap-5 p-6">
        <label className="grid gap-2">
          <span className="label">Trip name</span>
          <input className="input text-lg font-black" name="name" placeholder="Japan food crawl" required />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="label">Start date</span>
            <input className="input" name="startDate" type="date" defaultValue={htmlDate(today)} required />
          </label>
          <label className="grid gap-2">
            <span className="label">End date</span>
            <input className="input" name="endDate" type="date" defaultValue={htmlDate(nextWeek)} required />
          </label>
        </div>
        <label className="grid gap-2">
          <span className="label">Description</span>
          <textarea
            className="input min-h-28"
            name="description"
            placeholder="Short summary of the trip—this shows on your trip home and public share page."
          />
          <span className="text-xs leading-5 text-ink/55">
            For booking codes, hotel details, and reminders, add those later from the Notes tab on the trip—they also appear on the trip home.
          </span>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <R2UploadField
            uploadsEnabled={uploadsEnabled}
            label="Cover photo"
            name="coverPhotoUrl"
            scope="trip-cover"
          />
          <label className="grid gap-2">
            <span className="label">Budget limit</span>
            <span className="relative">
              <WalletCards className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-ink/45" />
              <input className="input pl-10" name="budgetLimit" type="number" min="0" step="1" placeholder="2500" />
            </span>
          </label>
        </div>
        <label className="grid gap-2">
          <span className="label">Default visibility</span>
          <span className="relative">
            <Eye className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-ink/45" />
            <select className="input pl-10" name="visibility" defaultValue={TripVisibility.PRIVATE}>
              <option value="PRIVATE">Private workspace</option>
              <option value="UNLISTED">Unlisted share link</option>
              <option value="PUBLIC">Community public</option>
            </select>
          </span>
        </label>
        <button className="btn-primary" type="submit">
          Save and open builder
        </button>
      </form>
    </div>
  );
}
