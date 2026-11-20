import { describe, it, expect } from "vitest";
import { createPresentationSeed } from "@/app/frontend_admin/admin_billing/billing_checkout/state/AdminBillingCheckoutTransactions";
import { createSeed } from "@/app/frontend_admin/admin_billing/billing_checkout/mocks/AdminBillingCheckoutSeed";
import {
  transition,
  loadDemo,
  persistTransition,
  STORAGE_KEY,
} from "@/app/frontend_admin/admin_billing/billing_checkout/state/AdminBillingCheckoutTransactions";
import { demoSchema } from "@/app/frontend_admin/admin_billing/billing_checkout/schemas/AdminBillingCheckoutSnapshotSchema";
import { sellable } from "@/app/frontend_admin/admin_billing/billing_checkout/state/AdminBillingCheckoutTransactions";
import { search } from "@/app/frontend_admin/admin_billing/billing_checkout/state/AdminBillingCheckoutSearch";
import { totals } from "@/app/frontend_admin/admin_billing/billing_checkout/utils/AdminBillingCheckoutAmounts";
import type {
  AdminBillingCheckoutState,
  AdminBillingCheckoutAction,
} from "@/app/frontend_admin/admin_billing/billing_checkout/types/AdminBillingCheckoutTypes";
const sku = "variant-1-0-3";
function session(qty = 1) {
  let s = createSeed();
  for (const action of [
    { type: "session-new" },
    { type: "shortlist-add", data: { variantId: sku, qty } },
    { type: "picks-generate" },
  ] as AdminBillingCheckoutAction[])
    s = transition(s, action);
  for (const p of s.pickItems) s = transition(s, { type: "pick-retrieve", data: { pickId: p.id } });
  return s;
}
function draft(qty = 1) {
  return transition(session(qty), { type: "bill-create" });
}
function complete(s: AdminBillingCheckoutState) {
  return transition(s, {
    type: "bill-complete",
    data: { billId: s.draftBills[0].id },
  });
}
describe("canonical demo data", () => {
  it("contains 40 designs, all 7 departments, unique SKUs and cross-box stock", () => {
    const s = createSeed();
    expect(s.products).toHaveLength(40);
    expect(s.departments).toHaveLength(7);
    expect(s.variants.length).toBeGreaterThan(100);
    expect(new Set(s.variants.map((v) => v.sku)).size).toBe(s.variants.length);
    expect(sellable(s, sku)).toBe(7);
    expect(demoSchema.safeParse(s).success).toBe(true);
  });
  it.each([
    "black cotton full sleeve collar tshirt XL",
    "telecot shirt",
    "white formal shirt 42",
    "dark blue jeans 34",
    "ladies kurti XXL",
    "kids red dress",
    "black socks",
  ])("finds genuine exact variants for %s", (q) => {
    const s = createSeed(),
      r = search(s, q, { inStock: true });
    expect(r.exact.length).toBeGreaterThan(0);
    expect(r.exact.every((v) => !v.missing.length && v.available > 0)).toBe(true);
  });
  it("does not interpret price or design code as an exact numeric size", () => {
    const r = search(createSeed(), "shirt 420");
    expect(r.exact).toHaveLength(0);
  });
  it("separates alternatives and respects conflicting filters", () => {
    const r = search(createSeed(), "black cotton full sleeve collar tshirt XL", {
      colour: "White",
    });
    expect(r.exact).toHaveLength(0);
    expect(r.alternatives.every((x) => x.missing.includes("black"))).toBe(true);
  });
  it("preserves duplicate names as distinct products", () => {
    const s = createSeed(),
      same = s.products.filter((p) => p.name === "Everyday Cotton Polo");
    expect(same).toHaveLength(2);
    expect(same[0].id).not.toBe(same[1].id);
  });
});
describe("handling and isolation", () => {
  it("shortlisting merges quantities without deducting stock", () => {
    let s = transition(createSeed(), { type: "session-new" });
    s = transition(s, {
      type: "shortlist-add",
      data: { variantId: sku, qty: 1 },
    });
    s = transition(s, {
      type: "shortlist-add",
      data: { variantId: sku, qty: 2 },
    });
    expect(s.shortlistItems).toHaveLength(1);
    expect(s.shortlistItems[0].qty).toBe(3);
    expect(sellable(s, sku)).toBe(7);
  });
  it("retrieved rejection and physical return never create stock", () => {
    let s = session();
    const id = s.pickItems[0].id;
    s = transition(s, { type: "pick-reject", data: { pickId: id } });
    expect(s.returnToBoxTasks[0].status).toBe("pending");
    s = transition(s, { type: "pick-return", data: { pickId: id } });
    expect(sellable(s, sku)).toBe(7);
    expect(s.returnToBoxTasks[0].status).toBe("returned");
    expect(() => transition(s, { type: "pick-return", data: { pickId: id } })).toThrow();
  });
  it("keeps sessions isolated and blocks closing with unresolved retrievals", () => {
    let s = session();
    const first = s.activeSessionId,
      pickId = s.pickItems[0].id;
    expect(() => transition(s, { type: "session-close" })).toThrow();
    s = transition(s, { type: "session-new" });
    expect(s.activeSessionId).not.toBe(first);
    expect(() => transition(s, { type: "pick-reject", data: { pickId } })).toThrow();
  });
  it("records two allocations when a shortlist spans boxes", () => {
    const s = session(5);
    expect(s.pickItems.map((p) => p.qty)).toEqual([3, 2]);
    expect(s.pickItems.map((p) => p.locationId)).toEqual(["loc-1", "loc-5"]);
    expect(sellable(s, sku)).toBe(7);
  });
  it("supports alternate source selection and rejects short source", () => {
    let s = transition(createSeed(), { type: "session-new" });
    s = transition(s, {
      type: "shortlist-add",
      data: { variantId: sku, qty: 2 },
    });
    s = transition(s, { type: "picks-generate" });
    const pickId = s.pickItems[0].id;
    s = transition(s, {
      type: "pick-source",
      data: { pickId, locationId: "loc-5" },
    });
    expect(s.pickItems[0].locationId).toBe("loc-5");
    expect(() =>
      transition(s, {
        type: "pick-source",
        data: { pickId, locationId: "loc-2" },
      }),
    ).toThrow();
  });
});
describe("billing integrity", () => {
  it("drafts do not affect revenue or stock; completing commits exact allocations once", () => {
    const d = draft(5);
    expect(d.sales).toHaveLength(0);
    expect(sellable(d, sku)).toBe(7);
    const s = complete(d);
    expect(s.sales).toHaveLength(1);
    expect(sellable(s, sku, "loc-1")).toBe(0);
    expect(sellable(s, sku, "loc-5")).toBe(2);
    expect(s.stockMovements).toHaveLength(2);
    expect(s.payments[0].amountPaise).toBe(s.sales[0].totalPaise);
    expect(() => complete(s)).toThrow();
    expect(sellable(d, sku)).toBe(7);
  });
  it("rejects a whole multi-allocation sale if one source is short", () => {
    const d = draft(5);
    d.inventoryBalances.find((b) => b.variantId === sku && b.locationId === "loc-5")!.onHand = 0;
    const before = JSON.stringify(d);
    expect(() => complete(d)).toThrow("insufficient");
    expect(JSON.stringify(d)).toBe(before);
    expect(d.sales).toHaveLength(0);
  });
  it("partial purchase leaves residual retrieved quantity actionable", () => {
    let d = draft(3);
    d = transition(d, {
      type: "bill-save",
      data: {
        billId: d.draftBills[0].id,
        quantities: [1],
        discountPaise: 0,
        taxPercent: 0,
        payment: "Cash",
      },
    });
    let s = complete(d);
    expect(s.pickItems[0].qty).toBe(2);
    expect(s.pickItems[0].status).toBe("retrieved");
    s = transition(s, {
      type: "pick-reject",
      data: { pickId: s.pickItems[0].id },
    });
    s = transition(s, {
      type: "pick-return",
      data: { pickId: s.pickItems[0].id },
    });
    expect(sellable(s, sku)).toBe(6);
  });
  it("abandon releases a draft while keeping retrieved goods and stock", () => {
    let s = draft();
    s = transition(s, {
      type: "bill-abandon",
      data: { billId: s.draftBills[0].id },
    });
    expect(s.pickItems[0].status).toBe("retrieved");
    expect(sellable(s, sku)).toBe(7);
    expect(transition(s, { type: "bill-create" }).draftBills).toHaveLength(2);
  });
  it("locks handling of picked items that belong to a draft", () => {
    const s = draft();
    expect(() =>
      transition(s, {
        type: "pick-reject",
        data: { pickId: s.pickItems[0].id },
      }),
    ).toThrow("draft");
    expect(() => transition(s, { type: "bill-create" })).toThrow();
  });
  it("keeps historical sale snapshots independent of later catalogue edits", () => {
    const s = complete(draft()),
      saved = JSON.stringify(s.sales[0]);
    s.products[0].defaultPricePaise = 199;
    s.products[0].name = "Changed";
    expect(JSON.stringify(s.sales[0])).toBe(saved);
  });
  it("uses deterministic paise rounding and rejects impossible discounts", () => {
    expect(totals([{ qty: 1, pricePaise: 999 }], 99, 5).totalPaise).toBe(945);
    expect(() => totals([{ qty: 1, pricePaise: 100 }], 101, 0)).toThrow();
    expect(() => totals([{ qty: 1, pricePaise: 100 }], 0, NaN)).toThrow();
  });
});
describe("restock and persistence", () => {
  it.each([-1, 0, 1.5, NaN, ""])(
    "rejects invalid quantity %s without changing the prior state",
    (qty) => {
      const s = createSeed(),
        before = JSON.stringify(s);
      expect(() =>
        transition(s, {
          type: "restock",
          data: { variantId: sku, locationId: "loc-1", qty },
        }),
      ).toThrow();
      expect(JSON.stringify(s)).toBe(before);
    },
  );
  it("restocks without replacing images and records a movement", () => {
    const s = createSeed(),
      next = transition(s, {
        type: "restock",
        data: { variantId: sku, locationId: "loc-1", qty: 5 },
      });
    expect(sellable(next, sku)).toBe(12);
    expect(next.images).toEqual(s.images);
    expect(next.stockMovements[0].qtyDelta).toBe(5);
  });
  it("restores a saved draft and refuses malformed persisted records", () => {
    const d = draft();
    const storage = { getItem: () => JSON.stringify(d), setItem: () => {} };
    expect(loadDemo(storage).state.draftBills).toEqual(d.draftBills);
    expect(loadDemo({ getItem: () => "{bad", setItem: () => {} }).warning).not.toBe("");
    const bad = createSeed();
    bad.inventoryBalances[0].nonSellable = 999;
    expect(demoSchema.safeParse(bad).success).toBe(false);
  });
  it("storage write failure prevents publication", () => {
    const before = draft(),
      next = complete(before);
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    expect(() => persistTransition(storage, next)).toThrow("Nothing was committed");
    expect(before.sales).toHaveLength(0);
  });
  it("reset restores exact seed records and advances revision", () => {
    const s = complete(draft()),
      reset = transition(s, { type: "reset" });
    expect({ ...reset, revision: 0 }).toEqual(createPresentationSeed());
    expect(reset.revision).toBe(s.revision + 1);
  });
  it("has a versioned browser key", () => {
    expect(STORAGE_KEY).toContain(".v1");
  });
});
