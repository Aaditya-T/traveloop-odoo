import { describe, expect, it } from "vitest";
import { invoiceLineAmount, invoiceTotals } from "@/lib/invoice";
import { canViewTrip, isDiscoverableTrip, isPubliclyVisibleTrip, isVisibleComment } from "@/lib/platform";

describe("visibility helpers", () => {
  it("allows public discovery but protects private trips", () => {
    expect(isDiscoverableTrip({ visibility: "PUBLIC" })).toBe(true);
    expect(isDiscoverableTrip({ visibility: "UNLISTED" })).toBe(false);
    expect(canViewTrip({ ownerId: "owner", visibility: "PRIVATE" }, "owner")).toBe(true);
    expect(canViewTrip({ ownerId: "owner", visibility: "PRIVATE" }, "guest")).toBe(false);
    expect(canViewTrip({ ownerId: "owner", visibility: "UNLISTED" }, "guest")).toBe(true);
  });

  it("excludes moderated public trips and hidden comments from public surfaces", () => {
    expect(isPubliclyVisibleTrip({ visibility: "PUBLIC", moderationStatus: "ACTIVE" })).toBe(true);
    expect(isPubliclyVisibleTrip({ visibility: "PUBLIC", moderationStatus: "TAKEN_DOWN" })).toBe(false);
    expect(isPubliclyVisibleTrip({ visibility: "PUBLIC", moderationStatus: "HIDDEN" })).toBe(false);
    expect(isVisibleComment({ moderationStatus: "ACTIVE" })).toBe(true);
    expect(isVisibleComment({ moderationStatus: "HIDDEN" })).toBe(false);
  });
});

describe("invoice helpers", () => {
  it("uses unit cost when available and splits partial payments", () => {
    const expenses = [
      { amount: 100, quantity: 2, unitCost: 80, paidStatus: "PAID" as const, category: "STAY" as const },
      { amount: 90, quantity: 1, unitCost: null, paidStatus: "PARTIAL" as const, category: "MEALS" as const },
      { amount: 45, quantity: 1, unitCost: null, paidStatus: "UNPAID" as const, category: "TRANSPORT" as const }
    ];

    expect(invoiceLineAmount(expenses[0])).toBe(160);
    expect(invoiceTotals(expenses)).toMatchObject({
      grandTotal: 295,
      paid: 205,
      pending: 90
    });
  });
});
