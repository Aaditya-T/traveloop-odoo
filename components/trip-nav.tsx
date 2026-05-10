import { CalendarDays, CircleDollarSign, ListChecks, Map, NotebookPen } from "lucide-react";
import Link from "next/link";

const items = [
  { label: "Itinerary", href: "", icon: CalendarDays },
  { label: "Builder", href: "/builder", icon: Map },
  { label: "Budget", href: "/budget", icon: CircleDollarSign },
  { label: "Checklist", href: "/checklist", icon: ListChecks },
  { label: "Notes", href: "/notes", icon: NotebookPen }
];

export function TripNav({ tripId }: { tripId: string }) {
  return (
    <nav className="flex flex-wrap gap-2">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Link key={item.href} className="mini-tab" href={`/trips/${tripId}${item.href}`}>
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
