"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminManagementStock } from "@/app/frontend_admin/admin_management/management_stock/state/AdminManagementStockStore";
import { locationLabel } from "@/app/frontend_admin/admin_management/management_stock/state/AdminManagementStockTransactions";
import { Button } from "@/components/ui/Button";
import {
  AdminManagementStockField as Field,
  readFields,
} from "@/app/frontend_admin/admin_management/management_stock/components/AdminManagementStockFields";
import { AdminManagementStockBoxes } from "@/app/frontend_admin/admin_management/management_stock/components/AdminManagementStockBoxes";
export function AdminManagementStockStock() {
  const t = useTranslations("management"),
    { state, dispatch, mode, stale } = useAdminManagementStock(),
    [id, setId] = useState(""),
    [kind, setKind] = useState("transfer");
  const loc = state.locations.find((l) => l.id === id);
  return (
    <div className="space-y-8">
      <AdminManagementStockBoxes />
      {mode === "Admin" && (
        <section>
          <h2 className="mb-3 text-xl font-semibold">{t("locations")}</h2>
          <p className="mb-4 text-sm text-secondary">{t("locationNote")}</p>
          <label className="grid gap-2">
            {t("selectLocation")}
            <select value={id} onChange={(e) => setId(e.target.value)}>
              <option value="">{t("newLocation")}</option>
              {state.locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {locationLabel(state, l.id)} ·{" "}
                  {l.active ? "active" : "disabled"}
                </option>
              ))}
            </select>
          </label>
          <form
            key={id}
            className="mt-4 grid gap-4 sm:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              const f = readFields(e.currentTarget);
              dispatch({
                type: "manage-location",
                data: {
                  operation: {
                    ...f,
                    id: id || undefined,
                    active: f.active === "on",
                  },
                },
              });
            }}
          >
            {(["rack", "shelf", "box"] as const).map((k) => (
              <Field key={k} name={k} value={loc?.[k]} />
            ))}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="active"
                defaultChecked={loc?.active ?? true}
              />
              {t("active")}
            </label>
            <Button disabled={stale} type="submit">
              {t("save")}
            </Button>
          </form>
        </section>
      )}
      <section>
        <h2 className="text-xl font-semibold">{t("locations")}</h2>
        <p className="my-3 text-sm text-secondary">{t("stockNote")}</p>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const f = readFields(e.currentTarget),
              v = state.variants.find(
                (v) => v.sku.toLowerCase() === f.sku.trim().toLowerCase(),
              );
            if (
              window.confirm(t("stockConfirm") + "\n" + t("stockConfirmBody"))
            )
              dispatch({
                type: "manage-stock",
                data: {
                  operation: {
                    ...f,
                    variantId: v?.id ?? "",
                    qty: Number(f.qty),
                    nonSellable: Number(f.nonSellable ?? 0),
                  },
                },
              });
          }}
        >
          <Field name="sku" />
          <label className="grid gap-2">
            {t("kind")}
            <select
              name="kind"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              {["transfer", "damage", "count"].map((x) => (
                <option key={x} value={x}>
                  {t(x)}
                </option>
              ))}
            </select>
          </label>
          {[
            "locationId",
            ...(kind === "transfer" ? ["destinationId"] : []),
          ].map((k) => (
            <label className="grid gap-2" key={k}>
              {t(k === "locationId" ? "source" : "destination")}
              <select name={k}>
                {state.locations
                  .filter((l) => l.active)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {locationLabel(state, l.id)}
                    </option>
                  ))}
              </select>
            </label>
          ))}
          <Field name="qty" type="number" value={1} />
          {kind === "count" && (
            <Field name="nonSellable" type="number" value={0} />
          )}
          <Field name="reason" />
          <Button type="submit" disabled={stale}>
            {t("post")}
          </Button>
        </form>
      </section>
    </div>
  );
}
