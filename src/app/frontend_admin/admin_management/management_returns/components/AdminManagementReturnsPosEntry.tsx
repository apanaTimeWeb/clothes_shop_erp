"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useAdminManagementReturns } from "@/app/frontend_admin/admin_management/management_returns/state/AdminManagementReturnsStore";
import { ROUTES } from "@/lib/routes";
import {
  locationLabel,
  sellable,
} from "@/app/frontend_admin/admin_management/management_returns/state/AdminManagementReturnsTransactions";
import { Button } from "@/components/ui/Button";
export function AdminManagementReturnsPosEntry({
  returnId,
  onSaved,
  disabled = false,
}: {
  returnId?: string;
  onSaved?: (id: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("management"),
    { state, dispatch, stale } = useAdminManagementReturns();
  const [saved, setSaved] = useState(false),
    [billId, setBillId] = useState(""),
    [sku, setSku] = useState(""),
    [location, setLocation] = useState(""),
    [error, setError] = useState("");
  const variant = state.variants.find(
    (v) => v.sku.toLowerCase() === sku.trim().toLowerCase(),
  );
  const locations = state.locations.filter(
    (l) => l.active && variant && sellable(state, variant.id, l.id) > 0,
  );
  const source = locations.some((l) => l.id === location)
    ? location
    : (locations[0]?.id ?? "");
  const drafts = state.draftBills.filter(
    (b) => b.status === "draft" && b.returnId === returnId,
  );
  const target = drafts.some((b) => b.id === billId) ? billId : "";
  return (
    <section className="my-6 rounded-xl border border-border bg-card p-5">
      <h2 className="text-xl font-semibold">
        {t(returnId ? "replacement" : "pos")}
      </h2>
      <p className="my-3 text-sm text-secondary">{t("posNote")}</p>
      {disabled && <p className="mb-3 text-warning">{t("saveBeforeAdd")}</p>}
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          const f = new FormData(e.currentTarget);
          if (
            dispatch({
              type: "manage-pos",
              data: {
                operation: {
                  sku,
                  locationId: source,
                  qty: Number(f.get("qty")),
                  returnId,
                  billId: target || undefined,
                },
              },
            })
          ) {
            const id =
              target ||
              useAdminManagementReturns.getState().state.draftBills.at(-1)!.id;
            setBillId(id);
            setSaved(true);
            setSku("");
            onSaved?.(id);
          } else setError(useAdminManagementReturns.getState().notice);
        }}
      >
        <label className="grid gap-2">
          {t("targetBill")}
          <select value={target} onChange={(e) => setBillId(e.target.value)}>
            <option value="">{t("createDraft")}</option>
            {drafts.map((b) => (
              <option key={b.id} value={b.id}>
                {state.sessions.find((s) => s.id === b.sessionId)?.name} ·{" "}
                {b.id.slice(-8)} · {b.lines.length} {t("items")}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          {t("sku")}
          <input
            required
            list={returnId ? "replacement-skus" : "pos-skus"}
            value={sku}
            onChange={(e) => {
              setSku(e.target.value);
              setLocation("");
            }}
          />
        </label>
        <datalist id={returnId ? "replacement-skus" : "pos-skus"}>
          {state.variants
            .filter(
              (v) =>
                v.status === "active" &&
                state.products.some(
                  (p) => p.id === v.productId && p.status === "active",
                ),
            )
            .map((v) => (
              <option key={v.id} value={v.sku}>
                {state.products.find((p) => p.id === v.productId)?.name} ·{" "}
                {v.colour} / {v.sizeCode}
              </option>
            ))}
        </datalist>
        <label className="grid gap-2">
          {t("source")}
          <select
            required
            value={source}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="">{t("chooseSkuSource")}</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {locationLabel(state, l.id)} ·{" "}
                {sellable(state, variant!.id, l.id)} {t("availableUnits")}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          {t("posQty")}
          <input
            name="qty"
            type="number"
            min="1"
            step="1"
            defaultValue="1"
            required
          />
        </label>
        <Button type="submit" disabled={stale || disabled || !source}>
          {t(target ? "addToBill" : "createDraft")}
        </Button>
      </form>
      {error && (
        <p role="alert" className="mt-3 text-danger">
          {error}
        </p>
      )}
      {saved && (
        <Link className="mt-4 block underline" href={ROUTES.billing}>
          {t("saved")} → {t("pos")}
        </Link>
      )}
    </section>
  );
}
