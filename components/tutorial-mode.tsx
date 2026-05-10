"use client";

import { useEffect, useState, useTransition } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, HelpCircle, X } from "lucide-react";
import { completeTutorialAction } from "@/lib/actions";

const tourSteps = [
  {
    target: "app-shell",
    title: "Your travel workspace",
    body: "Use the top navigation on desktop or bottom navigation on mobile to move between your trips, community inspiration, and profile."
  },
  {
    target: "dashboard-hero",
    title: "Start from the dashboard",
    body: "Create a new trip, revisit upcoming routes, or browse curated city inspiration from here."
  },
  {
    target: "builder-progress",
    title: "Build in guided steps",
    body: "The itinerary builder now walks you through route stops, activities, scheduling, and final review."
  },
  {
    target: "budget-form",
    title: "Track costs cleanly",
    body: "Add expenses with quantity and cost. Traveloop derives the total, then rolls it into budgets and invoices."
  },
  {
    target: "trip-nav",
    title: "Trip tools stay together",
    body: "Each trip has itinerary, builder, budget, invoice, checklist, and notes tabs so planning stays organized."
  },
  {
    target: "community-nav",
    title: "Borrow good routes",
    body: "Community itineraries can be liked, saved, commented on, and copied into your own private workspace."
  }
] as const;

export function TutorialMode({ completed }: { completed: boolean }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const step = tourSteps[index];

  useEffect(() => {
    if (!completed) {
      setOpen(true);
    }
  }, [completed]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const target = document.querySelector(`[data-tour="${step.target}"]`);
    target?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  }, [open, step.target]);

  function finish() {
    setOpen(false);
    startTransition(async () => {
      await completeTutorialAction();
    });
  }

  return (
    <>
      <button className="btn-ghost" data-tour="tour-button" onClick={() => setOpen(true)} type="button">
        <HelpCircle className="h-4 w-4" />
        <span className="hidden sm:inline">Tour</span>
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-ink/25 p-4 backdrop-blur-sm sm:place-items-center">
          <section className="sketch-panel doodle-map w-full max-w-md bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="label">Traveloop tour</p>
                <h2 className="mt-1 text-2xl font-black text-ink">{step.title}</h2>
              </div>
              <button className="btn-ghost h-10 w-10 p-0" onClick={() => setOpen(false)} type="button" title="Close tour">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-ink/70">{step.body}</p>
            <div className="mt-5 flex items-center gap-2">
              {tourSteps.map((item, dotIndex) => (
                <button
                  key={item.target}
                  className={`h-2 flex-1 border-2 border-ink ${dotIndex <= index ? "bg-coral" : "bg-white"}`}
                  onClick={() => setIndex(dotIndex)}
                  type="button"
                  style={{ borderRadius: 999 }}
                  title={`Go to ${item.title}`}
                />
              ))}
            </div>
            <div className="mt-5 flex flex-wrap justify-between gap-3">
              <button className="btn-ghost" disabled={index === 0} onClick={() => setIndex((value) => Math.max(value - 1, 0))} type="button">
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              {index === tourSteps.length - 1 ? (
                <button className="btn-primary" disabled={isPending} onClick={finish} type="button">
                  <CheckCircle2 className="h-4 w-4" />
                  Finish
                </button>
              ) : (
                <button className="btn-primary" onClick={() => setIndex((value) => Math.min(value + 1, tourSteps.length - 1))} type="button">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
