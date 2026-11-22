"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminManagementReturns } from "@/app/frontend_admin/admin_management/management_returns/state/AdminManagementReturnsStore";
import { locationLabel } from "@/app/frontend_admin/admin_management/management_returns/state/AdminManagementReturnsTransactions";
import { returnQuote } from "@/app/frontend_admin/admin_management/management_returns/state/AdminManagementReturnsTransactions";
import {
  money,
  dateTime,
} from "@/app/frontend_admin/admin_management/management_returns/utils/AdminManagementReturnsAmounts";
import { AdminManagementReturnsPosEntry } from "@/app/frontend_admin/admin_management/management_returns/components/AdminManagementReturnsPosEntry";
import { Button } from "@/components/ui/Button";
export function AdminManagementReturnsReturns() {
  const t = useTranslations("management"),
    { state, dispatch, stale } = useAdminManagementReturns(),
    [id, setId] = useState(state.sales.at(-1)?.id ?? ""),
    [index, setIndex] = useState(0),
    [qty, setQty] = useState(1),
    [replacement, setReplacement] = useState("");
  const sale = state.sales.find((s) => s.id === id),
    line = sale?.lines[index];
  const remaining =
    (line?.qty ?? 0) -
    state.saleReturns
      .filter((r) => r.saleId === id && r.lineIndex === index)
      .reduce((n, r) => n + r.qty, 0);
  let quote: number | undefined;
  try {
    quote = returnQuote(state, id, index, qty);
  } catch {}
  return (
    <div className="space-y-5">
      <p className="text-sm text-secondary">{t("replacementNote")}</p>
      {sale && (
        <>
          <label className="grid gap-2">
            {t("invoice")}
            <select
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                setIndex(0);
                setQty(1);
              }}
            >
              {state.sales
                .slice()
                .reverse()
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.number} · {money(s.totalPaise)}
                  </option>
                ))}
            </select>
          </label>
          <label className="grid gap-2">
            {t("line")}
            <select
              value={index}
              onChange={(e) => {
                setIndex(Number(e.target.value));
                setQty(1);
              }}
            >
              {sale.lines.map((l, i) => (
                <option key={i} value={i}>
                  {l.sku} · {l.name} · {l.qty}
                </option>
              ))}
            </select>
          </label>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget));
              if (
                window.confirm(
                  t("returnConfirm") +
                    "\n" +
                    t("returnBody") +
                    "\n" +
                    money(quote ?? 0),
                )
              )
                dispatch({
                  type: "manage-return",
                  data: {
                    operation: { ...f, saleId: id, lineIndex: index, qty },
                  },
                });
            }}
          >
            <label className="grid gap-2">
              {t("returnQty")}
              <input
                type="number"
                min="1"
                max={remaining}
                step="1"
                required
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              />
            </label>
            <label className="grid gap-2">
              {t("destination")}
              <select name="locationId">
                {state.locations
                  .filter((l) => l.active)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {locationLabel(state, l.id)}
                    </option>
                  ))}
              </select>
            </label>
            <label className="grid gap-2">
              {t("condition")}
              <select name="condition">
                {["sellable", "damaged"].map((k) => (
                  <option key={k} value={k}>
                    {t(k)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              {t("reason")}
              <input name="reason" maxLength={120} required />
            </label>
            <p>
              {t("remaining")}: {remaining} · {t("refund")}:{" "}
              {quote === undefined ? "—" : money(quote)}
            </p>
            <Button type="submit" disabled={stale || quote === undefined}>
              {t("postReturn")}
            </Button>
          </form>
        </>
      )}
      <h2 className="text-xl font-semibold">{t("returnHistory")}</h2>
      {!state.saleReturns.length && <p>{t("noReturns")}</p>}
      <div className="max-h-96 overflow-auto">
        {state.saleReturns
          .slice()
          .reverse()
          .map((r) => (
            <div key={r.id} className="border-t border-border py-4">
              <p>
                {state.sales.find((s) => s.id === r.saleId)?.number} · {r.qty} ·{" "}
                {money(r.refundPaise)} · {r.condition}
              </p>
              <p className="my-2 text-xs text-secondary">
                {dateTime(r.at)} · {r.reason}
              </p>
              <Button
                disabled={state.draftBills.some(
                  (b) => b.returnId === r.id && b.status !== "abandoned",
                )}
                onClick={() => setReplacement(r.id)}
              >
                {t("replacement")}
              </Button>
              {state.draftBills
                .filter((b) => b.returnId === r.id && b.status !== "abandoned")
                .map((b) => (
                  <p key={b.id} className="mt-2 text-sm">
                    {t("replacement")}:{" "}
                    {state.sales.find((s) => s.id === b.saleId)?.number ??
                      b.status}
                  </p>
                ))}
            </div>
          ))}
      </div>
      {replacement && (
        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t("replacement")}</h3>
            <Button
              className="min-h-8 px-2.5 py-1 text-xs"
              onClick={() => setReplacement("")}
            >
              ✕ {t("cancel")}
            </Button>
          </div>
          <AdminManagementReturnsPosEntry
            key={replacement}
            returnId={replacement}
          />
        </div>
      )}
    </div>
  );
}
