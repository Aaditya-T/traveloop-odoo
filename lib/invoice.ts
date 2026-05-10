import type { TripExpense } from "@prisma/client";

export type InvoiceExpense = Pick<TripExpense, "amount" | "quantity" | "unitCost" | "paidStatus" | "category">;

export function invoiceLineAmount(expense: InvoiceExpense) {
  return expense.unitCost ? expense.unitCost * Math.max(expense.quantity, 1) : expense.amount;
}

export function deriveExpenseAmount(quantity: number, unitCost: number) {
  return Math.max(quantity, 1) * Math.max(unitCost, 0);
}

export function invoiceTotals(expenses: InvoiceExpense[]) {
  return expenses.reduce(
    (totals, expense) => {
      const amount = invoiceLineAmount(expense);
      totals.grandTotal += amount;

      if (expense.paidStatus === "PAID") {
        totals.paid += amount;
      } else if (expense.paidStatus === "PARTIAL") {
        totals.pending += Math.round(amount / 2);
        totals.paid += Math.floor(amount / 2);
      } else {
        totals.pending += amount;
      }

      totals.byCategory.set(expense.category, (totals.byCategory.get(expense.category) ?? 0) + amount);
      return totals;
    },
    {
      grandTotal: 0,
      paid: 0,
      pending: 0,
      byCategory: new Map<string, number>()
    }
  );
}
