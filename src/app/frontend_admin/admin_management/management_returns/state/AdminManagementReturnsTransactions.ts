import { paidForLine } from "@/app/frontend_admin/admin_management/management_returns/utils/AdminManagementReturnsAmounts";
import seed from "@/app/frontend_admin/admin_management/management_returns/mocks/AdminManagementReturnsFixture.json";
import type {
  AdminManagementReturnsState,
  Variant,
  AdminManagementReturnsAction,
  Payload,
} from "@/app/frontend_admin/admin_management/management_returns/types/AdminManagementReturnsTypes";
import {
  posInput,
  returnInput,
} from "@/app/frontend_admin/admin_management/management_returns/schemas/AdminManagementReturnsInputSchema";
import {
  ensure,
  uid,
} from "@/app/frontend_admin/admin_management/management_returns/utils/AdminManagementReturnsAmounts";
import { demoSchema } from "@/app/frontend_admin/admin_management/management_returns/schemas/AdminManagementReturnsSnapshotSchema";

export function createPresentationSeed(): AdminManagementReturnsState {
  return structuredClone(seed) as AdminManagementReturnsState;
}

export const productFor = (
  state: AdminManagementReturnsState,
  variant: Variant,
) => state.products.find((p) => p.id === variant.productId)!;

export const priceFor = (
  state: AdminManagementReturnsState,
  variant: Variant,
) => variant.priceOverridePaise ?? productFor(state, variant).defaultPricePaise;

export const sellable = (
  state: AdminManagementReturnsState,
  variantId: string,
  locationId?: string,
) =>
  state.inventoryBalances
    .filter(
      (b) =>
        b.variantId === variantId &&
        (!locationId || b.locationId === locationId),
    )
    .reduce((sum, b) => sum + b.onHand - b.nonSellable, 0);

export const locationLabel = (
  state: AdminManagementReturnsState,
  id: string,
) => {
  const l = state.locations.find((item) => item.id === id);
  return l
    ? `Rack ${l.rack} / Shelf ${l.shelf} / Box ${l.box}`
    : "Location unavailable";
};

export function managePos(
  s: AdminManagementReturnsState,
  input: unknown,
  at: string,
) {
  const d = posInput.parse(input),
    v = s.variants.find((v) => v.sku.toLowerCase() === d.sku.toLowerCase());
  ensure(
    v &&
      v.status === "active" &&
      s.products.some((p) => p.id === v.productId && p.status === "active"),
    "Enter an exact active SKU.",
  );
  ensure(
    s.locations.some((l) => l.id === d.locationId && l.active) &&
      sellable(s, v.id, d.locationId) >= d.qty,
    "Insufficient sellable stock at that location.",
  );
  const bill = d.billId
    ? s.draftBills.find((b) => b.id === d.billId && b.status === "draft")
    : undefined;
  ensure(!d.billId || bill, "Choose an open draft.");
  ensure(
    !bill || bill.returnId === d.returnId,
    "Use the matching replacement bill.",
  );
  const already =
    bill?.lines
      .filter((l) => l.variantId === v.id && l.locationId === d.locationId)
      .reduce((n, l) => n + l.qty, 0) ?? 0;
  ensure(
    sellable(s, v.id, d.locationId) >= already + d.qty,
    "Combined bill quantity exceeds source stock.",
  );
  if (d.returnId && !bill) {
    ensure(
      s.saleReturns.some((r) => r.id === d.returnId),
      "Return not found.",
    );
    ensure(
      !s.draftBills.some(
        (b) => b.returnId === d.returnId && b.status !== "abandoned",
      ),
      "This return already has a replacement bill.",
    );
  }
  let sessionId = bill?.sessionId ?? s.activeSessionId;
  if (!sessionId) {
    sessionId = uid("session");
    s.sessions.push({
      id: sessionId,
      name: `Walk-in ${s.sessions.length + 1}`,
      status: "open",
      at,
    });
    s.activeSessionId = sessionId;
  }
  const pickId = uid("pick");
  s.pickItems.push({
    id: pickId,
    sessionId,
    variantId: v.id,
    locationId: d.locationId,
    qty: d.qty,
    status: "retrieved",
    retrievedAt: at,
  });
  const line = {
    pickId,
    variantId: v.id,
    locationId: d.locationId,
    qty: d.qty,
    pricePaise: priceFor(s, v),
  };
  if (bill) {
    bill.lines.push(line);
    return;
  }
  s.draftBills.push({
    id: uid("bill"),
    sessionId,
    status: "draft",
    at,
    discountPaise: 0,
    taxPercent: s.settings.taxPercent,
    payment: "Cash",
    returnId: d.returnId,
    lines: [
      {
        pickId,
        variantId: v.id,
        locationId: d.locationId,
        qty: d.qty,
        pricePaise: priceFor(s, v),
      },
    ],
  });
}

