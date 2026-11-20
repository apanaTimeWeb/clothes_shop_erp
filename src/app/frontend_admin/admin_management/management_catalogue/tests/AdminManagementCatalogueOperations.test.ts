import { describe, it, expect } from "vitest";
import { createSeed } from "@/app/frontend_admin/admin_management/management_catalogue/mocks/AdminManagementCatalogueSeed";
import { createPresentationSeed } from "@/app/frontend_admin/admin_management/management_catalogue/state/AdminManagementCatalogueTransactions";
import {
  transition,
  loadDemo,
} from "@/app/frontend_admin/admin_management/management_catalogue/state/AdminManagementCatalogueTransactions";
import { demoSchema } from "@/app/frontend_admin/admin_management/management_catalogue/schemas/AdminManagementCatalogueSnapshotSchema";
import { sellable } from "@/app/frontend_admin/admin_management/management_catalogue/state/AdminManagementCatalogueTransactions";
import { returnQuote } from "@/app/frontend_admin/admin_management/management_catalogue/state/AdminManagementCatalogueTransactions";
import { paidForLine } from "@/app/frontend_admin/admin_management/management_catalogue/utils/AdminManagementCatalogueAmounts";
import type {
  AdminManagementCatalogueState,
  ActionType,
} from "@/app/frontend_admin/admin_management/management_catalogue/types/AdminManagementCatalogueTypes";
const variantId = "variant-1-0-3",
  locationId = "loc-1";
