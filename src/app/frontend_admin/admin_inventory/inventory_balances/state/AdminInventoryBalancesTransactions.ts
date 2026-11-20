import seed from "@/app/frontend_admin/admin_inventory/inventory_balances/mocks/AdminInventoryBalancesFixture.json";
import type {
  AdminInventoryBalancesState,
  Variant,
  AdminInventoryBalancesAction,
  Payload,
} from "@/app/frontend_admin/admin_inventory/inventory_balances/types/AdminInventoryBalancesTypes";
import { demoSchema } from "@/app/frontend_admin/admin_inventory/inventory_balances/schemas/AdminInventoryBalancesSnapshotSchema";
import {
  ensure,
  quantity,
  uid,
} from "@/app/frontend_admin/admin_inventory/inventory_balances/utils/AdminInventoryBalancesAmounts";

export function createPresentationSeed(): AdminInventoryBalancesState {
  return structuredClone(seed) as AdminInventoryBalancesState;
}

export const productFor = (
  state: AdminInventoryBalancesState,
  variant: Variant,
) => state.products.find((p) => p.id === variant.productId)!;

export const variantFor = (state: AdminInventoryBalancesState, id: string) =>
  state.variants.find((v) => v.id === id)!;

export const sellable = (
  state: AdminInventoryBalancesState,
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

export const locationLabel = (
  state: AdminInventoryBalancesState,
  id: string,
) => {
  const l = state.locations.find((item) => item.id === id);
  return l
    ? `Rack ${l.rack} / Shelf ${l.shelf} / Box ${l.box}`
    : "Location unavailable";
};

export const labelFor = (state: AdminInventoryBalancesState, id: string) => {
  const v = variantFor(state, id);
  return v
    ? `${productFor(state, v).name} · ${v.colour} / ${v.sizeCode}`
    : "Unknown SKU";
};

export const STORAGE_KEY = "clothes-shop.demo.next.v1";

export function transition(
  previous: AdminInventoryBalancesState,
  action: AdminInventoryBalancesAction,
  at = new Date().toISOString(),
): AdminInventoryBalancesState {
  if (
    !(["restock", "opening-stock"] as readonly string[]).includes(action.type)
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
  if (action.type === "restock" || action.type === "opening-stock") {
    if (
      action.type === "opening-stock" &&
      (next.inventoryBalances.some(
        (b) => b.variantId === payload.variantId && b.onHand > 0,
      ) ||
        next.stockMovements.some((m) => m.variantId === payload.variantId))
    )
      throw new Error(
        "Use restock or count for a SKU with existing stock/history.",
      );
    restock(next, payload, at);
    if (action.type === "opening-stock")
      next.stockMovements.at(-1)!.reason = "opening-stock";
  }
  next.revision = previous.revision + 1;
  return demoSchema.parse(next);
}

export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function move(
  state: AdminInventoryBalancesState,
  variantId: string,
  qtyDelta: number,
  locationId: string,
  reason: string,
  referenceId: string,
  at: string,
) {
  state.stockMovements.push({
    id: uid("movement"),
    variantId,
    qtyDelta,
    locationId,
    reason,
    referenceId,
    at,
  });
}

export function restock(
  state: AdminInventoryBalancesState,
  { variantId, locationId, qty: input }: Payload,
  at: string,
) {
  const qty = quantity(input);
  ensure(variantFor(state, variantId), "Choose a valid SKU.");
  ensure(
    state.locations.some((l) => l.id === locationId && l.active),
    "Choose an active destination.",
  );
  let balance = state.inventoryBalances.find(
    (b) => b.variantId === variantId && b.locationId === locationId,
  );
  if (!balance) {
    balance = { variantId, locationId, onHand: 0, nonSellable: 0 };
    state.inventoryBalances.push(balance);
  }
  balance.onHand += qty;
  move(state, variantId, qty, locationId, "restock", uid("restock"), at);
}
