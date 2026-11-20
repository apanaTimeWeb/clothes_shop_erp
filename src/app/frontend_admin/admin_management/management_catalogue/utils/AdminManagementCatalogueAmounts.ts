import type { Sale } from "@/app/frontend_admin/admin_management/management_catalogue/types/AdminManagementCatalogueCommerce";
import type { BillLine } from "@/app/frontend_admin/admin_management/management_catalogue/types/AdminManagementCatalogueCommerce";
export function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function moneyInput(value: unknown) {
  ensure(
    /^\d+(\.\d{1,2})?$/.test(String(value)),
    "Enter a non-negative amount with at most two decimal places.",
  );
  const result = Math.round(Number(value) * 100);
  ensure(
    Number.isSafeInteger(result) && result <= 100000000,
    "Amount is too large.",
  );
  return result;
}

export const uid = (prefix: string) =>
  `${prefix}-${globalThis.crypto.randomUUID()}`;

export function totals(
  lines: Pick<BillLine, "pricePaise" | "qty" | "lineDiscountPaise">[],
  discountPaise = 0,
  taxPercent = 0,
) {
  lines.forEach((l) =>
    ensure(
      Number.isSafeInteger(l.lineDiscountPaise ?? 0) &&
        (l.lineDiscountPaise ?? 0) >= 0 &&
        (l.lineDiscountPaise ?? 0) <= l.pricePaise * l.qty,
      "Line discount exceeds line value.",
    ),
  );
  const subtotalPaise = lines.reduce(
    (sum, line) =>
      sum + line.pricePaise * line.qty - (line.lineDiscountPaise ?? 0),
    0,
  );
  ensure(
    Number.isSafeInteger(subtotalPaise) && subtotalPaise >= 0,
    "Invalid bill amount.",
  );
  ensure(
    Number.isSafeInteger(discountPaise) &&
      discountPaise >= 0 &&
      discountPaise <= subtotalPaise,
    "Discount must be between zero and the subtotal.",
  );
  ensure(
    Number.isFinite(taxPercent) && taxPercent >= 0 && taxPercent <= 100,
    "Demo tax must be between 0% and 100%.",
  );
  const taxablePaise = subtotalPaise - discountPaise;
  const taxPaise = Math.round((taxablePaise * taxPercent) / 100);
  ensure(
    Number.isSafeInteger(taxablePaise + taxPaise),
    "Bill total exceeds safe money range.",
  );
  return {
    subtotalPaise,
    discountPaise,
    taxPercent,
    taxPaise,
    totalPaise: taxablePaise + taxPaise,
  };
}

export function paidForLine(sale: Sale, index: number) {
  const weights = sale.lines.map(
    (l) => l.pricePaise * l.qty - (l.lineDiscountPaise ?? 0),
  );
  const total = weights.reduce((a, b) => a + b, 0);
  if (!total) return 0;
  const before = weights.slice(0, index).reduce((a, b) => a + b, 0);
  return (
    Math.round((sale.totalPaise * (before + weights[index])) / total) -
    Math.round((sale.totalPaise * before) / total)
  );
}
