import seed from "@/app/frontend_admin/admin_management/management_intake/mocks/AdminManagementIntakeFixture.json";
import type {
  AdminManagementIntakeState,
  AdminManagementIntakeAction,
  Payload,
} from "@/app/frontend_admin/admin_management/management_intake/types/AdminManagementIntakeTypes";
import { demoSchema } from "@/app/frontend_admin/admin_management/management_intake/schemas/AdminManagementIntakeSnapshotSchema";
import { z } from "zod";
import {
  productInput,
  imageInput,
} from "@/app/frontend_admin/admin_management/management_intake/schemas/AdminManagementIntakeInputSchema";
import {
  ensure,
  quantity,
  uid,
} from "@/app/frontend_admin/admin_management/management_intake/utils/AdminManagementIntakeAmounts";

export function createPresentationSeed(): AdminManagementIntakeState {
  return structuredClone(seed) as AdminManagementIntakeState;
}

export const variantFor = (state: AdminManagementIntakeState, id: string) =>
  state.variants.find((v) => v.id === id)!;

export const locationLabel = (
  state: AdminManagementIntakeState,
  id: string,
) => {
  const l = state.locations.find((item) => item.id === id);
  return l
    ? `Rack ${l.rack} / Shelf ${l.shelf} / Box ${l.box}`
    : "Location unavailable";
};

export const STORAGE_KEY = "clothes-shop.demo.next.v1";

export function transition(
  previous: AdminManagementIntakeState,
  action: AdminManagementIntakeAction,
  at = new Date().toISOString(),
): AdminManagementIntakeState {
  if (!(["manage-intake"] as readonly string[]).includes(action.type))
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
  if (action.type === "manage-intake")
    manageIntake(next, payload.operation, at);
  next.revision = previous.revision + 1;
  return demoSchema.parse(next);
}

export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const row = z.object({
  colour: z.string(),
  size: z.string(),
  locationId: z.string(),
  qty: z.number().int().nonnegative().max(100000),
});

const intake = z.object({
  product: productInput,
  rows: z.array(row).max(1200),
  images: z.array(imageInput.omit({ productId: true })).max(4),
});

export function manageIntake(
  s: AdminManagementIntakeState,
  input: unknown,
  at: string,
) {
  const d = intake.parse(input);
  manageProduct(s, d.product, at);
  const product = s.products.find(
    (p) => p.designCode.toLowerCase() === d.product.designCode.toLowerCase(),
  )!;
  ensure(
    product.status === "active",
    "Restore this design before receiving stock.",
  );
  const opening = new Set(
    s.variants
      .filter(
        (v) =>
          v.productId === product.id &&
          !s.stockMovements.some((m) => m.variantId === v.id) &&
          !s.inventoryBalances.some(
            (b) => b.variantId === v.id && b.onHand > 0,
          ),
      )
      .map((v) => v.id),
  );
  for (const row of d.rows) {
    if (!row.qty) continue;
    const v = s.variants.find(
      (v) =>
        v.productId === product.id &&
        v.colour.toLowerCase() === row.colour.toLowerCase() &&
        v.sizeCode.toLowerCase() === row.size.toLowerCase(),
    );
    ensure(v && v.status === "active", "Matrix contains an unavailable SKU.");
    restock(
      s,
      { variantId: v.id, locationId: row.locationId, qty: row.qty } as Payload,
      at,
    );
    if (opening.has(v.id)) s.stockMovements.at(-1)!.reason = "opening-stock";
  }
  if (d.images.length)
    manageImages(
      s,
      d.images.map((image) => ({ ...image, productId: product.id })),
    );
}

export function manageImages(s: AdminManagementIntakeState, input: unknown) {
  const batch = z.array(imageInput).min(1).max(4).parse(input);
  const slots = batch.map((i) =>
    [i.productId, i.colour, i.angle.toLowerCase()].join("|"),
  );
  ensure(
    new Set(slots).size === slots.length,
    "Choose a different angle for each photo.",
  );
  for (const image of batch) manageImage(s, image);
}

export function move(
  state: AdminManagementIntakeState,
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
  state: AdminManagementIntakeState,
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

export function manageProduct(
  s: AdminManagementIntakeState,
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

export function manageImage(s: AdminManagementIntakeState, input: unknown) {
  const d = imageInput.parse(input);
  ensure(
    s.products.some((p) => p.id === d.productId),
    "Design not found.",
  );
  ensure(
    !d.colour ||
      s.variants.some(
        (v) => v.productId === d.productId && v.colour === d.colour,
      ),
    "Choose a design colour.",
  );
  const matches = (i: AdminManagementIntakeState["images"][number]) =>
    i.productId === d.productId &&
    (i.colour ?? "") === d.colour &&
    i.angle.toLowerCase() === d.angle.toLowerCase();
  s.images = s.images.filter((i) => !matches(i));
  if (d.remove) return;
  ensure(
    d.src && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(d.src),
    "Use a JPEG, PNG or WebP image.",
  );
  ensure(
    s.images.filter((i) => i.kind === "actual").length < 12,
    "This demo stores up to 12 uploaded images. Remove an image first.",
  );
  ensure(
    s.images.reduce((n, i) => n + i.srcOrAssetKey.length, 0) + d.src.length <
      2500000,
    "Image storage limit reached. Remove an image first.",
  );
  s.images.push({
    productId: d.productId,
    colour: d.colour,
    angle: d.angle,
    label: d.label,
    kind: "actual",
    srcOrAssetKey: d.src,
  });
}
