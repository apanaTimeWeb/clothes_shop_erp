import { z } from "zod";
import { readDocument } from "@/lib/browser_document";
import { offersSchema } from "@/app/frontend_admin/admin_billing/billing_checkout/schemas/AdminBillingCheckoutInputSchema";
import type { Offer } from "@/app/frontend_admin/admin_billing/billing_checkout/schemas/AdminBillingCheckoutInputSchema";
import seed from "@/app/frontend_admin/admin_billing/billing_checkout/mocks/AdminBillingCheckoutFixture.json";
import type {
  AdminBillingCheckoutState,
  ActionType,
  Payload,
  Variant,
  AdminBillingCheckoutAction,
} from "@/app/frontend_admin/admin_billing/billing_checkout/types/AdminBillingCheckoutTypes";
import {
  ensure,
  quantity,
  uid,
} from "@/app/frontend_admin/admin_billing/billing_checkout/utils/AdminBillingCheckoutAmounts";
import { totals } from "@/app/frontend_admin/admin_billing/billing_checkout/utils/AdminBillingCheckoutAmounts";
import { posInput } from "@/app/frontend_admin/admin_billing/billing_checkout/schemas/AdminBillingCheckoutInputSchema";
import { demoSchema } from "@/app/frontend_admin/admin_billing/billing_checkout/schemas/AdminBillingCheckoutSnapshotSchema";

export function createPresentationSeed(): AdminBillingCheckoutState {
  return structuredClone(seed) as AdminBillingCheckoutState;
}

export function billingAction(
  state: AdminBillingCheckoutState,
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
      (p) => p.sessionId === sessionId && p.status === "retrieved" && !busy.has(p.id),
    );
    ensure(picks.length, "Retrieve an item first. Items already in a draft cannot be added twice.");
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
  ensure(bill && bill.status === "draft", "This bill was already completed or abandoned.");
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
    ensure(data.quantities.length === bill.lines.length, "Bill lines changed. Reopen the bill.");
    bill.lines.forEach((line, index) => {
      const pick = state.pickItems.find((p) => p.id === line.pickId);
      const qty = quantity(data.quantities[index]);
      ensure(pick && qty <= pick.qty, "Quantity cannot exceed retrieved units.");
      line.qty = qty;
      if (data.lineDiscounts) {
        ensure(data.lineDiscounts.length === bill.lines.length, "Line discounts changed.");
        line.lineDiscountPaise = data.lineDiscounts[index];
      }
    });
    totals(bill.lines, data.discountPaise, data.taxPercent);
    ensure(["Cash", "UPI", "Card"].includes(data.payment), "Choose a valid demo payment label.");
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

export const productFor = (state: AdminBillingCheckoutState, variant: Variant) =>
  state.products.find((p) => p.id === variant.productId)!;

export const variantFor = (state: AdminBillingCheckoutState, id: string) =>
  state.variants.find((v) => v.id === id)!;

export const priceFor = (state: AdminBillingCheckoutState, variant: Variant) =>
  variant.priceOverridePaise ?? productFor(state, variant).defaultPricePaise;

export const sellable = (
  state: AdminBillingCheckoutState,
  variantId: string,
  locationId?: string,
) =>
  state.inventoryBalances
    .filter((b) => b.variantId === variantId && (!locationId || b.locationId === locationId))
    .reduce((sum, b) => sum + b.onHand - b.nonSellable, 0);

export const locationLabel = (state: AdminBillingCheckoutState, id: string) => {
  const l = state.locations.find((item) => item.id === id);
  return l ? `Rack ${l.rack} / Shelf ${l.shelf} / Box ${l.box}` : "Location unavailable";
};

export const labelFor = (state: AdminBillingCheckoutState, id: string) => {
  const v = variantFor(state, id);
  return v ? `${productFor(state, v).name} · ${v.colour} / ${v.sizeCode}` : "Unknown SKU";
};

