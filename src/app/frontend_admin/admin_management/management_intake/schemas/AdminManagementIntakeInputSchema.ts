import { z } from "zod";
const text = z.string().trim().min(1).max(120);

const money = z.number().int().nonnegative().max(100000000);

export const productInput = z.object({
  id: z.string().optional(),
  designCode: text,
  name: text,
  departmentId: text,
  categoryId: text,
  fabric: text,
  sleeve: text,
  collar: text,
  fit: text,
  pattern: text,
  defaultPricePaise: money,
  costPricePaise: money,
  description: z.string().max(2000),
  colours: z.array(text).min(1).max(20),
  sizes: z.array(text).min(1).max(30),
  sizeSystem: text,
  packUnit: text,
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

export const imageInput = z.object({
  productId: text,
  colour: z.string().max(120),
  angle: text,
  label: text,
  remove: z.boolean().optional(),
  src: z.string().max(450000).optional(),
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
