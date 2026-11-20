import { paidForLine } from "@/app/frontend_admin/admin_management/management_catalogue/utils/AdminManagementCatalogueAmounts";
import seed from "@/app/frontend_admin/admin_management/management_catalogue/mocks/AdminManagementCatalogueFixture.json";
import type {
  AdminManagementCatalogueState,
  AdminManagementCatalogueAction,
  Payload,
} from "@/app/frontend_admin/admin_management/management_catalogue/types/AdminManagementCatalogueTypes";
import { demoSchema } from "@/app/frontend_admin/admin_management/management_catalogue/schemas/AdminManagementCatalogueSnapshotSchema";
import { z } from "zod";
import {
  ensure,
  uid,
} from "@/app/frontend_admin/admin_management/management_catalogue/utils/AdminManagementCatalogueAmounts";
import { productInput } from "@/app/frontend_admin/admin_management/management_catalogue/schemas/AdminManagementCatalogueInputSchema";

export function createPresentationSeed(): AdminManagementCatalogueState {
  return structuredClone(seed) as AdminManagementCatalogueState;
}

export const sellable = (
  state: AdminManagementCatalogueState,
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

export const STORAGE_KEY = "clothes-shop.demo.next.v1";

export function transition(
  previous: AdminManagementCatalogueState,
  action: AdminManagementCatalogueAction,
  at = new Date().toISOString(),
): AdminManagementCatalogueState {
  if (
    !(
      [
        "manage-product",
        "manage-archive",
        "manage-variant",
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
  if (action.type === "manage-product")
    manageProduct(next, payload.operation, at);
  if (action.type === "manage-archive") manageArchive(next, payload.operation);
  if (action.type === "manage-variant") manageVariant(next, payload.operation);
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

export function manageVariant(
  s: AdminManagementCatalogueState,
  input: unknown,
) {
  const d = z
    .object({
      id: z.string(),
      priceOverridePaise: z
        .number()
        .int()
        .nonnegative()
        .max(100000000)
        .nullable(),
    })
    .parse(input);
  const v = s.variants.find((v) => v.id === d.id);
  ensure(v, "Variant not found.");
  if (d.priceOverridePaise === null) delete v.priceOverridePaise;
  else v.priceOverridePaise = d.priceOverridePaise;
}

export function manageProduct(
  s: AdminManagementCatalogueState,
  input: unknown,
  at: string,
) {
  const d = productInput.parse(input),
    old = s.products.find((p) => p.id === d.id);
  ensure(!d.id || old, "Design not found.");
  ensure(
    s.departments.includes(d.departmentId) &&
      s.categories.includes(d.categoryId),
    "Choose an existing department and category.",
  );
  ensure(
    !s.products.some(
      (p) =>
        p.id !== d.id &&
        p.designCode.toLowerCase() === d.designCode.toLowerCase(),
    ),
    "Design code must be unique.",
  );
  ensure(
    new Set(d.colours.map((c) => c.toLowerCase())).size === d.colours.length &&
      new Set(d.sizes.map((c) => c.toLowerCase())).size === d.sizes.length,
    "Remove duplicate colours or sizes.",
  );
  const { colours, sizes, sizeSystem, packUnit, ...fields } = d;
  const id = old?.id ?? uid("product");
  if (old) Object.assign(old, fields, { id });
  else s.products.push({ ...fields, id, status: "active", createdAt: at });
  for (const colour of colours)
    for (const sizeCode of sizes) {
      const existing = s.variants.find(
        (v) =>
          v.productId === id &&
          v.colour.toLowerCase() === colour.toLowerCase() &&
          v.sizeCode.toLowerCase() === sizeCode.toLowerCase(),
      );
      if (!existing)
        s.variants.push({
          id: uid("variant"),
          productId: id,
          sku: `${d.designCode}-${colour}-${sizeCode}`
            .toUpperCase()
            .replace(/\s+/g, "-"),
          colour,
          sizeCode,
          sizeSystem,
          packUnit,
          status: "active",
        });
    }
  const destination = s.locations.find((l) => l.active);
  if (destination)
    for (const v of s.variants.filter((v) => v.productId === id)) {
      if (!s.inventoryBalances.some((b) => b.variantId === v.id))
        s.inventoryBalances.push({
          variantId: v.id,
          locationId: destination.id,
          onHand: 0,
          nonSellable: 0,
        });
    }
}

export function manageArchive(
  s: AdminManagementCatalogueState,
  input: unknown,
) {
  const d = z
    .object({
      id: z.string(),
      kind: z.enum(["product", "variant"]),
      archived: z.boolean(),
    })
    .parse(input);
  const record =
    d.kind === "product"
      ? s.products.find((p) => p.id === d.id)
      : s.variants.find((v) => v.id === d.id);
  ensure(record, "Record not found.");
  const ids =
    d.kind === "product"
      ? s.variants.filter((v) => v.productId === d.id).map((v) => v.id)
      : [d.id];
  ensure(
    !d.archived ||
      !s.pickItems.some(
        (p) =>
          ids.includes(p.variantId) &&
          ["awaiting", "retrieved", "return-pending"].includes(p.status),
      ),
    "Resolve active picks before archiving.",
  );
  record.status = d.archived ? "archived" : "active";
}

export function returnQuote(
  s: AdminManagementCatalogueState,
  saleId: string,
  index: number,
  qty: number,
) {
  const sale = s.sales.find((x) => x.id === saleId);
  ensure(sale && sale.lines[index], "Original invoice line not found.");
  const prior = s.saleReturns
    .filter((r) => r.saleId === saleId && r.lineIndex === index)
    .reduce((n, r) => n + r.qty, 0);
  const line = sale.lines[index];
  ensure(
    Number.isInteger(qty) && qty > 0 && prior + qty <= line.qty,
    "Return quantity exceeds unreturned sold units.",
  );
  const paid = paidForLine(sale, index);
  return (
    Math.round((paid * (prior + qty)) / line.qty) -
    Math.round((paid * prior) / line.qty)
  );
}
