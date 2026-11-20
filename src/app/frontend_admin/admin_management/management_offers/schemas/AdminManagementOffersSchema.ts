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

export const catalogueSchema = z.object({
  products: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      designCode: z.string(),
      status: z.string(),
      createdAt: z.string(),
      defaultPricePaise: z.number(),
    }),
  ),
  variants: z.array(
    z.object({
      id: z.string(),
      productId: z.string(),
      status: z.string(),
      priceOverridePaise: z.number().optional(),
    }),
  ),
  inventoryBalances: z.array(
    z.object({
      variantId: z.string(),
      onHand: z.number(),
      nonSellable: z.number(),
    }),
  ),
  sales: z.array(
    z.object({
      id: z.string(),
      at: z.string(),
      lines: z.array(z.object({ variantId: z.string(), qty: z.number() })),
    }),
  ),
});
export type Catalogue = z.infer<typeof catalogueSchema>;
