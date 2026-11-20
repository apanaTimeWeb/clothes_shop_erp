import { z } from "zod";
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
