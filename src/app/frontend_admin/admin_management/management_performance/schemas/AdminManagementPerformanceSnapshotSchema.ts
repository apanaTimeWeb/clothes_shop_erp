import { validateReferences } from "@/app/frontend_admin/admin_management/management_performance/state/AdminManagementPerformanceIntegrity";
import { z } from "zod";
import { saleReturnSchema } from "@/app/frontend_admin/admin_management/management_performance/schemas/AdminManagementPerformanceInputSchema";
import { settingsSchema } from "@/app/frontend_admin/admin_management/management_performance/schemas/AdminManagementPerformanceInputSchema";
const id = z.string().min(1),
  whole = z.number().int().nonnegative().safe();
const line = z.object({
  pickId: id,
  variantId: id,
  locationId: id,
  qty: whole.positive(),
  pricePaise: whole,
  lineDiscountPaise: whole.optional(),
});
const amounts = {
  subtotalPaise: whole,
  discountPaise: whole,
  taxPercent: z.number().min(0).max(100),
  taxPaise: whole,
  totalPaise: whole,
};
export const demoSchema = z
  .object({
    schemaVersion: z.literal(1),
    revision: whole,
    products: z.array(
      z.object({
        id,
        designCode: id,
        name: id,
        departmentId: id,
        categoryId: id,
        fabric: id,
        sleeve: id,
        collar: id,
        fit: id,
        pattern: id,
        status: z.enum(["active", "archived"]),
        defaultPricePaise: whole,
        costPricePaise: whole,
        description: z.string(),
        createdAt: id,
      }),
    ),
    variants: z.array(
      z.object({
        id,
        productId: id,
        sku: id,
        colour: id,
        sizeCode: id,
        sizeSystem: id,
        packUnit: id,
        status: z.enum(["active", "archived"]),
        priceOverridePaise: whole.optional(),
      }),
    ),
    inventoryBalances: z.array(
      z
        .object({
          variantId: id,
          locationId: id,
          onHand: whole,
          nonSellable: whole,
        })
        .refine((b) => b.nonSellable <= b.onHand),
    ),
    images: z.array(
      z.object({
        productId: id,
        angle: id,
        colour: z.string().optional(),
        kind: z.enum(["placeholder", "actual", "representative"]),
        srcOrAssetKey: id,
        label: id,
      }),
    ),
    locations: z.array(z.object({ id, rack: id, shelf: id, box: id, active: z.boolean() })),
    departments: z.array(id),
    categories: z.array(id),
    sessions: z.array(z.object({ id, name: id, status: z.enum(["open", "closed"]), at: id })),
    shortlistItems: z.array(
      z.object({
        id,
        sessionId: id,
        variantId: id,
        qty: whole.positive(),
        status: z.enum(["shortlisted", "planned"]),
      }),
    ),
    pickItems: z.array(
      z.object({
        id,
        sessionId: id,
        variantId: id,
        locationId: id,
        qty: whole.positive(),
        status: z.enum([
          "awaiting",
          "retrieved",
          "return-pending",
          "returned",
          "purchased",
          "not-found",
          "cancelled",
        ]),
        retrievedAt: id.optional(),
      }),
    ),
    returnToBoxTasks: z.array(
      z.object({
        id,
        pickId: id,
        sessionId: id,
        locationId: id,
        qty: whole.positive(),
        status: z.enum(["pending", "returned"]),
        at: id,
        returnedAt: id.optional(),
      }),
    ),
    draftBills: z.array(
      z.object({
        id,
        sessionId: id,
        status: z.enum(["draft", "completed", "abandoned"]),
        at: id,
        discountPaise: whole,
        taxPercent: z.number().min(0).max(100),
        payment: z.enum(["Cash", "UPI", "Card"]),
        lines: z.array(line).min(1),
        saleId: id.optional(),
        returnId: id.optional(),
      }),
    ),
    sales: z.array(
      z.object({
        id,
        billId: id,
        returnId: id.optional(),
        sessionId: id,
        number: id,
        at: id,
        shopName: id,
        receiptNote: z.string().max(300).optional(),
        payment: z.enum(["Cash", "UPI", "Card"]),
        ...amounts,
        lines: z
          .array(
            line.extend({
              sku: id,
              name: id,
              colour: id,
              sizeCode: id,
              packUnit: id,
              costPaise: whole,
              productId: id.optional(),
              category: id.optional(),
              department: id.optional(),
            }),
          )
          .min(1),
      }),
    ),
    payments: z.array(z.object({ id, saleId: id, amountPaise: whole, label: id, at: id })),
    saleReturns: z.array(saleReturnSchema),
    stockMovements: z.array(
      z.object({
        id,
        variantId: id,
        qtyDelta: z.number().int().safe(),
        locationId: id,
        reason: id,
        referenceId: id,
        at: id,
      }),
    ),
    settings: settingsSchema,
    activeSessionId: id.nullable(),
  })
  .superRefine(validateReferences);
