import type { AdminManagementPerformanceState } from "@/app/frontend_admin/admin_management/management_performance/types/AdminManagementPerformanceTypes";
import type { Offer } from "@/app/frontend_admin/admin_management/management_performance/schemas/AdminManagementPerformanceOffersSchema";
import { paidForLine } from "@/app/frontend_admin/admin_management/management_performance/utils/AdminManagementPerformanceAmounts";
export function campaignPerformance(
  shop: AdminManagementPerformanceState,
  offer: Offer,
  now: number,
) {
  const start = Date.parse(offer.startsAt),
    end = Math.min(now, Date.parse(offer.endsAt)),
    duration = Math.max(0, end - start + 1);
  function period(from: number, to: number) {
    let units = 0,
      paid = 0,
      refunds = 0,
      discounts = 0;
    const bills = new Set<string>();
    for (const sale of shop.sales) {
      const at = Date.parse(sale.at);
      if (at < from || at > to) continue;
      sale.lines.forEach((line, index) => {
        const product =
          line.productId ?? shop.variants.find((v) => v.id === line.variantId)?.productId;
        if (product !== offer.productId) return;
        units += line.qty;
        paid += paidForLine(sale, index);
        discounts += line.lineDiscountPaise || 0;
        bills.add(sale.id);
        refunds += shop.saleReturns
          .filter((r) => r.saleId === sale.id && r.lineIndex === index)
          .reduce((n, r) => n + r.refundPaise, 0);
      });
    }
    return {
      units,
      paid,
      refunds,
      net: Math.max(0, paid - refunds),
      lineDiscounts: discounts,
      bills: bills.size,
    };
  }
  return {
    duration,
    prior: period(start - duration, start - 1),
    during: period(start, end),
  };
}
