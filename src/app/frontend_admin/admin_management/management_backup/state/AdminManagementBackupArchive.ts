import { t } from "@/app/frontend_admin/admin_management/management_backup/utils/AdminManagementBackupMessages";
import { z } from "zod";
import { readDocument, commitDocuments, commitDocument } from "@/lib/browser_document";
import { demoSchema } from "@/app/frontend_admin/admin_management/management_backup/schemas/AdminManagementBackupSnapshotSchema";
import {
  operationsSchema,
  emptyOperations,
} from "@/app/frontend_admin/admin_management/management_backup/schemas/AdminManagementBackupOperationsSchema";
import { preferencesSchema } from "@/app/frontend_admin/admin_management/management_backup/schemas/AdminManagementBackupStudioSchema";
import { offersSchema } from "@/app/frontend_admin/admin_management/management_backup/schemas/AdminManagementBackupOffersSchema";
import fixture from "@/app/frontend_admin/admin_management/management_backup/mocks/AdminManagementBackupFixture.json";
export const completeSchema = z
  .object({
    format: z.literal("clothes-shop-complete"),
    version: z.literal(1),
    exportedAt: z.string().datetime(),
    shop: demoSchema,
    operations: operationsSchema,
    studio: preferencesSchema,
    offers: offersSchema,
  })
  .superRefine((v, c) => {
    const fail = (message: string) => c.addIssue({ code: z.ZodIssueCode.custom, message });
    const { shop, operations: o } = v;
    if (o.redemptions.some((r) => r.saleId && !shop.sales.some((s) => s.id === r.saleId)))
      fail(t("upgrade12"));
    for (const use of o.offerUses) {
      const sale = shop.sales.find((s) => s.id === use.saleId),
        line = sale?.lines[use.lineIndex ?? -1];
      if (
        !sale ||
        !line ||
        sale.billId !== use.billId ||
        line.pickId !== use.pickId ||
        line.qty !== use.qty ||
        line.lineDiscountPaise !== use.discountPaise
      )
        fail(t("upgrade13"));
    }
    for (const use of o.offerDrafts) {
      const bill = shop.draftBills.find((b) => b.id === use.billId && b.status === "draft"),
        line = bill?.lines.find((l) => l.pickId === use.pickId);
      if (!line || line.qty !== use.qty || line.lineDiscountPaise !== use.discountPaise)
        fail(t("upgrade14"));
    }

    if (o.saleLinks.some((l) => !shop.sales.some((s) => s.id === l.saleId))) fail(t("message38"));
    if (
      o.purchases.some((p) =>
        p.lines.some(
          (l) =>
            !shop.variants.some((v) => v.id === l.variantId) ||
            !shop.locations.some((x) => x.id === l.locationId),
        ),
      )
    )
      fail(t("message39"));
    if (
      Object.keys(v.studio).some((id) => !shop.products.some((p) => p.id === id)) ||
      v.offers.offers.some((o) => !shop.products.some((p) => p.id === o.productId))
    )
      fail(t("message40"));
    if (JSON.stringify(v.studio).length > 3500000) fail(t("message41"));
    for (const p of o.purchases.filter(
      (p) =>
        p.status === "received" ||
        p.status === "partial" ||
        p.lines.some((l) => (l.receivedQty || 0) > 0),
    )) {
      const expected = new Map<string, number>();
      for (const l of p.lines) {
        const key = l.variantId + ":" + l.locationId;
        expected.set(
          key,
          (expected.get(key) || 0) + (l.receivedQty ?? (p.status === "received" ? l.qty : 0)),
        );
      }
      for (const [key, qty] of expected) {
        const actual = shop.stockMovements
          .filter(
            (m) =>
              m.referenceId === p.id &&
              m.reason === "purchase-receipt" &&
              m.variantId + ":" + m.locationId === key,
          )
          .reduce((n, m) => n + m.qtyDelta, 0);
        if (actual !== qty) fail(t("message42"));
      }
    }
  });
export type Archive = z.infer<typeof completeSchema>;
export const keys = {
  shop: "clothes-shop.demo.next.v1",
  operations: "clothes-shop.operations.v1",
  studio: "clothes-shop.style-studio.v1",
  offers: "clothes-shop.offers.v1",
};
export function capture() {
  return completeSchema.parse({
    format: "clothes-shop-complete",
    version: 1,
    exportedAt: new Date().toISOString(),
    shop: JSON.parse(readDocument(keys.shop) || JSON.stringify(fixture)),
    operations: JSON.parse(readDocument(keys.operations) || JSON.stringify(emptyOperations)),
    studio: JSON.parse(readDocument(keys.studio) || "{}"),
    offers: JSON.parse(readDocument(keys.offers) || '{"version":1,"offers":[]}'),
  });
}
export function restore(archive: Archive) {
  const data = completeSchema.parse(archive);
  commitDocuments(
    (Object.keys(keys) as (keyof typeof keys)[]).map((name) => ({
      key: keys[name],
      expected: readDocument(keys[name]),
      value: JSON.stringify(data[name]),
    })),
  );
}
export function resetAll() {
  restore({
    format: "clothes-shop-complete",
    version: 1,
    exportedAt: new Date().toISOString(),
    shop: demoSchema.parse(fixture),
    operations: structuredClone(emptyOperations),
    studio: {},
    offers: { version: 1, offers: [] },
  });
}
export function download(archive: Archive) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(archive, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "clothes-shop-complete-backup.json";
  a.click();
  try {
    const key = "clothes-shop.backup-status.v1";
    commitDocument(
      key,
      readDocument(key),
      JSON.stringify({ requestedAt: new Date().toISOString() }),
    );
  } catch {
    /* A backup download must not fail because optional reminder metadata cannot be saved. */
  }
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
