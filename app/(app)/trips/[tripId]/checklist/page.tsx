import { ChecklistCategory } from "@prisma/client";
import { Check, ListChecks, Plus, Trash2 } from "lucide-react";
import { TripNav } from "@/components/trip-nav";
import { addChecklistItemAction, deleteChecklistItemAction, toggleChecklistItemAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const categories = Object.values(ChecklistCategory);

export default async function ChecklistPage({ params }: { params: Promise<{ tripId: string }> }) {
  const user = await requireUser();
  const { tripId } = await params;
  const trip = await prisma.trip.findUnique({
    where: { id: tripId, ownerId: user.id },
    include: { checklistItems: { orderBy: [{ isPacked: "asc" }, { createdAt: "desc" }] } }
  });

  if (!trip) {
    return <div className="sketch-panel p-8 text-2xl font-black">Trip not found.</div>;
  }

  const packed = trip.checklistItems.filter((item) => item.isPacked).length;

  return (
    <div className="grid gap-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Packing checklist</p>
          <h1 className="text-4xl font-black text-ink">{trip.name}</h1>
        </div>
        <TripNav tripId={trip.id} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <form action={addChecklistItemAction} className="sketch-panel doodle-map grid content-start gap-4 p-5">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-coral" />
            <h2 className="text-2xl font-black">Add item</h2>
          </div>
          <input name="tripId" type="hidden" value={trip.id} />
          <label className="grid gap-2">
            <span className="label">Item</span>
            <input className="input" name="title" placeholder="Passport, charger, rain jacket..." required />
          </label>
          <label className="grid gap-2">
            <span className="label">Category</span>
            <select className="input" name="category" defaultValue="DOCUMENTS">
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.toLowerCase()}
                </option>
              ))}
            </select>
          </label>
          <button className="btn-primary" type="submit">
            Add to checklist
          </button>
        </form>

        <div className="sketch-panel grid content-start gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-coral" />
              <h2 className="text-2xl font-black">Packing board</h2>
            </div>
            <span className="stamp">{packed}/{trip.checklistItems.length} packed</span>
          </div>
          <div className="grid gap-3">
            {trip.checklistItems.map((item) => (
              <div key={item.id} className={`flex flex-wrap items-center justify-between gap-3 border-2 border-ink p-4 ${item.isPacked ? "bg-leaf/15" : "bg-white"}`} style={{ borderRadius: 8 }}>
                <div>
                  <p className={`font-black ${item.isPacked ? "line-through text-ink/50" : "text-ink"}`}>{item.title}</p>
                  <p className="text-sm font-bold text-ink/55">{item.category.toLowerCase()}</p>
                </div>
                <div className="flex gap-2">
                  <form action={toggleChecklistItemAction}>
                    <input name="tripId" type="hidden" value={trip.id} />
                    <input name="itemId" type="hidden" value={item.id} />
                    <button className="btn-secondary" type="submit">
                      <Check className="h-4 w-4" />
                    </button>
                  </form>
                  <form action={deleteChecklistItemAction}>
                    <input name="tripId" type="hidden" value={trip.id} />
                    <input name="itemId" type="hidden" value={item.id} />
                    <button className="btn-ghost text-coral" type="submit">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            ))}
            {trip.checklistItems.length === 0 ? <p className="font-bold text-ink/65">Nothing packed yet. Add the first essential.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
