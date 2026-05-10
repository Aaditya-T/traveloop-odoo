import { UserRound } from "lucide-react";
import { requireUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div>
        <p className="label">Settings</p>
        <h1 className="text-4xl font-black text-ink">Profile and preferences</h1>
      </div>
      <section className="sketch-panel doodle-map grid gap-4 p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center border-2 border-ink bg-ticket shadow-sketch" style={{ borderRadius: 8 }}>
            <UserRound className="h-7 w-7" />
          </span>
          <div>
            <h2 className="text-2xl font-black">{user.name}</h2>
            <p className="text-sm font-bold text-ink/60">{user.email}</p>
          </div>
        </div>
        <p className="text-sm leading-6 text-ink/70">
          Profile editing is intentionally light in the core demo. The account is real, trips are private by default, and public links only appear when a trip is published.
        </p>
      </section>
    </div>
  );
}
