"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminReportsWorkspace } from "@/app/frontend_admin/admin_reports/reports_workspace/state/AdminReportsWorkspaceStore";
import {
  locationLabel,
  sellable,
  variantFor,
} from "@/app/frontend_admin/admin_reports/reports_workspace/state/AdminReportsWorkspaceTransactions";
import { inRange } from "@/app/frontend_admin/admin_reports/reports_workspace/utils/AdminReportsWorkspaceDates";
import { dateTime } from "@/app/frontend_admin/admin_reports/reports_workspace/utils/AdminReportsWorkspaceAmounts";
import {
  csvText,
  downloadText,
} from "@/app/frontend_admin/admin_reports/reports_workspace/utils/AdminReportsWorkspaceDownload";
import { Button } from "@/components/ui/Button";
export function AdminReportsWorkspaceStock({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  const t = useTranslations("reports"),
    state = useAdminReportsWorkspace((s) => s.state),
    [low, setLow] = useState(false),
    [location, setLocation] = useState("");
  const balances = state.inventoryBalances.filter(
    (b) =>
      (!location || b.locationId === location) &&
      (!low ||
        sellable(state, b.variantId) <= state.settings.lowStockThreshold),
  );
  const movements = state.stockMovements
    .filter(
      (m) =>
        inRange(m.at, from, to) && (!location || m.locationId === location),
    )
    .slice()
    .reverse();
  const stockRows = balances.map((b) => [
    variantFor(state, b.variantId).sku,
    locationLabel(state, b.locationId),
    b.onHand,
    b.nonSellable,
    b.onHand - b.nonSellable,
  ]);
  const movementRows = movements.map((m) => [
    dateTime(m.at),
    variantFor(state, m.variantId).sku,
    locationLabel(state, m.locationId),
    m.qtyDelta,
    m.reason,
    m.referenceId,
  ]);
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-xl font-semibold">{t("stock")}</h2>
        <p className="my-3 text-sm text-secondary">{t("stockNote")}</p>
        <div className="my-4 flex flex-wrap items-center gap-4">
          <label className="grid gap-2">
            {t("location")}
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="">{t("allLocations")}</option>
              {state.locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {locationLabel(state, l.id)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={low}
              onChange={(e) => setLow(e.target.checked)}
            />
            {t("low")}
          </label>
          <Button
            onClick={() =>
              downloadText(
                "demo-location-stock.csv",
                csvText([
                  ["SKU", "Location", "On hand", "Non-sellable", "Sellable"],
                  ...stockRows,
                ]),
                "text/csv;charset=utf-8",
              )
            }
          >
            {t("stockExport")}
          </Button>
        </div>
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{t("stock")}</caption>
            <thead>
              <tr>
                {["sku", "location", "onHand", "nonSellable", "available"].map(
                  (k) => (
                    <th scope="col" className="p-3" key={k}>
                      {t(k)}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {stockRows.slice(0, 100).map((r, i) => (
                <tr key={i} className="border-t border-border">
                  {r.map((v, j) => (
                    <td key={j} className="whitespace-nowrap p-3">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!balances.length ? (
          <p className="py-4">{t("noStock")}</p>
        ) : (
          balances.length > 100 && <p>{t("showing", { count: 100 })}</p>
        )}
      </section>
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap justify-between gap-3">
          <h2 className="text-xl font-semibold">{t("movements")}</h2>
          <Button
            onClick={() =>
              downloadText(
                "demo-stock-movements.csv",
                csvText([
                  [
                    "Posted Asia/Kolkata",
                    "SKU",
                    "Location",
                    "Physical delta",
                    "Reason",
                    "Reference",
                  ],
                  ...movementRows,
                ]),
                "text/csv;charset=utf-8",
              )
            }
          >
            {t("movementExport")}
          </Button>
        </div>
        <div className="mt-4 max-h-96 overflow-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{t("movements")}</caption>
            <thead>
              <tr>
                {[
                  "date",
                  "sku",
                  "location",
                  "delta",
                  "reason",
                  "reference",
                ].map((k) => (
                  <th scope="col" className="p-3" key={k}>
                    {t(k)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movementRows.slice(0, 100).map((r, i) => (
                <tr className="border-t border-border" key={i}>
                  {r.map((v, j) => (
                    <td className="min-w-28 max-w-80 break-words p-3" key={j}>
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!movements.length ? (
          <p className="py-4">{t("noMovements")}</p>
        ) : (
          movements.length > 100 && <p>{t("showing", { count: 100 })}</p>
        )}
      </section>
    </div>
  );
}
