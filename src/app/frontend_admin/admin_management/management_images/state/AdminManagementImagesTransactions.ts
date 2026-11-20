import seed from "@/app/frontend_admin/admin_management/management_images/mocks/AdminManagementImagesFixture.json";
import type {
  AdminManagementImagesState,
  AdminManagementImagesAction,
  Payload,
} from "@/app/frontend_admin/admin_management/management_images/types/AdminManagementImagesTypes";
import { demoSchema } from "@/app/frontend_admin/admin_management/management_images/schemas/AdminManagementImagesSnapshotSchema";
import { z } from "zod";
import { imageInput } from "@/app/frontend_admin/admin_management/management_images/schemas/AdminManagementImagesInputSchema";
import { ensure } from "@/app/frontend_admin/admin_management/management_images/utils/AdminManagementImagesAmounts";

export function createPresentationSeed(): AdminManagementImagesState {
  return structuredClone(seed) as AdminManagementImagesState;
}

export const STORAGE_KEY = "clothes-shop.demo.next.v1";

export function transition(
  previous: AdminManagementImagesState,
  action: AdminManagementImagesAction,
  _at = new Date().toISOString(),
): AdminManagementImagesState {
  if (
    !(["manage-image", "manage-images"] as readonly string[]).includes(
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
  if (action.type === "manage-image") manageImage(next, payload.operation);
  if (action.type === "manage-images") manageImages(next, payload.operation);
  next.revision = previous.revision + 1;
  return demoSchema.parse(next);
}

export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function manageImages(s: AdminManagementImagesState, input: unknown) {
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

export function manageImage(s: AdminManagementImagesState, input: unknown) {
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
  const matches = (i: AdminManagementImagesState["images"][number]) =>
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
