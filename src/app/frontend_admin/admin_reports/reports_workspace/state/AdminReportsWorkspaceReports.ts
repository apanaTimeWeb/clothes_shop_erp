import type { AdminReportsWorkspaceState } from "@/app/frontend_admin/admin_reports/reports_workspace/types/AdminReportsWorkspaceTypes";
import type { Sale } from "@/app/frontend_admin/admin_reports/reports_workspace/types/AdminReportsWorkspaceCommerce";
import type {
  ReportGroup,
  ReportRow,
} from "@/app/frontend_admin/admin_reports/reports_workspace/types/AdminReportsWorkspaceCommerce";
import {
  inRange,
  localDay,
} from "@/app/frontend_admin/admin_reports/reports_workspace/utils/AdminReportsWorkspaceDates";
import { paidForLine } from "@/app/frontend_admin/admin_reports/reports_workspace/utils/AdminReportsWorkspaceAmounts";
export function salesReport(
  s: AdminReportsWorkspaceState,
  from: string,
  to: string,
  group: ReportGroup,
) {
  const groups = new Map<string, ReportRow>(),
    days = new Map<string, { day: string; sales: number; refunds: number }>();
  const sales = s.sales.filter((x) => inRange(x.at, from, to)),
    returns = s.saleReturns.filter((x) => inRange(x.at, from, to));
  const day = (at: string) => {
    const key = localDay(at);
    if (!days.has(key)) days.set(key, { day: key, sales: 0, refunds: 0 });
    return days.get(key)!;
  };
  const row = (sale: Sale, index: number) => {
    const l = sale.lines[index],
      v = s.variants.find((v) => v.id === l.variantId),
      p = s.products.find((p) => p.id === v?.productId);
    const key =
      group === "design"
        ? (l.productId ?? p?.id ?? l.variantId)
        : group === "sku"
          ? l.variantId
          : group === "category"
            ? (l.category ?? p?.categoryId ?? "Unknown")
            : group === "size"
              ? l.sizeCode
              : l.colour;
    const label =
      group === "design" ? `${l.name} · ${key}` : group === "sku" ? l.sku : key;
    if (!groups.has(key))
      groups.set(key, {
        key,
        label,
        sold: 0,
        returned: 0,
        grossPaise: 0,
        refundPaise: 0,
        netPaise: 0,
        profitPaise: 0,
      });
    return groups.get(key)!;
  };
  for (const sale of sales) {
    day(sale.at).sales += sale.totalPaise;
    sale.lines.forEach((l, i) => {
      const r = row(sale, i),
        paid = paidForLine(sale, i),
        beforeTax = paidForLine(
          { ...sale, totalPaise: sale.subtotalPaise - sale.discountPaise },
          i,
        );
      r.sold += l.qty;
      r.grossPaise += paid;
      r.profitPaise += beforeTax - l.costPaise * l.qty;
    });
  }
  for (const refund of returns) {
    const sale = s.sales.find((x) => x.id === refund.saleId)!;
    const l = sale.lines[refund.lineIndex],
      r = row(sale, refund.lineIndex);
    r.returned += refund.qty;
    r.refundPaise += refund.refundPaise;
    day(refund.at).refunds += refund.refundPaise;
    const prior = s.saleReturns
      .slice(0, s.saleReturns.indexOf(refund))
      .filter(
        (x) => x.saleId === refund.saleId && x.lineIndex === refund.lineIndex,
      )
      .reduce((n, x) => n + x.qty, 0);
    const paid = paidForLine(
      { ...sale, totalPaise: sale.subtotalPaise - sale.discountPaise },
      refund.lineIndex,
    );
    const netRefund =
      Math.round((paid * (prior + refund.qty)) / l.qty) -
      Math.round((paid * prior) / l.qty);
    r.profitPaise -= netRefund;
    if (refund.condition === "sellable")
      r.profitPaise += l.costPaise * refund.qty;
  }
  const rows = [...groups.values()]
    .map((r) => ({ ...r, netPaise: r.grossPaise - r.refundPaise }))
    .sort((a, b) => b.netPaise - a.netPaise);
  const gross = sales.reduce((n, x) => n + x.totalPaise, 0),
    refunded = returns.reduce((n, x) => n + x.refundPaise, 0);
  return {
    rows,
    days: [...days.values()].sort((a, b) => a.day.localeCompare(b.day)),
    gross,
    refunded,
    net: gross - refunded,
    profit: rows.reduce((n, x) => n + x.profitPaise, 0),
    salesCount: sales.length,
    returnedUnits: returns.reduce((n, x) => n + x.qty, 0),
    payments: ["Cash", "UPI", "Card"].map((label) => ({
      label,
      amount: sales
        .filter((x) => x.payment === label)
        .reduce((n, x) => n + x.totalPaise, 0),
    })),
  };
}
