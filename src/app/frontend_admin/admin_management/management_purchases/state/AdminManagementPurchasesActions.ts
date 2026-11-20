import { t } from "@/app/frontend_admin/admin_management/management_purchases/utils/AdminManagementPurchasesMessages";
import type { AdminManagementPurchasesState } from "@/app/frontend_admin/admin_management/management_purchases/types/AdminManagementPurchasesTypes";
import type {
  Operations,
  Purchase,
} from "@/app/frontend_admin/admin_management/management_purchases/schemas/AdminManagementPurchasesOperationsSchema";
export function receivePurchase(
  shop: AdminManagementPurchasesState,
  ops: Operations,
  id: string,
  quantities?: number[],
) {
  const order = ops.purchases.find((p) => p.id === id);
  if (!order || !["ordered", "partial"].includes(order.status)) throw Error(t("message49"));
  const received = order.lines.map((l) => l.receivedQty || 0);
  const amounts = quantities || order.lines.map((l, i) => l.qty - received[i]);
  if (
    amounts.length !== order.lines.length ||
    !amounts.some((q) => q > 0) ||
    amounts.some((q, i) => !Number.isInteger(q) || q < 0 || q > order.lines[i].qty - received[i])
  )
    throw Error(t("upgrade23"));
  for (const line of order.lines) {
    const v = shop.variants.find((v) => v.id === line.variantId && v.status === "active");
    if (
      !v ||
      !shop.products.some((p) => p.id === v.productId && p.status === "active") ||
      !shop.locations.some((l) => l.id === line.locationId && l.active)
    )
      throw Error(t("message50"));
  }
  const at = new Date().toISOString();
  for (const [index, line] of order.lines.entries()) {
    const qty = amounts[index];
    if (!qty) continue;
    let balance = shop.inventoryBalances.find(
      (b) => b.variantId === line.variantId && b.locationId === line.locationId,
    );
    if (!balance) {
      balance = {
        variantId: line.variantId,
        locationId: line.locationId,
        onHand: 0,
        nonSellable: 0,
      };
      shop.inventoryBalances.push(balance);
    }
    balance.onHand += qty;
    shop.stockMovements.push({
      id: crypto.randomUUID(),
      variantId: line.variantId,
      locationId: line.locationId,
      qtyDelta: qty,
      reason: "purchase-receipt",
      referenceId: order.id,
      at,
    });
  }
  order.lines.forEach((l, i) => {
    l.receivedQty = received[i] + amounts[i];
  });
  order.status = order.lines.every((l) => l.receivedQty === l.qty) ? "received" : "partial";
  order.receivedAt = at;
  shop.revision++;
}
export const purchaseTotal = (p: Purchase) =>
  p.lines.reduce((n, l) => n + l.qty * l.unitCostPaise, 0);

export function supplierBalance(ops: Operations, supplierId: string) {
  const orders = ops.purchases.filter((p) => p.supplierId === supplierId),
    ids = new Set(orders.map((p) => p.id));
  const payable = orders.reduce(
    (n, p) =>
      n +
      p.lines.reduce(
        (m, l) => m + (p.status === "cancelled" ? l.receivedQty || 0 : l.qty) * l.unitCostPaise,
        0,
      ),
    0,
  );
  const paid = ops.supplierPayments
    .filter((x) => ids.has(x.purchaseId) && !x.voided)
    .reduce((n, x) => n + x.amountPaise, 0);
  return { payable, paid, outstanding: payable - paid };
}