export const STORAGE_KEY = "clothes-shop.demo.next.v1";

export function transition(
  previous: AdminManagementReturnsState,
  action: AdminManagementReturnsAction,
  at = new Date().toISOString(),
): AdminManagementReturnsState {
  if (
    !(["manage-return", "manage-pos"] as readonly string[]).includes(
      action.type,
    )
  )
    throw new Error("This action does not belong to this capability.");
  const next =
    action.type === "reset"
      ? createPresentationSeed()
      : structuredClone(previous);
  const payload: Payload = {
    sessionId: "",
    variantId: "",
    locationId: "",
    pickId: "",
    billId: "",
    qty: "",
    quantities: [],
    discountPaise: 0,
    taxPercent: 0,
    payment: "Cash",
    ...action.data,
  };
  if (action.type === "manage-return")
    manageReturn(next, payload.operation, at);
  if (action.type === "manage-pos") managePos(next, payload.operation, at);
  next.revision = previous.revision + 1;
  return demoSchema.parse(next);
}

export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function move(
  state: AdminManagementReturnsState,
  variantId: string,
  qtyDelta: number,
  locationId: string,
  reason: string,
  referenceId: string,
  at: string,
) {
  state.stockMovements.push({
    id: uid("movement"),
    variantId,
    qtyDelta,
    locationId,
    reason,
    referenceId,
    at,
  });
}

export function returnQuote(
  s: AdminManagementReturnsState,
  saleId: string,
  index: number,
  qty: number,
) {
  const sale = s.sales.find((x) => x.id === saleId);
  ensure(sale && sale.lines[index], "Original invoice line not found.");
  const prior = s.saleReturns
    .filter((r) => r.saleId === saleId && r.lineIndex === index)
    .reduce((n, r) => n + r.qty, 0);
  const line = sale.lines[index];
  ensure(
    Number.isInteger(qty) && qty > 0 && prior + qty <= line.qty,
    "Return quantity exceeds unreturned sold units.",
  );
  const paid = paidForLine(sale, index);
  return (
    Math.round((paid * (prior + qty)) / line.qty) -
    Math.round((paid * prior) / line.qty)
  );
}

export function manageReturn(
  s: AdminManagementReturnsState,
  input: unknown,
  at: string,
) {
  const d = returnInput.parse(input),
    refundPaise = returnQuote(s, d.saleId, d.lineIndex, d.qty);
  ensure(
    s.locations.some((l) => l.id === d.locationId && l.active),
    "Choose an active return destination.",
  );
  const variantId = s.sales.find((x) => x.id === d.saleId)!.lines[d.lineIndex]
    .variantId;
  let b = s.inventoryBalances.find(
    (b) => b.variantId === variantId && b.locationId === d.locationId,
  );
  if (!b) {
    b = { variantId, locationId: d.locationId, onHand: 0, nonSellable: 0 };
    s.inventoryBalances.push(b);
  }
  b.onHand += d.qty;
  if (d.condition === "damaged") b.nonSellable += d.qty;
  const id = uid("refund");
  s.saleReturns.push({ ...d, id, refundPaise, at });
  move(
    s,
    variantId,
    d.qty,
    d.locationId,
    `sold-return (${d.condition}): ${d.reason}`,
    id,
    at,
  );
}
