import type {
  Sale,
  BillLine,
} from "@/app/frontend_admin/admin_management/management_performance/types/AdminManagementPerformanceCommerce";
export function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

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
    (sum, line) => sum + line.pricePaise * line.qty - (line.lineDiscountPaise ?? 0),
    0,
  );
  ensure(Number.isSafeInteger(subtotalPaise) && subtotalPaise >= 0, "Invalid bill amount.");
  ensure(
    Number.isSafeInteger(discountPaise) && discountPaise >= 0 && discountPaise <= subtotalPaise,
    "Discount must be between zero and the subtotal.",
  );
  ensure(
    Number.isFinite(taxPercent) && taxPercent >= 0 && taxPercent <= 100,
    "Demo tax must be between 0% and 100%.",
  );
  const taxablePaise = subtotalPaise - discountPaise;
  const taxPaise = Math.round((taxablePaise * taxPercent) / 100);
  ensure(Number.isSafeInteger(taxablePaise + taxPaise), "Bill total exceeds safe money range.");
  return {
    subtotalPaise,
    discountPaise,
    taxPercent,
    taxPaise,
    totalPaise: taxablePaise + taxPaise,
  };
}

export function paidForLine(sale: Sale, index: number) {
  const weights = sale.lines.map((l) => l.pricePaise * l.qty - (l.lineDiscountPaise ?? 0));
  const total = weights.reduce((a, b) => a + b, 0);
  if (!total) return 0;
  const before = weights.slice(0, index).reduce((a, b) => a + b, 0);
  return (
    Math.round((sale.totalPaise * (before + weights[index])) / total) -
    Math.round((sale.totalPaise * before) / total)
  );
}

export function localDay(value: string | Date, timeZone = "Asia/Kolkata") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (name: string) => parts.find((p) => p.type === name)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function dateRange(preset: string, now = new Date()) {
  const end = localDay(now),
    anchor = new Date(`${end}T12:00:00Z`);
  if (preset === "week") anchor.setUTCDate(anchor.getUTCDate() - ((anchor.getUTCDay() + 6) % 7));
  if (preset === "month") anchor.setUTCDate(1);
  return {
    from: preset === "all" ? "" : anchor.toISOString().slice(0, 10),
    to: preset === "all" ? "" : end,
  };
}

export function inRange(at: string, from: string, to: string) {
  const day = localDay(at);
  return (!from || day >= from) && (!to || day <= to);
}

export function money(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(paise / 100);
}
