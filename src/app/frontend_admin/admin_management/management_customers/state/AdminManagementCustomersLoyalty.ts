import type { AdminManagementCustomersState } from "@/app/frontend_admin/admin_management/management_customers/types/AdminManagementCustomersTypes";
import type { Operations } from "@/app/frontend_admin/admin_management/management_customers/schemas/AdminManagementCustomersOperationsSchema";
export function customerSummary(
  shop: AdminManagementCustomersState,
  ops: Operations,
  customerId: string,
) {
  const ids = new Set(
    ops.saleLinks.filter((l) => l.customerId === customerId).map((l) => l.saleId),
  );
  const sales = shop.sales.filter((s) => ids.has(s.id));
  const net = sales.reduce(
    (sum, s) =>
      sum +
      Math.max(
        0,
        s.totalPaise -
          shop.saleReturns.filter((r) => r.saleId === s.id).reduce((n, r) => n + r.refundPaise, 0),
      ),
    0,
  );
  const earned = sales.reduce(
    (sum, s) =>
      sum +
      Math.floor(
        Math.max(
          0,
          s.totalPaise -
            shop.saleReturns
              .filter((r) => r.saleId === s.id)
              .reduce((n, r) => n + r.refundPaise, 0),
        ) / 10000,
      ),
    0,
  );
  const redeemed = ops.redemptions
    .filter((r) => r.customerId === customerId)
    .reduce((n, r) => n + r.points, 0);
  return { sales, net, earned, redeemed, balance: earned - redeemed };
}
