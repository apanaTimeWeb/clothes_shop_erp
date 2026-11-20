import { z } from "zod";
const text = z.string().trim().min(1).max(120);

const money = z.number().int().nonnegative().max(100000000);

export const locationInput = z.object({
  id: z.string().optional(),
  rack: text,
  shelf: text,
  box: text,
  active: z.boolean(),
});

export const stockInput = z.object({
  variantId: text,
  locationId: text,
  destinationId: z.string().optional(),
  kind: z.enum(["transfer", "damage", "count"]),
  qty: z.number().int().nonnegative().max(100000),
  nonSellable: z.number().int().nonnegative().max(100000).optional(),
  reason: text,
});

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
