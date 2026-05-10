"use client";

import { CalendarDays, CircleDollarSign, FileText, ListChecks, Map, NotebookPen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Itinerary", href: "", icon: CalendarDays },
  { label: "Builder", href: "/builder", icon: Map },
  { label: "Budget", href: "/budget", icon: CircleDollarSign },
  { label: "Invoice", href: "/invoice", icon: FileText },
  { label: "Checklist", href: "/checklist", icon: ListChecks },
  { label: "Notes", href: "/notes", icon: NotebookPen }
];

export function TripNav({ tripId }: { tripId: string }) {
  const pathname = usePathname();
  const base = `/trips/${tripId}`;

  return (
    <nav className="flex flex-wrap gap-2" data-tour="trip-nav">
      {items.map((item) => {
        const Icon = item.icon;
        const href = `${base}${item.href}`;
        const itineraryRoot = pathname === base || pathname === `${base}/`;
        const isActive =
          item.href === "" ? itineraryRoot : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={item.href || "itinerary"}
            aria-current={isActive ? "page" : undefined}
            className={`mini-tab transition-opacity ${isActive ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : "opacity-90 hover:opacity-100"}`}
            href={href}
            prefetch
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