const act = (
  s: AdminManagementCatalogueState,
  type: ActionType,
  operation: unknown,
) => transition(s, { type, data: { operation } });
function sold(qty = 3) {
  let s = act(createSeed(), "manage-pos", {
    sku: "TF001-1-XL",
    locationId,
    qty,
  });
  s = transition(s, {
    type: "bill-save",
    data: {
      billId: s.draftBills[0].id,
      quantities: [qty],
      lineDiscounts: [101],
      discountPaise: 103,
      taxPercent: 5,
      payment: "UPI",
    },
  });
  return transition(s, {
    type: "bill-complete",
    data: { billId: s.draftBills[0].id },
  });
}
const product = (s: AdminManagementCatalogueState) => ({
  ...s.products[0],
  id: undefined,
  designCode: "NEW01",
  name: "New design",
  colours: ["Blue", "Red"],
  sizes: ["M", "L"],
  sizeSystem: "letter",
  packUnit: "piece",
});
describe("Phase 2 catalogue and locations", () => {
  it("creates a zero-stock colour × size matrix, preserves identities when extending", () => {
    let s = createSeed();
    s = act(s, "manage-product", product(s));
    const p = s.products.at(-1)!;
    const ids = s.variants.filter((v) => v.productId === p.id).map((v) => v.id);
    expect(ids).toHaveLength(4);
    expect(ids.every((id) => sellable(s, id) === 0)).toBe(true);
    s = act(s, "manage-product", {
      ...product(s),
      id: p.id,
      colours: ["Blue", "Red", "Green"],
    });
    expect(s.variants.filter((v) => v.productId === p.id)).toHaveLength(6);
    expect(ids.every((id) => s.variants.some((v) => v.id === id))).toBe(true);
  });
  it("rejects duplicate design code, case-equivalent sizes and missing vocabularies atomically", () => {
    const s = createSeed(),
      before = JSON.stringify(s);
    for (const patch of [
      { designCode: s.products[0].designCode },
      { sizes: ["M", "m"] },
      { categoryId: "missing" },
    ])
      expect(() =>
        act(s, "manage-product", { ...product(s), ...patch }),
      ).toThrow();
    expect(JSON.stringify(s)).toBe(before);
  });
  it("archives history without deleting inventory, blocks live picks", () => {
    let s = sold();
    s = act(s, "manage-archive", {
      kind: "product",
      id: "product-1",
      archived: true,
    });
    expect(s.sales[0].lines[0].name).toBe("Everyday Cotton Polo");
    expect(s.products[0].status).toBe("archived");
    s = act(createSeed(), "manage-pos", {
      sku: "TF001-1-XL",
      locationId,
      qty: 1,
    });
    expect(() =>
      act(s, "manage-archive", {
        kind: "variant",
        id: variantId,
        archived: true,
      }),
    ).toThrow("Resolve");
  });
  it("requires empty boxes for rename or disable and rejects duplicate paths", () => {
    const s = createSeed(),
      loc = s.locations[0];
    expect(() => act(s, "manage-location", { ...loc, active: false })).toThrow(
      "Empty",
    );
    expect(() => act(s, "manage-location", { ...loc, box: "New" })).toThrow(
      "Empty",
    );
    expect(() => act(s, "manage-location", { ...loc, id: undefined })).toThrow(
      "already exists",
    );
    const n = act(s, "manage-location", {
      rack: "Z",
      shelf: "9",
      box: "9",
      active: true,
    });
    expect(n.locations).toHaveLength(9);
  });
  it("renames used vocabulary but cannot remove it", () => {
    const s = createSeed();
    expect(() =>
      act(s, "manage-vocabulary", {
        kind: "categories",
        name: s.products[0].categoryId,
        remove: true,
      }),
    ).toThrow("still uses");
    const n = act(s, "manage-vocabulary", {
      kind: "departments",
      name: "Men",
      replacement: "Menswear",
    });
    expect(n.products[0].departmentId).toBe("Menswear");
  });
  it("stores colour/angle images, replaces same slot and rejects unsafe sources", () => {
    const s = createSeed(),
      image = {
        productId: "product-1",
        colour: "Black",
        angle: "side",
        label: "Side",
        src: "data:image/png;base64,YQ==",
      };
    let n = act(s, "manage-image", image);
    n = act(n, "manage-image", image);
    expect(n.images.filter((i) => i.angle === "side")).toHaveLength(1);
    expect(() =>
      act(n, "manage-image", {
        ...image,
        src: "data:image/svg+xml;base64,YQ==",
      }),
    ).toThrow();
    expect(() =>
      act(n, "manage-image", { ...image, colour: "Unknown" }),
    ).toThrow();
    n = act(n, "manage-image", { ...image, remove: true });
    expect(n.images).toEqual(s.images);
  });
});
describe("Phase 2 inventory accounting", () => {
  it("transfers conserve stock with paired movements sharing a reference", () => {
    const s = act(createSeed(), "manage-stock", {
      variantId,
      locationId,
      destinationId: "loc-5",
      kind: "transfer",
      qty: 2,
      reason: "Reorganise",
    });
    expect(sellable(s, variantId)).toBe(7);
    expect(sellable(s, variantId, locationId)).toBe(1);
    expect(s.stockMovements.map((m) => m.qtyDelta)).toEqual([-2, 2]);
    expect(s.stockMovements[0].referenceId).toBe(
      s.stockMovements[1].referenceId,
    );
  });
  it("damage changes availability without removing physical stock; counts reconcile both", () => {
    let s = act(createSeed(), "manage-stock", {
      variantId,
      locationId,
      kind: "damage",
      qty: 2,
      reason: "Torn",
    });
    expect(sellable(s, variantId, locationId)).toBe(1);
    expect(
      s.inventoryBalances.find(
        (b) => b.variantId === variantId && b.locationId === locationId,
      )?.onHand,
    ).toBe(3);
    s = act(s, "manage-stock", {
      variantId,
      locationId,
      kind: "count",
      qty: 1,
      nonSellable: 1,
      reason: "Counted",
    });
    expect(sellable(s, variantId, locationId)).toBe(0);
    expect(s.stockMovements.at(-1)?.qtyDelta).toBe(-2);
  });
  it.each([
    { kind: "transfer", qty: 4, destinationId: "loc-5" },
    { kind: "transfer", qty: 1, destinationId: locationId },
    { kind: "damage", qty: 4 },
    { kind: "count", qty: 1, nonSellable: 2 },
    { kind: "count", qty: 1.5 },
  ])("rejects invalid stock changes %j", (patch) => {
    const s = createSeed(),
      before = JSON.stringify(s);
    expect(() =>
      act(s, "manage-stock", {
        variantId,
        locationId,
        reason: "Test",
        ...patch,
      }),
    ).toThrow();
    expect(JSON.stringify(s)).toBe(before);
  });
  it("blocks physical changes until retrieved items are billed or returned", () => {
    const s = act(createSeed(), "manage-pos", {
      sku: "TF001-1-XL",
      locationId,
      qty: 1,
    });
    expect(() =>
      act(s, "manage-stock", {
        variantId,
        locationId,
        kind: "count",
        qty: 2,
        reason: "Count",
      }),
    ).toThrow("physically retrieved");
  });
});
describe("Phase 2 paid returns and replacements", () => {
  it("partial refunds sum exactly to paid total despite discounts and tax rounding", () => {
    let s = sold();
    const sale = s.sales[0],
      original = JSON.stringify(sale);
    for (let i = 0; i < 3; i++)
      s = act(s, "manage-return", {
        saleId: sale.id,
        lineIndex: 0,
        qty: 1,
        locationId,
        condition: i === 0 ? "damaged" : "sellable",
        reason: "Customer return",
      });
    expect(s.saleReturns.reduce((n, r) => n + r.refundPaise, 0)).toBe(
      sale.totalPaise,
    );
    expect(JSON.stringify(s.sales[0])).toBe(original);
    expect(sellable(s, variantId, locationId)).toBe(2);
    expect(() => returnQuote(s, sale.id, 0, 1)).toThrow("unreturned");
  });
  it("refunds use historical payment after catalogue prices change", () => {
    const s = sold();
    s.products[0].defaultPricePaise = 1;
    expect(returnQuote(s, s.sales[0].id, 0, 3)).toBe(s.sales[0].totalPaise);
  });
  it("allocates multi-line paid totals without losing paise", () => {
    const sale = sold().sales[0];
    sale.lines = [
      { ...sale.lines[0], qty: 1, pricePaise: 101, lineDiscountPaise: 0 },
      { ...sale.lines[0], qty: 1, pricePaise: 202, lineDiscountPaise: 0 },
    ];
    sale.totalPaise = 299;
    expect(paidForLine(sale, 0) + paidForLine(sale, 1)).toBe(299);
  });
  it("creates one linked replacement, never reuses returned unit allowance", () => {
    let s = sold();
    s = act(s, "manage-return", {
      saleId: s.sales[0].id,
      lineIndex: 0,
      qty: 1,
      locationId,
      condition: "sellable",
      reason: "Exchange",
    });
    const returnId = s.saleReturns[0].id;
    s = act(s, "manage-pos", {
      sku: "TF001-1-XL",
      locationId,
      qty: 1,
      returnId,
    });
    expect(() =>
      act(s, "manage-pos", { sku: "TF001-1-XL", locationId, qty: 1, returnId }),
    ).toThrow("already has");
    s = transition(s, {
      type: "bill-complete",
      data: { billId: s.draftBills.at(-1)!.id },
    });
    expect(s.sales.at(-1)?.returnId).toBe(returnId);
  });
  it("rejects stale repeated sale completion and invalid refunds without mutation", () => {
    const s = sold(),
      before = JSON.stringify(s);
    expect(() =>
      transition(s, {
        type: "bill-complete",
        data: { billId: s.draftBills[0].id },
      }),
    ).toThrow();
    expect(() =>
      act(s, "manage-return", {
        saleId: s.sales[0].id,
        lineIndex: 0,
        qty: 4,
        locationId,
        condition: "sellable",
        reason: "Test",
      }),
    ).toThrow();
    expect(JSON.stringify(s)).toBe(before);
  });
  it("direct POS only deducts on completion and rejects line discounts over value", () => {
    const s = act(createSeed(), "manage-pos", {
      sku: "TF001-1-XL",
      locationId,
      qty: 1,
    });
    expect(sellable(s, variantId)).toBe(7);
    expect(() =>
      transition(s, {
        type: "bill-save",
        data: {
          billId: s.draftBills[0].id,
          quantities: [1],
          lineDiscounts: [90000],
        },
      }),
    ).toThrow("Line discount");
  });
  it("presentation fixtures are deterministic, internally valid and leave Phase 1 saved data untouched", () => {
    const s = createPresentationSeed();
    expect(s).toEqual(createPresentationSeed());
    expect(s.sales).toHaveLength(2);
    expect(s.draftBills.filter((b) => b.status === "draft")).toHaveLength(2);
    expect(demoSchema.safeParse(s).success).toBe(true);
    const old = createSeed();
    expect(
      loadDemo({ getItem: () => JSON.stringify(old), setItem: () => {} }).state,
    ).toEqual(old);
  });
});
