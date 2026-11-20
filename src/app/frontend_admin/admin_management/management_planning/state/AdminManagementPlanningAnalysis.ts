import { t } from "@/app/frontend_admin/admin_management/management_planning/utils/AdminManagementPlanningMessages";
import type { AdminManagementPlanningState } from "@/app/frontend_admin/admin_management/management_planning/types/AdminManagementPlanningTypes";
import type { Operations } from "@/app/frontend_admin/admin_management/management_planning/schemas/AdminManagementPlanningOperationsSchema";
export function planStock(
  shop: AdminManagementPlanningState,
  ops: Operations,
  now: number,
  days: number,
  lead: number,
  safety: number,
) {
  return shop.variants
    .filter(
      (v) =>
        v.status === "active" &&
        shop.products.some((p) => p.id === v.productId && p.status === "active"),
    )
    .map((v) => {
      const balances = shop.inventoryBalances.filter((b) => b.variantId === v.id),
        onHand = balances.reduce((n, b) => n + b.onHand, 0),
        sellable = balances.reduce((n, b) => n + b.onHand - b.nonSellable, 0);
      const moves = shop.stockMovements
        .filter((m) => m.variantId === v.id && !m.reason.startsWith("transfer-"))
        .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
      const lots: { qty: number; at: number | null }[] = [];
      const opening = Math.max(0, onHand - moves.reduce((n, m) => n + m.qtyDelta, 0));
      if (opening) lots.push({ qty: opening, at: null });
      function consume(qty: number) {
        while (qty > 0 && lots.length) {
          const used = Math.min(qty, lots[0].qty);
          lots[0].qty -= used;
          qty -= used;
          if (!lots[0].qty) lots.shift();
        }
      }
      for (const m of moves) {
        if (m.qtyDelta > 0)
          lots.push({
            qty: m.qtyDelta,
            at:
              /purchase-receipt|restock|intake/i.test(m.reason) && Date.parse(m.at) <= now
                ? Date.parse(m.at)
                : null,
          });
        else if (m.qtyDelta < 0) consume(-m.qtyDelta);
      }
      const accounted = lots.reduce((n, l) => n + l.qty, 0);
      if (accounted < onHand) lots.unshift({ qty: onHand - accounted, at: null });
      else if (accounted > onHand) consume(accounted - onHand);
      const buckets = [0, 0, 0, 0, 0];
      for (const l of lots) {
        const age = l.at === null ? null : Math.max(0, (now - l.at) / 86400000);
        buckets[age === null ? 4 : age <= 30 ? 0 : age <= 60 ? 1 : age <= 90 ? 2 : 3] += l.qty;
      }
      const sold = shop.sales
        .filter((s) => Date.parse(s.at) >= now - days * 86400000 && Date.parse(s.at) <= now)
        .reduce(
          (n, s) => n + s.lines.filter((l) => l.variantId === v.id).reduce((n, l) => n + l.qty, 0),
          0,
        );
      const incoming = ops.purchases
        .filter((p) => ["ordered", "partial"].includes(p.status))
        .reduce(
          (n, p) =>
            n +
            p.lines
              .filter((l) => l.variantId === v.id)
              .reduce((n, l) => n + l.qty - (l.receivedQty || 0), 0),
          0,
        );
      const target = Math.ceil((sold / days) * lead) + safety;
      return {
        sku: v.sku,
        name: shop.products.find((p) => p.id === v.productId)!.name,
        colour: v.colour,
        size: v.sizeCode,
        sellable,
        onHand,
        sold,
        incoming,
        target,
        reorder: Math.max(0, target - sellable - incoming),
        buckets,
      };
    })
    .sort((a, b) => b.reorder - a.reorder || a.sku.localeCompare(b.sku));
}
export function exportPlan(rows: ReturnType<typeof planStock>) {
  const clean = (v: unknown) =>
    '"' +
    String(v)
      .replace(/^[=+@-]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  const csv = [
    [
      t("message17"),
      t("message30"),
      t("message18"),
      t("message19"),
      t("message31"),
      t("message21"),
      t("message22"),
      t("message23"),
      t("message32"),
      t("message33"),
      t("message34"),
      t("message35"),
      t("message28"),
    ],
    ...rows.map((r) => [
      r.sku,
      r.name,
      r.sellable,
      r.onHand,
      r.sold,
      r.incoming,
      r.target,
      r.reorder,
      ...r.buckets,
    ]),
  ]
    .map((r) => r.map(clean).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "stock-ageing-reorder.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
