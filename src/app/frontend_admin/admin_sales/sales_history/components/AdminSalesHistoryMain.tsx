"use client";
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAdminSalesHistory } from "@/app/frontend_admin/admin_sales/sales_history/state/AdminSalesHistoryStore";
import { ROUTES } from "@/lib/routes";
import { ADMIN_MANAGEMENT_RETURNS_ROUTES } from "@/app/frontend_admin/admin_management/management_returns/config/admin_management_returns.url_config";
import {
  money,
  dateTime,
} from "@/app/frontend_admin/admin_sales/sales_history/utils/AdminSalesHistoryAmounts";
import {
  labelFor,
  locationLabel,
} from "@/app/frontend_admin/admin_sales/sales_history/state/AdminSalesHistoryTransactions";
import { Button } from "@/components/ui/Button";
import { AdminSalesHistoryReceipt } from "@/app/frontend_admin/admin_sales/sales_history/components/AdminSalesHistoryReceipt";
import { localDay } from "@/app/frontend_admin/admin_sales/sales_history/utils/AdminSalesHistoryDates";
export function AdminSalesHistoryMain() {
  const t = useTranslations("sales"),
    state = useAdminSalesHistory((s) => s.state),
    [selected, setSelected] = useState(""),
    [query, setQuery] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [page, setPage] = useState(1);
  const matches = state.sales
    .filter(
      (s) =>
        (!from || localDay(s.at, state.settings.timeZone) >= from) &&
        (!to || localDay(s.at, state.settings.timeZone) <= to) &&
        [
          s.number,
          s.payment,
          ...s.lines.flatMap((l) => [l.sku, l.name, l.colour, l.sizeCode]),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .slice()
    .reverse();
  const pages = Math.max(1, Math.ceil(matches.length / 20)),
    current = Math.min(page, pages);
  const sale = state.sales.find((s) => s.id === selected);
  const stats = [
    ["revenue", money(state.sales.reduce((n, s) => n + s.totalPaise, 0))],
    ["transactions", state.sales.length],
    [
      "units",
      state.sales.reduce(
        (n, s) => n + s.lines.reduce((a, l) => a + l.qty, 0),
        0,
      ),
    ],
    ["drafts", state.draftBills.filter((d) => d.status === "draft").length],
  ] as const;
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-xs text-secondary">
        <Link href={ROUTES.overview} className="hover:underline">Overview</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Sales & Insights</span>
      </nav>
      <p className="text-[10px] tracking-widest text-secondary">
        {t("eyebrow")}
      </p>
      <h1 className="mt-3 text-3xl font-semibold">{t("title")}</h1>
      <p className="mb-6 mt-2 text-secondary">{t("subtitle")}</p>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([key, value]) => (
          <div
            key={key}
            className="rounded-xl border border-border bg-card p-5"
          >
            <p className="text-xs text-secondary">{t(key)}</p>
            <strong className="mt-3 block text-3xl">{value}</strong>
          </div>
        ))}
      </div>
      <p className="mb-4 text-sm">
        {t("refundTotal")}:{" "}
        {money(state.saleReturns.reduce((n, r) => n + r.refundPaise, 0))} ·{" "}
        {t("netTotal")}:{" "}
        {money(
          state.sales.reduce((n, s) => n + s.totalPaise, 0) -
            state.saleReturns.reduce((n, r) => n + r.refundPaise, 0),
        )}{" "}
        ·{" "}
        <Link href={ADMIN_MANAGEMENT_RETURNS_ROUTES.root} className="underline">
          {t("manageReturns")}
        </Link>
      </p>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1">
          {t("search")}
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="grid gap-1">
          {t("from")}
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="grid gap-1">
          {t("to")}
          <input
            type="date"
            min={from}
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <Button
          onClick={() => {
            setQuery("");
            setFrom("");
            setTo("");
            setPage(1);
          }}
        >
          {t("clear")}
        </Button>
      </div>
      {from && to && from > to && (
        <p role="alert" className="text-danger">
          {t("invalidRange")}
        </p>
      )}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">{t("history")}</h2>
        {!matches.length ? (
          <div className="py-10 text-center">
            <h3 className="text-lg">{t("empty")}</h3>
            <p className="mx-auto my-3 max-w-lg text-secondary">
              {t("emptyBody")}
            </p>
            <Link className="underline" href={ROUTES.billing}>
              {t("billing")}
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {matches.slice((current - 1) * 20, current * 20).map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-subtle p-4"
              >
                <div>
                  <strong>{s.number}</strong>
                  <p className="mt-1 text-xs text-secondary">
                    {dateTime(s.at)} · {s.payment}
                  </p>
                </div>
                <strong>{money(s.totalPaise)}</strong>
                <Button onClick={() => setSelected(s.id)}>{t("view")}</Button>
              </div>
            ))}
          </div>
        )}
      </section>
      <div className="my-4 flex gap-3 items-center">
        <Button disabled={current === 1} onClick={() => setPage(current - 1)}>
          {t("previous")}
        </Button>
        <span>
          {current} / {pages} · {matches.length} {t("transactions")}
        </span>
        <Button
          disabled={current === pages}
          onClick={() => setPage(current + 1)}
        >
          {t("next")}
        </Button>
      </div>
      {sale && (
        <AdminSalesHistoryReceipt sale={sale} onClose={() => setSelected("")} />
      )}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_2fr]">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold">{t("mix")}</h2>
          {["Cash", "UPI", "Card"].map((label) => (
            <div
              key={label}
              className="flex justify-between border-t border-border py-4"
            >
              <span>{label}</span>
              <strong>
                {money(
                  state.payments
                    .filter((p) => p.label === label)
                    .reduce((sum, p) => sum + p.amountPaise, 0),
                )}
              </strong>
            </div>
          ))}
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold">{t("movement")}</h2>
          {!state.stockMovements.length && (
            <p className="py-5 text-secondary">{t("noMovements")}</p>
          )}
          {state.stockMovements
            .slice(-8)
            .reverse()
            .map((m) => (
              <div
                key={m.id}
                className="flex justify-between gap-3 border-t border-border py-3"
              >
                <div>
                  <strong className="text-xs">
                    {labelFor(state, m.variantId)}
                  </strong>
                  <p className="mt-1 text-xs text-secondary">
                    {m.reason} · {locationLabel(state, m.locationId)}
                  </p>
                </div>
                <span className="shrink-0 font-semibold">
                  {m.qtyDelta > 0 ? "+" : ""}
                  {m.qtyDelta}
                </span>
              </div>
            ))}
        </section>
      </div>
      <p className="mt-5 text-xs text-secondary">{t("future")}</p>
    </>
  );
}
