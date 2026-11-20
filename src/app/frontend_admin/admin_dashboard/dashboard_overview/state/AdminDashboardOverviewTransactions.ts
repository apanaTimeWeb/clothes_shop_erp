import seed from "@/app/frontend_admin/admin_dashboard/dashboard_overview/mocks/AdminDashboardOverviewFixture.json";
import type {
  AdminDashboardOverviewState,
  AdminDashboardOverviewAction,
} from "@/app/frontend_admin/admin_dashboard/dashboard_overview/types/AdminDashboardOverviewTypes";
import { demoSchema } from "@/app/frontend_admin/admin_dashboard/dashboard_overview/schemas/AdminDashboardOverviewSnapshotSchema";

export function createPresentationSeed(): AdminDashboardOverviewState {
  return structuredClone(seed) as AdminDashboardOverviewState;
}

export const sellable = (
  state: AdminDashboardOverviewState,
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
  previous: AdminDashboardOverviewState,
  action: AdminDashboardOverviewAction,
  _at = new Date().toISOString(),
): AdminDashboardOverviewState {
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
