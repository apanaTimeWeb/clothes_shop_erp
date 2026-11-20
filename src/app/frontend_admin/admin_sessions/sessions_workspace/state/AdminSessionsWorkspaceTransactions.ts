import seed from "@/app/frontend_admin/admin_sessions/sessions_workspace/mocks/AdminSessionsWorkspaceFixture.json";
import type {
  AdminSessionsWorkspaceState,
  ActionType,
  Payload,
  Variant,
  AdminSessionsWorkspaceAction,
} from "@/app/frontend_admin/admin_sessions/sessions_workspace/types/AdminSessionsWorkspaceTypes";
import {
  ensure,
  quantity,
  uid,
} from "@/app/frontend_admin/admin_sessions/sessions_workspace/utils/AdminSessionsWorkspaceAmounts";
import { totals } from "@/app/frontend_admin/admin_sessions/sessions_workspace/utils/AdminSessionsWorkspaceAmounts";
import { demoSchema } from "@/app/frontend_admin/admin_sessions/sessions_workspace/schemas/AdminSessionsWorkspaceSnapshotSchema";

export function createPresentationSeed(): AdminSessionsWorkspaceState {
  return structuredClone(seed) as AdminSessionsWorkspaceState;
}

export function billingAction(
  state: AdminSessionsWorkspaceState,
  type: ActionType,
  data: Payload,
  at: string,
) {
  if (type === "bill-create") {
    const sessionId = state.activeSessionId;
    ensure(sessionId, "Start a session first.");
    const busy = new Set(
      state.draftBills
        .filter((b) => b.status === "draft")
        .flatMap((b) => b.lines.map((l) => l.pickId)),
    );
    const picks = state.pickItems.filter(
      (p) =>
        p.sessionId === sessionId &&
        p.status === "retrieved" &&
        !busy.has(p.id),
    );
    ensure(
      picks.length,
      "Retrieve an item first. Items already in a draft cannot be added twice.",
    );
    state.draftBills.push({
      id: uid("bill"),
      sessionId,
      status: "draft",
      at,
      discountPaise: 0,
      taxPercent: state.settings.taxPercent,
      payment: "Cash",
      lines: picks.map((p) => ({
        pickId: p.id,
        variantId: p.variantId,
        locationId: p.locationId,
        qty: p.qty,
        pricePaise: priceFor(state, variantFor(state, p.variantId)),
      })),
    });
    return;
  }
  const bill = state.draftBills.find((b) => b.id === data.billId);
  ensure(
    bill && bill.status === "draft",
    "This bill was already completed or abandoned.",
  );
  if (type === "bill-abandon") {
    bill.status = "abandoned";
    return;
  }
  if (type === "bill-remove") {
    ensure(
      bill.lines.some((l) => l.pickId === data.pickId),
      "Bill line not found.",
    );
    if (bill.lines.length === 1) {
      bill.status = "abandoned";
      return;
    }
    bill.lines = bill.lines.filter((l) => l.pickId !== data.pickId);
    const subtotal = totals(bill.lines, 0, bill.taxPercent).subtotalPaise;
    bill.discountPaise = Math.min(bill.discountPaise, subtotal);
    return;
  }
  if (type === "bill-save") {
    ensure(
      data.quantities.length === bill.lines.length,
      "Bill lines changed. Reopen the bill.",
    );
    bill.lines.forEach((line, index) => {
      const pick = state.pickItems.find((p) => p.id === line.pickId);
      const qty = quantity(data.quantities[index]);
      ensure(
        pick && qty <= pick.qty,
        "Quantity cannot exceed retrieved units.",
      );
      line.qty = qty;
      if (data.lineDiscounts) {
        ensure(
          data.lineDiscounts.length === bill.lines.length,
          "Line discounts changed.",
        );
        line.lineDiscountPaise = data.lineDiscounts[index];
      }
    });
    totals(bill.lines, data.discountPaise, data.taxPercent);
    ensure(
      ["Cash", "UPI", "Card"].includes(data.payment),
      "Choose a valid demo payment label.",
    );
    Object.assign(bill, {
      discountPaise: data.discountPaise,
      taxPercent: data.taxPercent,
      payment: data.payment,
    });
    return;
  }
  ensure(type === "bill-complete", "Unknown billing action.");
  const amount = totals(bill.lines, bill.discountPaise, bill.taxPercent);
  const demands = new Map();
  for (const line of bill.lines) {
    quantity(line.qty);
    const pick = state.pickItems.find((p) => p.id === line.pickId);
    ensure(
      pick &&
        pick.status === "retrieved" &&
        pick.qty >= line.qty &&
        pick.variantId === line.variantId &&
        pick.locationId === line.locationId,
      "Retrieved allocation changed; reopen this bill.",
    );
    const v = variantFor(state, line.variantId);
    ensure(
      v?.status === "active" && productFor(state, v)?.status === "active",
      "A billed SKU is no longer active.",
    );
    const key = `${line.variantId}|${line.locationId}`;
    demands.set(key, (demands.get(key) || 0) + line.qty);
  }
  for (const [key, qty] of demands) {
    const [variantId, locationId] = key.split("|");
    ensure(
      sellable(state, variantId, locationId) >= qty,
      "Source stock is insufficient. No sale was posted.",
    );
  }
  const id = uid("sale");
  const sale = {
    id,
    billId: bill.id,
    returnId: bill.returnId,
    sessionId: bill.sessionId,
    number: `DEMO-${String(state.sales.length + 1).padStart(5, "0")}`,
    at,
    shopName: state.settings.shopName,
    receiptNote: state.settings.receiptNote,
    payment: bill.payment,
    ...amount,
    lines: bill.lines.map((line) => {
      const v = variantFor(state, line.variantId);
      return {
        ...line,
        sku: v.sku,
        name: productFor(state, v).name,
        colour: v.colour,
        sizeCode: v.sizeCode,
        packUnit: v.packUnit,
        costPaise: productFor(state, v).costPricePaise,
        productId: v.productId,
        category: productFor(state, v).categoryId,
        department: productFor(state, v).departmentId,
      };
    }),
  };
  for (const line of bill.lines) {
    state.inventoryBalances.find(
      (b) => b.variantId === line.variantId && b.locationId === line.locationId,
    )!.onHand -= line.qty;
    move(state, line.variantId, -line.qty, line.locationId, "sale", id, at);
    const pick = state.pickItems.find((p) => p.id === line.pickId)!;
    if (pick.qty === line.qty) pick.status = "purchased";
    else pick.qty -= line.qty;
  }
  state.sales.push(sale);
  state.payments.push({
    id: uid("payment"),
    saleId: id,
    amountPaise: amount.totalPaise,
    label: bill.payment,
    at,
  });
  bill.status = "completed";
  bill.saleId = id;
}