export function managePos(s: AdminBillingCheckoutState, input: unknown, at: string) {
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
  ensure(!bill || bill.returnId === d.returnId, "Use the matching replacement bill.");
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
      !s.draftBills.some((b) => b.returnId === d.returnId && b.status !== "abandoned"),
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
  previous: AdminBillingCheckoutState,
  action: AdminBillingCheckoutAction,
  at = new Date().toISOString(),
): AdminBillingCheckoutState {
  if (
    !(
      [
        "bill-create",
        "bill-abandon",
        "bill-save",
        "bill-remove",
        "bill-complete",
        "manage-pos",
      ] as readonly string[]
    ).includes(action.type)
  )
    throw new Error("This action does not belong to this capability.");
  const next = action.type === "reset" ? createPresentationSeed() : structuredClone(previous);
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
  if (action.type.startsWith("bill-")) billingAction(next, action.type, payload, at);
  if (action.type === "manage-pos") managePos(next, payload.operation, at);
  next.revision = previous.revision + 1;
  return demoSchema.parse(next);
}

export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function loadDemo(storage: StoragePort) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return {
      state: raw ? demoSchema.parse(JSON.parse(raw)) : createPresentationSeed(),
      raw,
      warning: "",
    };
  } catch {
    return {
      state: createPresentationSeed(),
      raw: null,
      warning: "Saved data could not be read.",
    };
  }
}

