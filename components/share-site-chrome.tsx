import type { UserRole } from "@prisma/client";
import { BarChart3, Compass, Globe2, LogOut, MapPinned, Plus, UserRound } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/lib/actions";

export type ShareChromeUser = {
  name: string;
  role: UserRole;
};

export function ShareSiteChrome({
  user,
  children
}: {
  user: ShareChromeUser | null;
  children: React.ReactNode;
}) {
  const logoHref = user ? "/dashboard" : "/login";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b-2 border-ink bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link className="flex min-w-0 items-center gap-2 text-xl font-black text-ink" href={logoHref}>
            <span
              className="grid h-10 w-10 shrink-0 place-items-center border-2 border-ink bg-ticket shadow-sketch"
              style={{ borderRadius: 8 }}
            >
              <Compass className="h-5 w-5" />
            </span>
            <span className="truncate">Traveloop</span>
          </Link>
          {user ? (
            <>
              <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
                <Link className="btn-ghost" href="/dashboard">
                  <MapPinned className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link className="btn-ghost" href="/trips">
                  Trips
                </Link>
                <Link className="btn-ghost" href="/community">
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
                <Link className="hidden items-center gap-2 text-sm font-black text-ink sm:flex" href="/settings">
                  <UserRound className="h-4 w-4" />
                  <span className="max-w-[10rem] truncate">{user.name}</span>
                </Link>
                <form action={logoutAction}>
                  <button className="btn-ghost" title="Log out" type="submit">
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <nav className="flex flex-wrap items-center gap-2">
              <Link className="btn-ghost" href="/login">
                Log in
              </Link>
              <Link className="btn-primary" href="/signup">
                Sign up
              </Link>
            </nav>
          )}
        </div>
      </header>
      <div className={user ? "pb-24 md:pb-0" : undefined}>{children}</div>
      {user ? (
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
      ) : null}
    </div>
  );
}
