import { z } from "zod";
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