export function persistTransition(storage: StoragePort, next: AdminBillingCheckoutState) {
  storage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function move(
  state: AdminBillingCheckoutState,
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

export function bestOffer(offers: Offer[], productId: string, price: number, now: number) {
  const active = offers.filter(
    (o) =>
      o.enabled &&
      o.productId === productId &&
      Date.parse(o.startsAt) <= now &&
      Date.parse(o.endsAt) >= now,
  );
  const discounts = active
    .map((offer) => ({
      offer,
      discount: Math.min(
        price,
        offer.kind === "percent" ? Math.round((price * offer.amount) / 100) : offer.amount,
      ),
    }))
    .sort((a, b) => b.discount - a.discount || a.offer.id.localeCompare(b.offer.id));
  return discounts.find((d) => d.discount > 0) || null;
}

export function loadCurrentOffers() {
  return {
    ...offersSchema.parse(
      JSON.parse(readDocument("clothes-shop.offers.v1") || '{"version":1,"offers":[]}'),
    ),
    at: Date.now(),
  };
}

const id = z.string().min(1).max(120),
  text = z.string().trim().max(500),
  money = z.number().int().safe().nonnegative().max(100000000);
export const supplierSchema = z.object({
  id,
  name: text.min(1),
  phone: text,
  email: text,
  notes: text,
  active: z.boolean(),
});
export const customerSchema = z.object({
  id,
  name: text.min(1),
  phone: text,
  email: text,
  preferences: text,
  consent: z.boolean(),
  active: z.boolean(),
});
export const purchaseSchema = z.object({
  id,
  supplierId: id,
  reference: text.min(1),
  status: z.enum(["ordered", "partial", "received", "cancelled"]),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  createdAt: z.string().datetime(),
  receivedAt: z.string().datetime().optional(),
  lines: z
    .array(
      z.object({
        variantId: id,
        locationId: id,
        qty: z.number().int().positive().max(100000),
        unitCostPaise: money,
        receivedQty: z.number().int().nonnegative().max(100000).optional(),
      }),
    )
    .min(1)
    .max(100),
});
export const offerUseSchema = z.object({
  billId: id,
  pickId: id,
  offerId: id,
  name: text,
  productId: id,
  qty: z.number().int().positive(),
  discountPaise: money,
  saleId: id.optional(),
  lineIndex: z.number().int().nonnegative().optional(),
});
export const operationsSchema = z
  .object({
    version: z.literal(1),
    supplierPayments: z
      .array(
        z.object({
          id,
          purchaseId: id,
          amountPaise: money.positive(),
          at: z.string().datetime(),
          reference: text.min(1),
          voided: z.boolean().default(false),
        }),
      )
      .max(10000)
      .default([]),
    offerDrafts: z.array(offerUseSchema).max(10000).default([]),
    offerUses: z.array(offerUseSchema).max(10000).default([]),
    suppliers: z.array(supplierSchema).max(1000),
    customers: z.array(customerSchema).max(5000),
    purchases: z.array(purchaseSchema).max(5000),
    saleLinks: z.array(z.object({ saleId: id, customerId: id })).max(10000),
    redemptions: z
      .array(
        z.object({
          id,
          customerId: id,
          points: z.number().int().positive().max(1000000),
          reason: text.min(1),
          at: z.string().datetime(),
          saleId: id.optional(),
        }),
      )
      .max(10000),
  })
  .superRefine((o, c) => {
    const fail = (message: string) => c.addIssue({ code: z.ZodIssueCode.custom, message });
    for (const list of [o.suppliers, o.customers, o.purchases, o.redemptions])
      if (new Set(list.map((x) => x.id)).size !== list.length) fail("Duplicate record ID");
    if (new Set(o.saleLinks.map((x) => x.saleId)).size !== o.saleLinks.length)
      fail("A sale can belong to only one customer");
    for (const p of o.purchases) {
      const received = p.lines.map((l) => l.receivedQty ?? (p.status === "received" ? l.qty : 0));
      if (
        p.lines.some((l, i) => received[i] > l.qty) ||
        (p.status === "received" && p.lines.some((l, i) => received[i] !== l.qty)) ||
        (p.status === "ordered" && received.some((q) => q > 0)) ||
        (p.status === "partial" &&
          (!received.some((q) => q > 0) || p.lines.every((l, i) => received[i] === l.qty)))
      )
        fail("Invalid received quantities");
      const paid = o.supplierPayments
        .filter((x) => x.purchaseId === p.id && !x.voided)
        .reduce((n, x) => n + x.amountPaise, 0);
      const cost = p.lines.reduce(
        (n, l, i) => n + (p.status === "cancelled" ? received[i] : l.qty) * l.unitCostPaise,
        0,
      );
      if (paid > cost) fail("Payment exceeds payable order value");
    }
    if (
      new Set(o.supplierPayments.map((x) => x.id)).size !== o.supplierPayments.length ||
      o.supplierPayments.some((x) => !o.purchases.some((p) => p.id === x.purchaseId))
    )
      fail("Invalid supplier payment reference");
    if (
      new Set(o.offerUses.map((x) => x.saleId + ":" + x.lineIndex)).size !== o.offerUses.length ||
      o.offerUses.some((x) => !x.saleId || x.lineIndex === undefined)
    )
      fail("Invalid offer usage record");
    const phones = o.customers.map((x) => x.phone.replace(/\D/g, "")).filter(Boolean);
    if (new Set(phones).size !== phones.length) fail("Duplicate customer phone");
    if (
      o.purchases.some(
        (p) =>
          !o.suppliers.some((s) => s.id === p.supplierId) ||
          (p.status === "received" && !p.receivedAt),
      )
    )
      fail("Invalid supplier or receipt date");
    if (
      o.saleLinks.some((l) => !o.customers.some((x) => x.id === l.customerId)) ||
      o.redemptions.some((l) => !o.customers.some((x) => x.id === l.customerId))
    )
      fail("Invalid customer reference");
  });
export type Operations = z.infer<typeof operationsSchema>;
export type Supplier = z.infer<typeof supplierSchema>;
export type Customer = z.infer<typeof customerSchema>;
export type Purchase = z.infer<typeof purchaseSchema>;
export const emptyOperations: Operations = {
  version: 1,
  supplierPayments: [],
  offerDrafts: [],
  offerUses: [],
  suppliers: [],
  customers: [],
  purchases: [],
  saleLinks: [],
  redemptions: [],
};

export const operationsKey = "clothes-shop.operations.v1";
export function pointBalance(shop: AdminBillingCheckoutState, ops: Operations, customerId: string) {
  const ids = new Set(
    ops.saleLinks.filter((x) => x.customerId === customerId).map((x) => x.saleId),
  );
  const earned = shop.sales
    .filter((s) => ids.has(s.id))
    .reduce(
      (n, s) =>
        n +
        Math.floor(
          Math.max(
            0,
            s.totalPaise -
              shop.saleReturns
                .filter((r) => r.saleId === s.id)
                .reduce((n, r) => n + r.refundPaise, 0),
          ) / 10000,
        ),
      0,
    );
  return (
    earned -
    ops.redemptions.filter((r) => r.customerId === customerId).reduce((n, r) => n + r.points, 0)
  );
}
export function retailTransition(
  previous: AdminBillingCheckoutState,
  action: AdminBillingCheckoutAction,
  rawOps: string | null,
) {
  const ops = operationsSchema.parse(JSON.parse(rawOps || JSON.stringify(emptyOperations)));
  const billId = action.data?.billId;
  const before = structuredClone(previous);
  let customerId = "",
    points = 0;
  if (action.type === "bill-complete") {
    const input = z
      .object({
        customerId: z.string().default(""),
        points: z.number().int().nonnegative().max(1000000).default(0),
      })
      .parse(action.data?.operation || {});
    customerId = input.customerId;
    points = input.points;
    ensure(!points || customerId, "Choose a customer before redeeming points.");
    if (customerId)
      ensure(
        ops.customers.some((c) => c.id === customerId && c.active && c.consent),
        "Select an active consenting customer.",
      );
    ensure(
      points <= Math.max(0, pointBalance(before, ops, customerId)),
      "Available loyalty points changed. Review checkout again.",
    );
    const bill = before.draftBills.find((b) => b.id === billId && b.status === "draft");
    ensure(bill, "Draft missing");
    ensure(
      bill.discountPaise + points * 100 <= totals(bill.lines).subtotalPaise,
      "Reward exceeds remaining bill subtotal.",
    );
    bill.discountPaise += points * 100;
  }
  const next = transition(before, action);
  if (action.type === "bill-save") {
    ops.offerDrafts = ops.offerDrafts.filter((x) => x.billId !== billId);
    if (action.data?.operation) {
      const bill = next.draftBills.find((b) => b.id === billId)!;
      const data = loadCurrentOffers();
      const requested = z.object({ applyOffers: z.literal(true) }).safeParse(action.data.operation);
      if (requested.success)
        for (const line of bill.lines) {
          const productId = next.variants.find((v) => v.id === line.variantId)!.productId;
          const deal = bestOffer(data.offers, productId, line.pricePaise, data.at);
          if (deal && line.lineDiscountPaise === deal.discount * line.qty)
            ops.offerDrafts.push({
              billId: bill.id,
              pickId: line.pickId,
              offerId: deal.offer.id,
              name: deal.offer.name,
              productId,
              qty: line.qty,
              discountPaise: deal.discount * line.qty,
            });
        }
    }
  }
  if (action.type === "bill-remove")
    ops.offerDrafts = ops.offerDrafts.filter(
      (x) => !(x.billId === billId && x.pickId === action.data?.pickId),
    );
  if (action.type === "bill-abandon")
    ops.offerDrafts = ops.offerDrafts.filter((x) => x.billId !== billId);
  if (action.type === "bill-complete") {
    const sale = next.sales.find((s) => s.billId === billId)!;
    if (customerId) ops.saleLinks.push({ saleId: sale.id, customerId });
    if (points)
      ops.redemptions.push({
        id: crypto.randomUUID(),
        customerId,
        points,
        reason: "Checkout reward (1 point = INR 1)",
        at: sale.at,
        saleId: sale.id,
      });
    sale.lines.forEach((line, lineIndex) => {
      const use = ops.offerDrafts.find(
        (x) =>
          x.billId === billId &&
          x.pickId === line.pickId &&
          x.qty === line.qty &&
          x.discountPaise === line.lineDiscountPaise,
      );
      if (use) ops.offerUses.push({ ...use, saleId: sale.id, lineIndex });
    });
    ops.offerDrafts = ops.offerDrafts.filter((x) => x.billId !== billId);
  }
  return { next, ops: operationsSchema.parse(ops) };
}
