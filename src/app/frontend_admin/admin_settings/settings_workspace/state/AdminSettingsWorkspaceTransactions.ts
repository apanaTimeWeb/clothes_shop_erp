import {
  paidForLine,
  ensure,
} from "@/app/frontend_admin/admin_settings/settings_workspace/utils/AdminSettingsWorkspaceAmounts";
import seed from "@/app/frontend_admin/admin_settings/settings_workspace/mocks/AdminSettingsWorkspaceFixture.json";
import type {
  AdminSettingsWorkspaceState,
  AdminSettingsWorkspaceAction,
  Payload,
} from "@/app/frontend_admin/admin_settings/settings_workspace/types/AdminSettingsWorkspaceTypes";
import { demoSchema } from "@/app/frontend_admin/admin_settings/settings_workspace/schemas/AdminSettingsWorkspaceSnapshotSchema";
import { settingsSchema } from "@/app/frontend_admin/admin_settings/settings_workspace/schemas/AdminSettingsWorkspaceInputSchema";
import type {
  Sale,
  ReportGroup,
  ReportRow,
} from "@/app/frontend_admin/admin_settings/settings_workspace/types/AdminSettingsWorkspaceCommerce";
import {
  inRange,
  localDay,
} from "@/app/frontend_admin/admin_settings/settings_workspace/utils/AdminSettingsWorkspaceAmounts";
export function createPresentationSeed(): AdminSettingsWorkspaceState {
  return structuredClone(seed) as AdminSettingsWorkspaceState;
}

export const STORAGE_KEY = "clothes-shop.demo.next.v1";

export function transition(
  previous: AdminSettingsWorkspaceState,
  action: AdminSettingsWorkspaceAction,
  _at = new Date().toISOString(),
): AdminSettingsWorkspaceState {
  if (
    !(["settings-save", "demo-import", "reset"] as readonly string[]).includes(
      action.type,
    )
  )
    throw new Error("This action does not belong to this capability.");
  let next =
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
  if (action.type === "settings-save")
    next.settings = settingsSchema.parse(payload.operation);
  if (action.type === "demo-import")
    next = parseDemoImport(String(payload.operation ?? ""));
  next.revision = previous.revision + 1;
  return demoSchema.parse(next);
}

export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const MAX_IMPORT_BYTES = 5000000;

export function parseDemoImport(raw: string): AdminSettingsWorkspaceState {
  ensure(
    new TextEncoder().encode(raw).length <= MAX_IMPORT_BYTES,
    "Import exceeds the 5 MB demo limit.",
  );
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON: choose a complete exported demo file.");
  }
  if (value && typeof value === "object" && "format" in value) {
    const wrapped = value as {
      format: unknown;
      version: unknown;
      state: unknown;
    };
    ensure(
      wrapped.format === "clothes-shop-demo" && wrapped.version === 1,
      "Unsupported demo export format or version.",
    );
    value = wrapped.state;
  }
  if (value && typeof value === "object") {
    const count = Object.values(value).reduce<number>(
      (n, v) => n + (Array.isArray(v) ? v.length : 0),
      0,
    );
    ensure(count <= 10000, "Import exceeds the 10,000-record demo limit.");
  }
  const result = demoSchema.safeParse(value);
  if (!result.success)
    throw new Error(
      result.error.issues
        .slice(0, 12)
        .map((i) => `${i.path.join(".") || "records"}: ${i.message}`)
        .join("\n"),
    );
  return result.data;
}

export function exportDemo(state: AdminSettingsWorkspaceState) {
  return JSON.stringify(
    {
      format: "clothes-shop-demo",
      version: 1,
      exportedAt: new Date().toISOString(),
      state: demoSchema.parse(state),
    },
    null,
    2,
  );
}

export function salesReport(
  s: AdminSettingsWorkspaceState,
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
