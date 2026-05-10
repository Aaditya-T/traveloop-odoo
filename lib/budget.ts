import type { Activity, BudgetCategory, ItineraryItem, TripExpense } from "@prisma/client";
import { daysBetweenInclusive } from "@/lib/date";
import { invoiceLineAmount } from "@/lib/invoice";

export type ExpenseLike = Pick<TripExpense, "category" | "amount" | "quantity" | "unitCost" | "paidStatus">;
export type ActivityCostLike = Pick<ItineraryItem, "costOverride"> & {
  activity: Pick<Activity, "estimatedCost">;
};

export function money(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(amount);
}

export function totalActivityCost(items: ActivityCostLike[]) {
  return items.reduce((sum, item) => sum + (item.costOverride ?? item.activity.estimatedCost), 0);
}

export function totalExpenseCost(expenses: ExpenseLike[]) {
  return expenses.reduce((sum, expense) => sum + invoiceLineAmount(expense), 0);
}

export function budgetByCategory(expenses: ExpenseLike[], activityCost = 0) {
  const totals = new Map<BudgetCategory, number>();

  for (const expense of expenses) {
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + invoiceLineAmount(expense));
  }

  totals.set("ACTIVITIES", (totals.get("ACTIVITIES") ?? 0) + activityCost);
  return totals;
}

export function averagePerDay(total: number, startDate: Date, endDate: Date) {
  return Math.round(total / daysBetweenInclusive(startDate, endDate));
}
