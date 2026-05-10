import { ReceiptText } from "lucide-react";
import { PrintButton } from "@/components/print-button";
import { TripNav } from "@/components/trip-nav";
import { requireUser } from "@/lib/auth";
import { money } from "@/lib/budget";
import { formatDate } from "@/lib/date";
import { invoiceLineAmount, invoiceTotals } from "@/lib/invoice";
import { prisma } from "@/lib/prisma";

export default async function InvoicePage({ params }: { params: Promise<{ tripId: string }> }) {
  const user = await requireUser();
  const { tripId } = await params;
  const trip = await prisma.trip.findUnique({
    where: { id: tripId, ownerId: user.id },
    include: {
      owner: true,
      stops: { include: { city: true }, orderBy: { position: "asc" } },
      expenses: { orderBy: [{ date: "asc" }, { createdAt: "asc" }] }
    }
  });

  if (!trip) {
    return <div className="sketch-panel p-8 text-2xl font-black">Trip not found.</div>;
  }

  const totals = invoiceTotals(trip.expenses);

  return (
    <div className="grid gap-6">
      <section className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <p className="label">Expense invoice</p>
          <h1 className="text-4xl font-black text-ink">{trip.name}</h1>
        </div>
        <TripNav tripId={trip.id} />
      </section>

      <section className="sketch-panel overflow-hidden bg-white">
        <div className="grid gap-6 border-b-2 border-ink bg-paper p-6 lg:grid-cols-[1fr_0.75fr]">
          <div>
            <div className="stamp">Traveloop invoice</div>
            <h2 className="mt-4 text-4xl font-black text-ink">{trip.name}</h2>
            <p className="mt-2 text-sm font-bold text-ink/60">
              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
            </p>
            <p className="mt-3 text-sm leading-6 text-ink/70">
              Prepared for {trip.owner.name}. Route: {trip.stops.map((stop) => stop.city.name).join(" -> ") || "No stops added"}.
            </p>
          </div>
          <div className="sketch-panel grid gap-3 bg-white p-5">
            <ReceiptText className="h-8 w-8 text-coral" />
            <div className="flex justify-between text-sm font-black">
              <span>Grand total</span>
              <span>{money(totals.grandTotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-leaf">
              <span>Paid</span>
              <span>{money(totals.paid)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-coral">
              <span>Pending</span>
              <span>{money(totals.pending)}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto p-6">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-ink text-left">
                <th className="p-3">#</th>
                <th className="p-3">Category</th>
                <th className="p-3">Description</th>
                <th className="p-3">Vendor</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Unit</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {trip.expenses.map((expense, index) => (
                <tr key={expense.id} className="border-b border-ink/15">
                  <td className="p-3 font-black">{index + 1}</td>
                  <td className="p-3">{expense.category.toLowerCase()}</td>
                  <td className="p-3">
                    <p className="font-black">{expense.label}</p>
                    <p className="text-xs text-ink/55">{expense.date ? formatDate(expense.date) : "Flexible date"}</p>
                  </td>
                  <td className="p-3">{expense.vendor ?? "-"}</td>
                  <td className="p-3">{expense.quantity}</td>
                  <td className="p-3">{expense.unitCost ? money(expense.unitCost) : "-"}</td>
                  <td className="p-3">{expense.paidStatus.toLowerCase()}</td>
                  <td className="p-3 text-right font-black">{money(invoiceLineAmount(expense))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {trip.expenses.length === 0 ? <p className="py-8 text-center font-bold text-ink/60">Add expenses in the budget tab to build an invoice.</p> : null}
        </div>

        <div className="grid gap-4 border-t-2 border-ink bg-paper p-6 md:grid-cols-2">
          <div>
            <h3 className="text-xl font-black">Category totals</h3>
            <div className="mt-3 grid gap-2">
              {Array.from(totals.byCategory.entries()).map(([category, total]) => (
                <div key={category} className="flex justify-between text-sm font-black">
                  <span>{category.toLowerCase()}</span>
                  <span>{money(total)}</span>
                </div>
              ))}
            </div>
          </div>
          <PrintButton />
        </div>
      </section>
    </div>
  );
}
