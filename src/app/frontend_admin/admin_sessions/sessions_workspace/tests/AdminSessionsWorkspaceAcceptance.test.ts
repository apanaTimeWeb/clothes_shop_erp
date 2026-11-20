import { describe, it, expect } from "vitest";
import { createSeed } from "@/app/frontend_admin/admin_sessions/sessions_workspace/mocks/AdminSessionsWorkspaceSeed";
import { transition } from "@/app/frontend_admin/admin_sessions/sessions_workspace/state/AdminSessionsWorkspaceTransactions";
import { search } from "@/app/frontend_admin/admin_sessions/sessions_workspace/state/AdminSessionsWorkspaceSearch";
import { sellable } from "@/app/frontend_admin/admin_sessions/sessions_workspace/state/AdminSessionsWorkspaceTransactions";
import { salesReport } from "@/app/frontend_admin/admin_sessions/sessions_workspace/state/AdminSessionsWorkspaceReports";
const sku = "variant-1-0-3";
describe("named acceptance gaps", () => {
  it("E02/E03: builds 4 colours × 5 sizes and adds a colour without recreation", () => {
    let s = createSeed();
    const data = {
      ...s.products[0],
      id: undefined,
      designCode: "MATRIX20",
      colours: ["One", "Two", "Three", "Four"],
      sizes: ["XS", "S", "M", "L", "XL"],
      sizeSystem: "letter",
      packUnit: "piece",
    };
    s = transition(s, { type: "manage-product", data: { operation: data } });
    const id = s.products.at(-1)!.id,
      variants = s.variants.filter((v) => v.productId === id);
    expect(variants).toHaveLength(20);
    s = transition(s, {
      type: "manage-product",
      data: { operation: { ...data, id, colours: [...data.colours, "Five"] } },
    });
    expect(s.variants.filter((v) => v.productId === id)).toHaveLength(25);
    expect(variants.every((v) => s.variants.some((x) => x.id === v.id))).toBe(
      true,
    );
  });
  it("E04/E05: unavailable colour-size never borrows another colour's stock", () => {
    const s = createSeed();
    s.inventoryBalances
      .filter((b) => b.variantId === sku)
      .forEach((b) => {
        b.onHand = 0;
      });
    const r = search(s, "black cotton full sleeve collar tshirt XL");
    expect(r.exact).toHaveLength(1);
    expect(r.exact[0].available).toBe(0);
    expect(search(s, "42", { category: "Jeans" }).exact).toHaveLength(0);
  });
  it("E06: pack and single socks have distinct SKU units", () => {
    const s = createSeed(),
      packs = s.variants.filter(
        (v) =>
          s.products.find((p) => p.id === v.productId)?.categoryId === "Socks",
      );
    expect(packs.some((v) => v.packUnit === "3-pair pack")).toBe(true);
    expect(packs.some((v) => v.packUnit === "pair")).toBe(true);
    expect(new Set(packs.map((v) => v.sku)).size).toBe(packs.length);
  });
  it("E14/E18: conflicting filters return empty and clearing search cannot mutate stock", () => {
    const s = createSeed(),
      before = JSON.stringify(s.inventoryBalances);
    expect(search(s, "black cotton", { colour: "White" }).exact).toHaveLength(
      0,
    );
    expect(search(s).exact).toHaveLength(s.variants.length);
    expect(JSON.stringify(s.inventoryBalances)).toBe(before);
  });
  it("E29: emptied box remains active and findable", () => {
    let s = createSeed();
    for (const b of [
      ...s.inventoryBalances.filter((b) => b.locationId === "loc-1"),
    ])
      s = transition(s, {
        type: "manage-stock",
        data: {
          operation: {
            variantId: b.variantId,
            locationId: b.locationId,
            kind: "count",
            qty: 0,
            reason: "Physical zero",
            nonSellable: 0,
          },
        },
      });
    expect(s.locations.some((l) => l.id === "loc-1" && l.active)).toBe(true);
    expect(
      s.inventoryBalances
        .filter((b) => b.locationId === "loc-1")
        .every((b) => b.onHand === 0),
    ).toBe(true);
  });
  it("E34/E39: missing source stock blocks picking without inventing a box", () => {
    let s = transition(createSeed(), { type: "session-new" });
    s = transition(s, {
      type: "shortlist-add",
      data: { variantId: sku, qty: 1 },
    });
    s.inventoryBalances = s.inventoryBalances.filter(
      (b) => b.variantId !== sku,
    );
    const before = JSON.stringify(s);
    expect(() => transition(s, { type: "picks-generate" })).toThrow(
      "Not enough",
    );
    expect(JSON.stringify(s)).toBe(before);
  });
  it("E51: unavailable replacement leaves the original refund intact", () => {
    let s = transition(createSeed(), {
      type: "manage-pos",
      data: { operation: { sku: "TF001-1-XL", locationId: "loc-1", qty: 1 } },
    });
    s = transition(s, {
      type: "bill-complete",
      data: { billId: s.draftBills[0].id },
    });
    s = transition(s, {
      type: "manage-return",
      data: {
        operation: {
          saleId: s.sales[0].id,
          lineIndex: 0,
          qty: 1,
          locationId: "loc-1",
          condition: "sellable",
          reason: "Replacement",
        },
      },
    });
    const before = JSON.stringify(s);
    expect(() =>
      transition(s, {
        type: "manage-pos",
        data: {
          operation: {
            sku: "TF001-1-XL",
            locationId: "loc-1",
            qty: 999,
            returnId: s.saleReturns[0].id,
          },
        },
      }),
    ).toThrow();
    expect(JSON.stringify(s)).toBe(before);
    expect(s.saleReturns).toHaveLength(1);
  });
  it("E53: creating direct drafts never changes sales metrics or on-hand", () => {
    const s = createSeed(),
      n = transition(s, {
        type: "manage-pos",
        data: { operation: { sku: "TF001-1-XL", locationId: "loc-1", qty: 1 } },
      });
    expect(salesReport(n, "", "", "design").gross).toBe(0);
    expect(sellable(n, sku)).toBe(sellable(s, sku));
  });
});
