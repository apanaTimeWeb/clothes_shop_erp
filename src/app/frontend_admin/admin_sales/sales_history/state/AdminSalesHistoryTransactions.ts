import seed from "@/app/frontend_admin/admin_sales/sales_history/mocks/AdminSalesHistoryFixture.json";
import type {
  AdminSalesHistoryState,
  Variant,
  AdminSalesHistoryAction,
} from "@/app/frontend_admin/admin_sales/sales_history/types/AdminSalesHistoryTypes";
import { demoSchema } from "@/app/frontend_admin/admin_sales/sales_history/schemas/AdminSalesHistorySnapshotSchema";

export function createPresentationSeed(): AdminSalesHistoryState {
  return structuredClone(seed) as AdminSalesHistoryState;
}

export const productFor = (state: AdminSalesHistoryState, variant: Variant) =>
  state.products.find((p) => p.id === variant.productId)!;

export const variantFor = (state: AdminSalesHistoryState, id: string) =>
  state.variants.find((v) => v.id === id)!;

export const locationLabel = (state: AdminSalesHistoryState, id: string) => {
  const l = state.locations.find((item) => item.id === id);
  return l
    ? `Rack ${l.rack} / Shelf ${l.shelf} / Box ${l.box}`
    : "Location unavailable";
};

export const labelFor = (state: AdminSalesHistoryState, id: string) => {
  const v = variantFor(state, id);
  return v
    ? `${productFor(state, v).name} · ${v.colour} / ${v.sizeCode}`
    : "Unknown SKU";
};

export const STORAGE_KEY = "clothes-shop.demo.next.v1";

export function transition(
  previous: AdminSalesHistoryState,
  action: AdminSalesHistoryAction,
  _at = new Date().toISOString(),
): AdminSalesHistoryState {
  if (!([] as readonly string[]).includes(action.type))
    throw new Error("This action does not belong to this capability.");
  const next =
    action.type === "reset"
      ? createPresentationSeed()
      : structuredClone(previous);

  next.revision = previous.revision + 1;
  return demoSchema.parse(next);
}

export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
