import seed from "@/app/frontend_admin/admin_reports/reports_workspace/mocks/AdminReportsWorkspaceFixture.json";
import type {
  AdminReportsWorkspaceState,
  AdminReportsWorkspaceAction,
} from "@/app/frontend_admin/admin_reports/reports_workspace/types/AdminReportsWorkspaceTypes";
import { demoSchema } from "@/app/frontend_admin/admin_reports/reports_workspace/schemas/AdminReportsWorkspaceSnapshotSchema";

export function createPresentationSeed(): AdminReportsWorkspaceState {
  return structuredClone(seed) as AdminReportsWorkspaceState;
}

export const variantFor = (state: AdminReportsWorkspaceState, id: string) =>
  state.variants.find((v) => v.id === id)!;

export const sellable = (
  state: AdminReportsWorkspaceState,
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
  state: AdminReportsWorkspaceState,
  id: string,
) => {
  const l = state.locations.find((item) => item.id === id);
  return l
    ? `Rack ${l.rack} / Shelf ${l.shelf} / Box ${l.box}`
    : "Location unavailable";
};

export const STORAGE_KEY = "clothes-shop.demo.next.v1";

export function transition(
  previous: AdminReportsWorkspaceState,
  action: AdminReportsWorkspaceAction,
  _at = new Date().toISOString(),
): AdminReportsWorkspaceState {
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
