import { BudgetCategory, PaymentStatus } from "@prisma/client";
import { CircleDollarSign, Plus, Receipt, Trash2 } from "lucide-react";
import { TripNav } from "@/components/trip-nav";
import { addExpenseAction, deleteExpenseAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { averagePerDay, budgetByCategory, money, totalActivityCost, totalExpenseCost } from "@/lib/budget";
import { formatDate, htmlDate } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { isR2Configured } from "@/lib/r2";
import { R2UploadField } from "@/components/r2-upload-field";

const categories = Object.values(BudgetCategory);
const statuses = Object.values(PaymentStatus);

export default async function BudgetPage({ params }: { params: Promise<{ tripId: string }> }) {
  const user = await requireUser();
  const { tripId } = await params;
  const trip = await prisma.trip.findUnique({
    where: { id: tripId, ownerId: user.id },
    include: {
      stops: {
        include: {
          city: true,
          itinerary: { include: { activity: true } }
        }
      },
      expenses: { orderBy: { createdAt: "desc" } }
    }
  });

  if (!trip) {
    return <div className="sketch-panel p-8 text-2xl font-black">Trip not found.</div>;
  }

  const activityCost = totalActivityCost(trip.stops.flatMap((stop) => stop.itinerary));
  const expenseCost = totalExpenseCost(trip.expenses);
  const total = activityCost + expenseCost;
  const byCategory = budgetByCategory(trip.expenses, activityCost);
  const highest = Math.max(...Array.from(byCategory.values()), 1);
  const overBudget = trip.budgetLimit > 0 && total > trip.budgetLimit;
  const uploadsEnabled = isR2Configured();

  return (
    <div className="grid gap-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Trip budget</p>
          <h1 className="text-4xl font-black text-ink">{trip.name}</h1>
        </div>
        <TripNav tripId={trip.id} />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="sketch-panel bg-lagoon p-5 text-white">
          <p className="text-sm font-black uppercase">Estimated total</p>
          <p className="mt-3 text-4xl font-black">{money(total)}</p>
        </div>
        <div className="sketch-panel bg-ticket p-5 text-ink">
          <p className="text-sm font-black uppercase">Average per day</p>
          <p className="mt-3 text-4xl font-black">{money(averagePerDay(total, trip.startDate, trip.endDate))}</p>
        </div>
        <div className={`sketch-panel p-5 ${overBudget ? "bg-coral text-white" : "bg-white text-ink"}`}>
          <p className="text-sm font-black uppercase">Budget limit</p>
          <p className="mt-3 text-4xl font-black">{trip.budgetLimit ? money(trip.budgetLimit) : "Unset"}</p>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
        <div className="sketch-panel grid gap-5 p-5">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="h-5 w-5 text-coral" />
            <h2 className="text-2xl font-black">Cost breakdown</h2>
          </div>
          <div className="grid gap-3">
            {categories.map((category) => {
              const value = byCategory.get(category) ?? 0;
              const width = `${Math.max(5, Math.round((value / highest) * 100))}%`;

              return (
                <div key={category} className="grid gap-2">
                  <div className="flex justify-between gap-3 text-sm font-black">
                    <span>{category.toLowerCase()}</span>
                    <span>{money(value)}</span>
                  </div>
                  <div className="h-4 border-2 border-ink bg-paper" style={{ borderRadius: 8 }}>
                    <div className="h-full bg-lagoon" style={{ width, borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <form action={addExpenseAction} className="sketch-panel doodle-map grid content-start gap-4 p-5" data-tour="budget-form">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-coral" />
            <h2 className="text-2xl font-black">Add expense</h2>
          </div>
          <input name="tripId" type="hidden" value={trip.id} />
          <label className="grid gap-2">
            <span className="label">Label</span>
            <input className="input" name="label" placeholder="Train pass" required />
          </label>
          <label className="grid gap-2">
            <span className="label">Vendor</span>
            <input className="input" name="vendor" placeholder="Rail, hotel, tour operator..." />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="label">Category</span>
              <select className="input" name="category" defaultValue="TRANSPORT">
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.toLowerCase()}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="label">Quantity</span>
              <input className="input" name="quantity" type="number" min="1" step="1" defaultValue="1" />
            </label>
            <label className="grid gap-2">
              <span className="label">Cost</span>
              <input className="input" name="unitCost" type="number" min="0" step="1" placeholder="120" required />
            </label>
            <label className="grid gap-2">
              <span className="label">Payment status</span>
              <select className="input" name="paidStatus" defaultValue="UNPAID">
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.toLowerCase()}
                  </option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2">
              <R2UploadField
                uploadsEnabled={uploadsEnabled}
                label="Receipt"
                name="receiptUrl"
                scope="receipt"
              />
            </div>
          </div>
          <label className="grid gap-2">
            <span className="label">Date</span>
            <input className="input" name="date" type="date" defaultValue={htmlDate(trip.startDate)} />
          </label>
          <button className="btn-primary" type="submit">
            Add to budget
          </button>
        </form>
      </section>

      <section className="grid gap-4">
        <h2 className="text-2xl font-black">Manual expenses</h2>
        <div className="grid gap-3">
          {trip.expenses.map((expense) => (
            <div key={expense.id} className="sketch-panel flex flex-wrap items-center justify-between gap-3 bg-white p-4">
              <div>
                <p className="font-black">{expense.label}</p>
                <p className="text-sm font-bold text-ink/60">
                  {expense.category.toLowerCase()} {expense.vendor ? `- ${expense.vendor}` : ""} {expense.date ? `- ${formatDate(expense.date)}` : ""}
                </p>
                <p className="text-xs font-bold text-ink/45">
                  {expense.paidStatus.toLowerCase()} - {expense.quantity} x {money(expense.unitCost ?? expense.amount)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {expense.receiptUrl ? (
                  <a className="btn-ghost" href={expense.receiptUrl} rel="noreferrer" target="_blank" title="Open receipt">
                    <Receipt className="h-4 w-4" />
                  </a>
                ) : null}
                <span className="font-black">{money(expense.amount)}</span>
                <form action={deleteExpenseAction}>
                  <input name="tripId" type="hidden" value={trip.id} />
                  <input name="expenseId" type="hidden" value={expense.id} />
                  <button className="btn-ghost text-coral" type="submit">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          ))}
          {trip.expenses.length === 0 ? <p className="sketch-panel p-5 font-bold text-ink/65">No manual expenses yet. Activity estimates already count toward the total.</p> : null}
        </div>
      </section>
    </div>
  );
}
