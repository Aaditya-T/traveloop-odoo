import { Compass, Mail, KeyRound } from "lucide-react";
import Link from "next/link";
import { loginAction } from "@/lib/actions";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
        <div className="space-y-6">
          <div className="stamp">Traveloop boarding pass</div>
          <h1 className="max-w-2xl text-5xl font-black leading-[0.95] text-ink sm:text-7xl">
            Plan the whole trip without losing the plot.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-ink/75">
            Build multi-city plans, budgets, notes, and packing lists in one shared travel board.
          </p>
          <div className="relative h-36 max-w-md overflow-hidden rounded-lg border-2 border-ink bg-skywash shadow-sketch">
            <div className="absolute left-8 top-10 h-4 w-4 rounded-full border-2 border-ink bg-coral" />
            <div className="absolute left-16 top-14 h-1 w-56 rotate-6 border-t-2 border-dashed border-ink" />
            <Compass className="floaty absolute right-10 top-10 h-16 w-16 text-lagoon" />
            <div className="absolute bottom-5 left-8 rotate-[-4deg] border-2 border-ink bg-ticket px-4 py-2 text-sm font-black shadow-sketch">
              next stop: everywhere
            </div>
          </div>
        </div>

        <form action={loginAction} className="sketch-panel doodle-map grid gap-5 p-6 sm:p-8">
          <div>
            <h2 className="text-3xl font-black text-ink">Welcome back</h2>
            <p className="mt-1 text-sm text-ink/65">Sign in and pick up the route.</p>
          </div>
          {params.error ? <p className="border-2 border-coral bg-coral/10 p-3 text-sm font-bold text-coral">{params.error}</p> : null}
          <label className="grid gap-2">
            <span className="label">Email</span>
            <span className="relative">
              <Mail className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-ink/45" />
              <input className="input pl-10" name="email" type="email" autoComplete="email" required />
            </span>
          </label>
          <label className="grid gap-2">
            <span className="label">Password</span>
            <span className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-ink/45" />
              <input className="input pl-10" name="password" type="password" autoComplete="current-password" required />
            </span>
          </label>
          <button className="btn-primary" type="submit">
            Login
          </button>
          <p className="text-center text-sm font-semibold text-ink/65">
            No account yet?{" "}
            <Link className="font-black text-coral underline" href="/signup">
              Create one
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
