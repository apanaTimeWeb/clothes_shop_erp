import { describe, it, expect } from "vitest";
import { createSeed } from "@/app/frontend_admin/admin_settings/settings_workspace/mocks/AdminSettingsWorkspaceSeed";
import { createPresentationSeed } from "@/app/frontend_admin/admin_settings/settings_workspace/state/AdminSettingsWorkspaceTransactions";
import { transition } from "@/app/frontend_admin/admin_settings/settings_workspace/state/AdminSettingsWorkspaceTransactions";
import {
  exportDemo,
  parseDemoImport,
} from "@/app/frontend_admin/admin_settings/settings_workspace/state/AdminSettingsWorkspaceTransactions";
import { salesReport } from "@/app/frontend_admin/admin_settings/settings_workspace/state/AdminSettingsWorkspaceTransactions";
import {
  localDay,
  dateRange,
} from "@/app/frontend_admin/admin_settings/settings_workspace/utils/AdminSettingsWorkspaceAmounts";
import { csvText } from "@/app/frontend_admin/admin_settings/settings_workspace/utils/AdminSettingsWorkspaceDownload";
const fixture = () => createPresentationSeed();
describe("Phase 3 reports and India-local dates", () => {
  it("excludes drafts, groups each dimension and reconciles receipts", () => {
    const s = fixture();
    for (const group of [
      "design",
      "sku",
      "category",
      "size",
      "colour",
    ] as const) {
      const r = salesReport(s, "", "", group);
      expect(r.gross).toBe(179800);
      expect(r.salesCount).toBe(2);
      expect(r.rows.reduce((n, r) => n + r.grossPaise, 0)).toBe(r.gross);
      expect(r.rows.reduce((n, r) => n + r.sold, 0)).toBe(2);
    }
  });
  it("handles local midnight, Monday week and month boundaries", () => {
    expect(localDay("2026-11-16T18:29:59Z")).toBe("2026-11-16");
    expect(localDay("2026-11-16T18:30:00Z")).toBe("2026-11-17");
    expect(dateRange("week", new Date("2026-11-18T20:00:00Z"))).toEqual({
      from: "2026-11-16",
      to: "2026-11-19",
    });
    expect(dateRange("month", new Date("2026-11-18T20:00:00Z")).from).toBe(
      "2026-11-01",
    );
  });
  it("counts refunds on posting date even when original sale is outside range", () => {
    let s = fixture();
    s = transition(
      s,
      {
        type: "manage-return",
        data: {
          operation: {
            saleId: s.sales[0].id,
            lineIndex: 0,
            qty: 1,
            locationId: "loc-1",
            condition: "sellable",
            reason: "Date test",
          },
        },
      },
      "2026-11-16T18:30:00Z",
    );
    const before = salesReport(s, "2026-11-16", "2026-11-16", "sku");
    expect(before.refunded).toBe(0);
    const r = salesReport(s, "2026-11-17", "2026-11-17", "sku");
    expect(r.gross).toBe(0);
    expect(r.refunded).toBe(89900);
    expect(r.net).toBe(-89900);
    expect(r.days[0].day).toBe("2026-11-17");
  });
  it("reverses costs for sellable returns but retains damaged-item cost", () => {
    const initial = fixture(),
      sale = initial.sales[0],
      cost = sale.lines[0].costPaise;
    const base = salesReport(initial, "", "", "sku").profit;
    const refund = (condition: string) =>
      transition(initial, {
        type: "manage-return",
        data: {
          operation: {
            saleId: sale.id,
            lineIndex: 0,
            qty: 1,
            locationId: "loc-1",
            condition,
            reason: "Profit test",
          },
        },
      });
    expect(salesReport(refund("sellable"), "", "", "sku").profit).toBe(
      base - sale.totalPaise + cost,
    );
    expect(salesReport(refund("damaged"), "", "", "sku").profit).toBe(
      base - sale.totalPaise,
    );
  });
  it("preserves category and receipt snapshots after changes", () => {
    const s = fixture();
    const category = s.sales[0].lines[0].category;
    s.products[0].categoryId = "Edited";
    s.settings.shopName = "Edited shop";
    expect(salesReport(s, "", "", "category").rows[0].label).toBe(category);
    expect(s.sales[0].shopName).toBe("Thread & Form");
  });
  it("returns genuine empty reports after filters and reset", () => {
    expect(
      salesReport(fixture(), "2099-01-01", "2099-12-31", "design").rows,
    ).toHaveLength(0);
    expect(salesReport(createSeed(), "", "", "design").net).toBe(0);
  });
  it("escapes CSV delimiters and neutralizes formula-like text", () => {
    const csv = csvText([
      ['=HYPERLINK("x")', "a,b", "line\nbreak", -12, " +SUM(1)"],
    ]);
    expect(csv).toContain('"\'=HYPERLINK(""x"")"');
    expect(csv).toContain('"a,b"');
    expect(csv).toContain('"-12"');
    expect(csv).toContain("' +SUM");
  });
});
describe("Phase 3 import and settings safety", () => {
  it("roundtrips full backups and accepts version-1 raw states", () => {
    const s = fixture();
    expect(parseDemoImport(exportDemo(s))).toEqual(s);
    expect(parseDemoImport(JSON.stringify(createSeed()))).toEqual(createSeed());
  });
  it.each([
    ["bad JSON", () => "{bad"],
    [
      "unknown version",
      () =>
        JSON.stringify({
          format: "clothes-shop-demo",
          version: 9,
          state: fixture(),
        }),
    ],
    [
      "invalid timestamp",
      () => {
        const s = fixture();
        s.sales[0].at = "not a date";
        return JSON.stringify(s);
      },
    ],
    [
      "tampered sale total",
      () => {
        const s = fixture();
        s.sales[0].totalPaise++;
        return JSON.stringify(s);
      },
    ],
    [
      "orphan payment",
      () => {
        const s = fixture();
        s.payments[0].saleId = "missing";
        return JSON.stringify(s);
      },
    ],
    [
      "missing box",
      () => {
        const s = fixture();
        s.locations = [];
        return JSON.stringify(s);
      },
    ],
    [
      "duplicate SKU case",
      () => {
        const s = fixture();
        s.variants[1].sku = s.variants[0].sku.toLowerCase();
        return JSON.stringify(s);
      },
    ],
    [
      "duplicate combination",
      () => {
        const s = fixture();
        s.variants[1].sizeCode = s.variants[0].sizeCode;
        return JSON.stringify(s);
      },
    ],
    [
      "remote image",
      () => {
        const s = fixture();
        s.images[0].srcOrAssetKey = "https://example.com/tracker.png";
        return JSON.stringify(s);
      },
    ],
    [
      "disabled stocked box",
      () => {
        const s = fixture();
        s.locations[0].active = false;
        return JSON.stringify(s);
      },
    ],
    [
      "unmatched draft",
      () => {
        const s = fixture();
        s.draftBills[2].lines[0].qty = 999;
        return JSON.stringify(s);
      },
    ],
    [
      "too many records",
      () => JSON.stringify({ products: Array(10001).fill({}) }),
    ],
  ] as [string, () => string][])(
    "rejects %s without publishing or mutating existing data",
    (_name, raw) => {
      const s = fixture(),
        before = JSON.stringify(s);
      expect(() =>
        transition(s, { type: "demo-import", data: { operation: raw() } }),
      ).toThrow();
      expect(JSON.stringify(s)).toBe(before);
    },
  );
  it("rejects forged refund amount", () => {
    let s = fixture();
    s = transition(s, {
      type: "manage-return",
      data: {
        operation: {
          saleId: s.sales[0].id,
          lineIndex: 0,
          qty: 1,
          locationId: "loc-1",
          condition: "sellable",
          reason: "Test",
        },
      },
    });
    s.saleReturns[0].refundPaise++;
    expect(() => parseDemoImport(JSON.stringify(s))).toThrow("Refund amount");
  });
  it("imports replace rather than merge and advances local revision", () => {
    const before = fixture();
    before.revision = 10;
    const n = transition(before, {
      type: "demo-import",
      data: { operation: exportDemo(createSeed()) },
    });
    expect(n.sales).toHaveLength(0);
    expect(n.revision).toBe(11);
  });
  it("updates threshold/tax/name without rewriting existing bills or invoices", () => {
    const s = fixture(),
      n = transition(s, {
        type: "settings-save",
        data: {
          operation: {
            ...s.settings,
            shopName: "Demo Boutique",
            taxPercent: 5,
            lowStockThreshold: 7,
          },
        },
      });
    expect(n.settings.lowStockThreshold).toBe(7);
    expect(n.sales).toEqual(s.sales);
    expect(n.draftBills).toEqual(s.draftBills);
  });
  it.each([-1, 101, NaN])("rejects invalid settings tax %s", (taxPercent) => {
    const s = fixture();
    expect(() =>
      transition(s, {
        type: "settings-save",
        data: { operation: { ...s.settings, taxPercent } },
      }),
    ).toThrow();
  });
  it("distinguishes opening stock, restock and physical reconciliation", () => {
    let s = createSeed();
    const v = s.variants[0].id;
    expect(s.inventoryBalances[0].onHand).toBe(0);
    s = transition(s, {
      type: "opening-stock",
      data: { variantId: v, locationId: "loc-1", qty: 3 },
    });
    expect(s.stockMovements.at(-1)?.reason).toBe("opening-stock");
    expect(() =>
      transition(s, {
        type: "opening-stock",
        data: { variantId: v, locationId: "loc-1", qty: 3 },
      }),
    ).toThrow("Opening stock");
    s = transition(s, {
      type: "restock",
      data: { variantId: v, locationId: "loc-1", qty: 2 },
    });
    expect(s.stockMovements.at(-1)?.reason).toBe("restock");
    s = transition(s, {
      type: "manage-stock",
      data: {
        operation: {
          variantId: v,
          locationId: "loc-1",
          kind: "count",
          qty: 0,
          nonSellable: 0,
          reason: "Empty after count",
        },
      },
    });
    expect(s.stockMovements.at(-1)?.qtyDelta).toBe(-5);
  });
  it("allows an entirely empty catalogue without dangling business references", () => {
    const s = createSeed();
    for (const key of [
      "products",
      "variants",
      "images",
      "inventoryBalances",
    ] as const)
      s[key] = [];
    expect(parseDemoImport(JSON.stringify(s)).products).toHaveLength(0);
  });
});
