"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminManagementStock } from "@/app/frontend_admin/admin_management/management_stock/state/AdminManagementStockStore";
import {
  locationLabel,
  labelFor,
} from "@/app/frontend_admin/admin_management/management_stock/state/AdminManagementStockTransactions";
export function AdminManagementStockBoxes() {
  const t = useTranslations("management"),
    state = useAdminManagementStock((s) => s.state),
    [id, setId] = useState(state.locations[0]?.id ?? "");
  const rows = state.inventoryBalances.filter(
      (b) => b.locationId === id && b.onHand > 0,
    ),
    units = rows.reduce((n, b) => n + b.onHand, 0);
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{t("boxContents")}</h2>
      <label className="grid gap-1">
        {t("selectLocation")}
        <select value={id} onChange={(e) => setId(e.target.value)}>
          {state.locations.map((l) => (
            <option key={l.id} value={l.id}>
              {locationLabel(state, l.id)} ·{" "}
              {state.inventoryBalances
                .filter((b) => b.locationId === l.id)
                .reduce((n, b) => n + b.onHand, 0)}{" "}
              {t("units")} · {l.active ? t("active") : t("disabled")}
            </option>
          ))}
        </select>
      </label>
      <p>
        {units} {t("units")}
      </p>
      {!rows.length ? (
        <p className="rounded bg-subtle p-5">{t("emptyBox")}</p>
      ) : (
        <div className="max-h-80 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th>{t("sku")}</th>
                <th>{t("availableUnits")}</th>
                <th>{t("nonSellable")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.variantId} className="border-t border-border">
                  <td className="py-3">{labelFor(state, b.variantId)}</td>
                  <td>{b.onHand - b.nonSellable}</td>
                  <td>{b.nonSellable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