export const productFor = (
  state: AdminSessionsWorkspaceState,
  variant: Variant,
) => state.products.find((p) => p.id === variant.productId)!;

export const variantFor = (state: AdminSessionsWorkspaceState, id: string) =>
  state.variants.find((v) => v.id === id)!;

export const priceFor = (
  state: AdminSessionsWorkspaceState,
  variant: Variant,
) => variant.priceOverridePaise ?? productFor(state, variant).defaultPricePaise;

export const sellable = (
  state: AdminSessionsWorkspaceState,
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
  state: AdminSessionsWorkspaceState,
  id: string,
) => {
  const l = state.locations.find((item) => item.id === id);
  return l
    ? `Rack ${l.rack} / Shelf ${l.shelf} / Box ${l.box}`
    : "Location unavailable";
};

export const labelFor = (state: AdminSessionsWorkspaceState, id: string) => {
  const v = variantFor(state, id);
  return v
    ? `${productFor(state, v).name} · ${v.colour} / ${v.sizeCode}`
    : "Unknown SKU";
};

export const STORAGE_KEY = "clothes-shop.demo.next.v1";

export function transition(
  previous: AdminSessionsWorkspaceState,
  action: AdminSessionsWorkspaceAction,
  at = new Date().toISOString(),
): AdminSessionsWorkspaceState {
  if (
    !(
      [
        "session-new",
        "session-switch",
        "session-close",
        "shortlist-add",
        "shortlist-update",
        "shortlist-clear",
        "picks-generate",
        "pick-source",
        "pick-retrieve",
        "pick-reject",
        "pick-return",
        "pick-missing",
        "bill-create",
      ] as readonly string[]
    ).includes(action.type)
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
  if (/^(session-|shortlist-|pick-|picks-)/.test(action.type))
    sessionAction(next, action.type, payload, at);
  if (action.type.startsWith("bill-"))
    billingAction(next, action.type, payload, at);
  next.revision = previous.revision + 1;
  return demoSchema.parse(next);
}

export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function move(
  state: AdminSessionsWorkspaceState,
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

export function allocate(
  state: AdminSessionsWorkspaceState,
  variantId: string,
  input: unknown,
) {
  let qty = quantity(input);
  ensure(
    sellable(state, variantId) >= qty,
    "Not enough sellable stock. Refresh the selection.",
  );
  const result = [];
  for (const b of state.inventoryBalances.filter(
    (item) => item.variantId === variantId,
  )) {
    const take = Math.min(qty, b.onHand - b.nonSellable);
    if (take > 0) {
      result.push({ locationId: b.locationId, qty: take });
      qty -= take;
    }
    if (!qty) break;
  }
  return result;
}

export function sessionAction(
  state: AdminSessionsWorkspaceState,
  type: ActionType,
  data: Payload,
  at: string,
) {
  if (type === "session-new") {
    const id = uid("session");
    state.sessions.push({
      id,
      name: `Guest ${String(state.sessions.length + 1).padStart(2, "0")}`,
      status: "open",
      at,
    });
    state.activeSessionId = id;
    return;
  }
  const session = state.sessions.find(
    (s) => s.id === (data.sessionId || state.activeSessionId),
  );
  ensure(
    session && session.status === "open",
    "Start or choose an open customer session first.",
  );
  if (type === "session-switch") {
    state.activeSessionId = session.id;
    return;
  }
  const items = state.pickItems.filter((p) => p.sessionId === session.id);
  if (type === "session-close") {
    ensure(
      !items.some((p) => ["retrieved", "return-pending"].includes(p.status)),
      "Return or sell every retrieved item before closing this session.",
    );
    ensure(
      !state.draftBills.some(
        (d) => d.sessionId === session.id && d.status === "draft",
      ),
      "Abandon or complete this session’s bill first.",
    );
    items
      .filter((p) => p.status === "awaiting")
      .forEach((p) => (p.status = "cancelled"));
    session.status = "closed";
    state.activeSessionId = null;
    return;
  }
  if (type === "shortlist-add") {
    const qty = quantity(data.qty);
    const v = variantFor(state, data.variantId);
    ensure(
      v &&
        v.status === "active" &&
        state.products.find((p) => p.id === v.productId)?.status === "active",
      "This SKU is unavailable.",
    );
    const existing = state.shortlistItems.find(
      (i) =>
        i.sessionId === session.id &&
        i.variantId === v.id &&
        i.status === "shortlisted",
    );
    ensure(
      sellable(state, v.id) >= qty + (existing?.qty || 0),
      "The shortlist exceeds current availability.",
    );
    if (existing) existing.qty += qty;
    else
      state.shortlistItems.push({
        id: uid("shortlist"),
        sessionId: session.id,
        variantId: v.id,
        qty,
        status: "shortlisted",
      });
    return;
  }
  if (type === "shortlist-update") {
    const line = state.shortlistItems.find(
      (i) =>
        i.sessionId === session.id &&
        i.variantId === data.variantId &&
        i.status === "shortlisted",
    );
    ensure(line, "Shortlist item not found.");
    if (data.qty === 0)
      state.shortlistItems = state.shortlistItems.filter((i) => i !== line);
    else {
      const qty = quantity(data.qty);
      ensure(
        sellable(state, line.variantId) >= qty,
        "Quantity exceeds availability.",
      );
      line.qty = qty;
    }
    return;
  }
  if (type === "shortlist-clear") {
    state.shortlistItems = state.shortlistItems.filter(
      (i) => i.sessionId !== session.id || i.status !== "shortlisted",
    );
    return;
  }
  if (type === "picks-generate") {
    const lines = state.shortlistItems.filter(
      (i) => i.sessionId === session.id && i.status === "shortlisted",
    );
    ensure(lines.length, "Add a SKU to the shortlist first.");
    for (const line of lines) {
      for (const allocation of allocate(state, line.variantId, line.qty))
        state.pickItems.push({
          id: uid("pick"),
          sessionId: session.id,
          variantId: line.variantId,
          ...allocation,
          status: "awaiting",
        });
      line.status = "planned";
    }
    return;
  }
  const pick = items.find((p) => p.id === data.pickId);
  ensure(pick, "Pick line not found in this session.");
  ensure(
    !state.draftBills.some(
      (d) => d.status === "draft" && d.lines.some((l) => l.pickId === pick.id),
    ),
    "This item is in a draft. Abandon the draft before changing its handling.",
  );
  if (type === "pick-source") {
    ensure(
      pick.status === "awaiting",
      "Source can change before retrieval only.",
    );
    ensure(
      state.locations.some((l) => l.id === data.locationId && l.active) &&
        sellable(state, pick.variantId, data.locationId) >= pick.qty,
      "Insufficient stock at that source.",
    );
    pick.locationId = data.locationId;
    return;
  }
  if (type === "pick-retrieve") {
    ensure(pick.status === "awaiting", "This pick has already been handled.");
    ensure(
      sellable(state, pick.variantId, pick.locationId) >= pick.qty,
      "Source stock changed. Choose another source.",
    );
    pick.status = "retrieved";
    pick.retrievedAt = at;
    return;
  }
  if (type === "pick-reject") {
    ensure(
      pick.status === "retrieved",
      "Retrieve the item before rejecting it.",
    );
    pick.status = "return-pending";
    state.returnToBoxTasks.push({
      id: uid("return-task"),
      pickId: pick.id,
      sessionId: session.id,
      locationId: pick.locationId,
      qty: pick.qty,
      status: "pending",
      at,
    });
    return;
  }
  if (type === "pick-return") {
    ensure(
      pick.status === "return-pending",
      "This return was already handled or is not pending.",
    );
    pick.status = "returned";
    state.returnToBoxTasks
      .filter((t) => t.pickId === pick.id && t.status === "pending")
      .forEach((t) => {
        t.status = "returned";
        t.returnedAt = at;
      });
    return;
  }
  if (type === "pick-missing") {
    ensure(
      pick.status === "awaiting",
      "Only awaiting items can be marked not found.",
    );
    pick.status = "not-found";
    return;
  }
  throw new Error("Unknown session action.");
}
