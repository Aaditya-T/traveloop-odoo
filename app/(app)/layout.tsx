import { BarChart3, Compass, Globe2, LogOut, MapPinned, Plus, UserRound } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { TutorialMode } from "@/components/tutorial-mode";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen" data-tour="app-shell">
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
            <Link className="btn-ghost" data-tour="community-nav" href="/community">
              <Globe2 className="h-4 w-4" />
              Community
            </Link>
            {user.role === "ADMIN" ? (
              <Link className="btn-ghost" href="/admin">
                <BarChart3 className="h-4 w-4" />
                Admin
              </Link>
            ) : null}
            <Link className="btn-secondary" href="/trips/new">
              <Plus className="h-4 w-4" />
              Plan New Trip
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <TutorialMode completed={user.hasCompletedOnboarding} />
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
      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 gap-2 rounded-lg border-2 border-ink bg-paper/95 p-2 shadow-sketch backdrop-blur md:hidden">
        <Link className="grid justify-items-center gap-1 text-xs font-black text-ink" href="/dashboard">
          <MapPinned className="h-5 w-5" />
          Home
        </Link>
        <Link className="grid justify-items-center gap-1 text-xs font-black text-ink" href="/trips">
          <Compass className="h-5 w-5" />
          Trips
        </Link>
        <Link className="grid justify-items-center gap-1 text-xs font-black text-ink" href="/community">
          <Globe2 className="h-5 w-5" />
          Feed
        </Link>
        <Link className="grid justify-items-center gap-1 text-xs font-black text-ink" href="/settings">
          <UserRound className="h-5 w-5" />
          You
        </Link>
      </nav>
    </div>
  );
}
