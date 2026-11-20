import seed from "@/app/frontend_admin/admin_management/management_stock/mocks/AdminManagementStockFixture.json";
import type {
  AdminManagementStockState,
  Variant,
  AdminManagementStockAction,
  Payload,
} from "@/app/frontend_admin/admin_management/management_stock/types/AdminManagementStockTypes";
import { demoSchema } from "@/app/frontend_admin/admin_management/management_stock/schemas/AdminManagementStockSnapshotSchema";
import {
  uid,
  ensure,
} from "@/app/frontend_admin/admin_management/management_stock/utils/AdminManagementStockAmounts";
import {
  locationInput,
  stockInput,
} from "@/app/frontend_admin/admin_management/management_stock/schemas/AdminManagementStockInputSchema";

export function createPresentationSeed(): AdminManagementStockState {
  return structuredClone(seed) as AdminManagementStockState;
}

export const productFor = (
  state: AdminManagementStockState,
  variant: Variant,
) => state.products.find((p) => p.id === variant.productId)!;

export const variantFor = (state: AdminManagementStockState, id: string) =>
  state.variants.find((v) => v.id === id)!;

export const locationLabel = (state: AdminManagementStockState, id: string) => {
  const l = state.locations.find((item) => item.id === id);
  return l
    ? `Rack ${l.rack} / Shelf ${l.shelf} / Box ${l.box}`
    : "Location unavailable";
};

export const labelFor = (state: AdminManagementStockState, id: string) => {
  const v = variantFor(state, id);
  return v
    ? `${productFor(state, v).name} · ${v.colour} / ${v.sizeCode}`
    : "Unknown SKU";
};

export const STORAGE_KEY = "clothes-shop.demo.next.v1";

export function transition(
  previous: AdminManagementStockState,
  action: AdminManagementStockAction,
  at = new Date().toISOString(),
): AdminManagementStockState {
  if (
    !(["manage-location", "manage-stock"] as readonly string[]).includes(
      action.type,
    )
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
  if (action.type === "manage-location")
    manageLocation(next, payload.operation);
  if (action.type === "manage-stock") manageStock(next, payload.operation, at);
  next.revision = previous.revision + 1;
  return demoSchema.parse(next);
}

export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function move(
  state: AdminManagementStockState,
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

export function manageLocation(s: AdminManagementStockState, input: unknown) {
  const d = locationInput.parse(input),
    old = s.locations.find((l) => l.id === d.id);
  ensure(!d.id || old, "Location not found.");
  ensure(
    !s.locations.some(
      (l) =>
        l.id !== d.id &&
        [l.rack, l.shelf, l.box].join("|").toLowerCase() ===
          [d.rack, d.shelf, d.box].join("|").toLowerCase(),
    ),
    "This rack / shelf / box already exists.",
  );
  if (
    old &&
    (!d.active ||
      old.rack !== d.rack ||
      old.shelf !== d.shelf ||
      old.box !== d.box)
  ) {
    ensure(
      !s.inventoryBalances.some((b) => b.locationId === old.id && b.onHand > 0),
      "Empty the box before moving, renaming or disabling it.",
    );
    ensure(
      !s.pickItems.some(
        (p) =>
          p.locationId === old.id &&
          ["awaiting", "retrieved", "return-pending"].includes(p.status),
      ),
      "Resolve active picks in this box first.",
    );
  }
  if (old) Object.assign(old, d);
  else s.locations.push({ ...d, id: uid("location") });
}

export function manageStock(
  s: AdminManagementStockState,
  input: unknown,
  at: string,
) {
  const d = stockInput.parse(input);
  ensure(
    s.variants.some((v) => v.id === d.variantId),
    "Choose a valid SKU.",
  );
  ensure(
    s.locations.some((l) => l.id === d.locationId && l.active),
    "Choose an active source.",
  );
  ensure(
    !s.pickItems.some(
      (p) =>
        p.variantId === d.variantId &&
        [d.locationId, d.destinationId].includes(p.locationId) &&
        ["retrieved", "return-pending"].includes(p.status),
    ),
    "Return or bill physically retrieved units before changing this SKU's box balance.",
  );
  let b = s.inventoryBalances.find(
    (b) => b.variantId === d.variantId && b.locationId === d.locationId,
  );
  if (!b) {
    b = {
      variantId: d.variantId,
      locationId: d.locationId,
      onHand: 0,
      nonSellable: 0,
    };
    s.inventoryBalances.push(b);
  }
  const ref = uid("adjustment");
  if (d.kind === "transfer") {
    ensure(
      d.qty > 0 && b.onHand - b.nonSellable >= d.qty,
      "Transfer exceeds sellable source stock.",
    );
    ensure(
      d.destinationId !== d.locationId &&
        s.locations.some((l) => l.id === d.destinationId && l.active),
      "Choose a different active destination.",
    );
    let to = s.inventoryBalances.find(
      (x) => x.variantId === d.variantId && x.locationId === d.destinationId,
    );
    if (!to) {
      to = {
        variantId: d.variantId,
        locationId: d.destinationId!,
        onHand: 0,
        nonSellable: 0,
      };
      s.inventoryBalances.push(to);
    }
    b.onHand -= d.qty;
    to.onHand += d.qty;
    move(
      s,
      d.variantId,
      -d.qty,
      b.locationId,
      `transfer-out: ${d.reason}`,
      ref,
      at,
    );
    move(
      s,
      d.variantId,
      d.qty,
      to.locationId,
      `transfer-in: ${d.reason}`,
      ref,
      at,
    );
  } else if (d.kind === "damage") {
    ensure(
      d.qty > 0 && d.qty <= b.onHand - b.nonSellable,
      "Damage quantity exceeds sellable stock.",
    );
    b.nonSellable += d.qty;
    move(
      s,
      d.variantId,
      0,
      b.locationId,
      `damage ${d.qty}; non-sellable ${b.nonSellable}: ${d.reason}`,
      ref,
      at,
    );
  } else {
    const damaged = d.nonSellable ?? 0;
    ensure(damaged <= d.qty, "Non-sellable count exceeds physical count.");
    const delta = d.qty - b.onHand;
    move(
      s,
      d.variantId,
      delta,
      b.locationId,
      `count ${b.onHand}→${d.qty}; non-sellable ${b.nonSellable}→${damaged}: ${d.reason}`,
      ref,
      at,
    );
    b.onHand = d.qty;
    b.nonSellable = damaged;
  }
}
