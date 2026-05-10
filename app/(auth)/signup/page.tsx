import { KeyRound, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { signUpAction } from "@/lib/actions";

export default async function SignupPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <form action={signUpAction} className="sketch-panel doodle-map grid w-full max-w-lg gap-5 p-6 sm:p-8">
        <div>
          <div className="stamp mb-4">fresh passport</div>
          <h1 className="text-4xl font-black text-ink">Create your Traveloop account</h1>
          <p className="mt-2 text-sm leading-6 text-ink/65">One place for your routes, budgets, notes, and shareable plans.</p>
        </div>
        {params.error ? <p className="border-2 border-coral bg-coral/10 p-3 text-sm font-bold text-coral">{params.error}</p> : null}
        <label className="grid gap-2">
          <span className="label">Name</span>
          <span className="relative">
            <UserRound className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-ink/45" />
            <input className="input pl-10" name="name" autoComplete="name" required />
          </span>
        </label>
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
            <input className="input pl-10" name="password" type="password" minLength={8} autoComplete="new-password" required />
          </span>
        </label>
        <button className="btn-primary" type="submit">
          Sign up
        </button>
        <p className="text-center text-sm font-semibold text-ink/65">
          Already have a route?{" "}
          <Link className="font-black text-coral underline" href="/login">
            Login
          </Link>
        </p>
      </form>
    </main>
  );
}
