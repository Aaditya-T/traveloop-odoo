import { Compass, LogOut, MapPinned, Plus, UserRound } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b-2 border-ink bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link className="flex items-center gap-2 text-xl font-black text-ink" href="/dashboard">
            <span className="grid h-10 w-10 place-items-center border-2 border-ink bg-ticket shadow-sketch" style={{ borderRadius: 8 }}>
              <Compass className="h-5 w-5" />
            </span>
            Traveloop
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            <Link className="btn-ghost" href="/dashboard">
              <MapPinned className="h-4 w-4" />
              Dashboard
            </Link>
            <Link className="btn-ghost" href="/trips">
              Trips
            </Link>
            <Link className="btn-secondary" href="/trips/new">
              <Plus className="h-4 w-4" />
              Plan New Trip
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link className="hidden items-center gap-2 text-sm font-black text-ink sm:flex" href="/settings">
              <UserRound className="h-4 w-4" />
              {user.name}
            </Link>
            <form action={logoutAction}>
              <button className="btn-ghost" title="Log out" type="submit">
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
