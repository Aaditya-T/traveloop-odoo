import { PlaneTakeoff } from "lucide-react";
import Link from "next/link";

export function EmptyState({
  title,
  body,
  href,
  action
}: {
  title: string;
  body: string;
  href: string;
  action: string;
}) {
  return (
    <div className="sketch-panel doodle-map grid gap-4 p-8 text-center">
      <PlaneTakeoff className="mx-auto h-10 w-10 text-coral" />
      <div>
        <h2 className="text-2xl font-black text-ink">{title}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/70">{body}</p>
      </div>
      <Link className="btn-primary mx-auto" href={href}>
        {action}
      </Link>
    </div>
  );
}
