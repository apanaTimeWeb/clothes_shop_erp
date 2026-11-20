import { z } from "zod";
const text = z.string().trim().min(1).max(120);

const money = z.number().int().nonnegative().max(100000000);

export const returnInput = z.object({
  saleId: text,
  lineIndex: z.number().int().nonnegative(),
  qty: z.number().int().positive().max(100000),
  locationId: text,
  condition: z.enum(["sellable", "damaged"]),
  reason: text,
});

export const saleReturnSchema = returnInput.extend({
  id: text,
  refundPaise: money,
  at: text,
});

export const settingsSchema = z.object({
  shopName: z.string().trim().min(1).max(120),
  taxPercent: z.number().min(0).max(100),
  lowStockThreshold: z.number().int().min(0).max(100000),
  timeZone: z.literal("Asia/Kolkata"),
  receiptNote: z.string().max(300).optional(),
  sizeVocabulary: z.array(z.string().trim().min(1).max(40)).max(80).optional(),
  fabricVocabulary: z
    .array(z.string().trim().min(1).max(80))
    .max(80)
    .optional(),
});

export const shortlistSchema = z.object({
  qty: z.coerce.number().int().min(1).max(100000),
});

export const offerSchema = z
  .object({
    id: z.string().min(1).max(100),
    productId: z.string().min(1).max(100),
    name: z.string().trim().min(1).max(80),
    kind: z.enum(["percent", "fixed"]),
    amount: z.number().int().positive().max(100000000),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    enabled: z.boolean(),
  })
  .refine((o) => o.kind !== "percent" || o.amount <= 90)
  .refine((o) => Date.parse(o.endsAt) > Date.parse(o.startsAt));
export const offersSchema = z
  .object({ version: z.literal(1), offers: z.array(offerSchema).max(1000) })
  .refine((d) => new Set(d.offers.map((o) => o.id)).size === d.offers.length);
export type Offer = z.infer<typeof offerSchema>;
