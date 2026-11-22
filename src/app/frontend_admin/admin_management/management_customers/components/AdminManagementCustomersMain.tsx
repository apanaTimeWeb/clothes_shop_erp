"use client";
import { t } from "@/app/frontend_admin/admin_management/management_customers/utils/AdminManagementCustomersMessages";

import { AdminManagementCustomersPrivacy } from "@/app/frontend_admin/admin_management/management_customers/components/AdminManagementCustomersPrivacy";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAdminManagementCustomers } from "@/app/frontend_admin/admin_management/management_customers/hooks/useAdminManagementCustomers";
import { AdminManagementCustomersEditor } from "@/app/frontend_admin/admin_management/management_customers/components/AdminManagementCustomersEditor";
import { customerSummary } from "@/app/frontend_admin/admin_management/management_customers/state/AdminManagementCustomersLoyalty";
import type { Customer } from "@/app/frontend_admin/admin_management/management_customers/schemas/AdminManagementCustomersOperationsSchema";
import { money } from "@/app/frontend_admin/admin_management/management_customers/utils/AdminManagementCustomersAmounts";
export function AdminManagementCustomersMain() {
  const { shop, ops, ready, error, canEdit, save } = useAdminManagementCustomers();
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState(""),
    [editing, setEditing] = useState<Partial<Customer> | null>(null),
    [saleId, setSaleId] = useState(""),
    [points, setPoints] = useState(""),
    [reason, setReason] = useState(""),
    [limit, setLimit] = useState(20);
  if (!canEdit) return <p>{t("message9")}</p>;
  const customers = ops.customers.filter((c) =>
    (c.name + " " + c.phone + " " + c.email).toLowerCase().includes(query.toLowerCase()),
  );
  const customer = ops.customers.find((c) => c.id === selected);
  const summary = customer ? customerSummary(shop, ops, customer.id) : null;
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">{t("message10")}</h1>
      <p>{t("message11")}</p>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      <Button disabled={!ready} onClick={() => setEditing({})}>
        {t("message12")}
      </Button>
      {editing && (
        <AdminManagementCustomersEditor
          key={editing.id || "new"}
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={(c) =>
            save((_, o) => {
              const old = o.customers.find((x) => x.id === c.id);
              if (old) Object.assign(old, c);
              else o.customers.push(c);
            })
          }
        />
      )}
      <div className="flex items-end gap-2">
        <label className="grow">
          {t("message13")}
          <input
            className="w-full"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(20);
            }}
          />
        </label>
        {query && (
          <Button
            type="button"
            className="min-h-10 px-3 text-xs"
            onClick={() => {
              setQuery("");
              setLimit(20);
            }}
          >
            Clear ✕
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {customers.slice(0, limit).map((c) => (
          <Button
            key={c.id}
            onClick={() => {
              setSelected(c.id);
              setSaleId("");
            }}
          >
            {c.name} · {c.phone} {c.active ? "" : t("message14")}
          </Button>
        ))}
      </div>
      {customers.length > limit && (
        <Button onClick={() => setLimit(limit + 20)}>{t("message15")}</Button>
      )}
      {!customers.length && <p>{t("message16")}</p>}
      {customer && summary && (
        <section className="space-y-4 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{customer.name}</h2>
            <Button
              type="button"
              className="min-h-8 px-2.5 py-1 text-xs"
              onClick={() => setSelected("")}
            >
              ✕ Close
            </Button>
          </div>
          <p>
            {customer.phone} · {customer.email}
          </p>
          <p>{customer.preferences}</p>
          <AdminManagementCustomersPrivacy
            customer={customer}
            save={(change) => save((_, o) => change(o))}
          />
          <div className="flex gap-3">
            <Button onClick={() => setEditing(customer)}>{t("message17")}</Button>
            <Button
              onClick={() =>
                save((_, o) => {
                  const c = o.customers.find((x) => x.id === customer.id);
                  if (c) c.active = !c.active;
                })
              }
            >
              {customer.active ? t("message18") : t("message19")}
            </Button>
          </div>
          <p>
            {t("message20")}
            {money(summary.net)}
            {t("message21")}
            {summary.earned}
            {t("message22")}
            {summary.redeemed}
            {t("message23")}
            {summary.balance}
          </p>
          {summary.balance < 0 && <p className="text-warning">{t("message24")}</p>}
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (
                save((s, o) => {
                  if (
                    !s.sales.some((x) => x.id === saleId) ||
                    o.saleLinks.some((x) => x.saleId === saleId)
                  )
                    throw Error(t("message25"));
                  if (!o.customers.some((c) => c.id === customer.id && c.active))
                    throw Error(t("message26"));
                  o.saleLinks.push({ saleId, customerId: customer.id });
                })
              )
                setSaleId("");
            }}
          >
            <label>
              {t("message27")}
              <select required value={saleId} onChange={(e) => setSaleId(e.target.value)}>
                <option value="">{t("message28")}</option>
                {shop.sales
                  .filter((s) => !ops.saleLinks.some((l) => l.saleId === s.id))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.number} · {money(s.totalPaise)}
                    </option>
                  ))}
              </select>
            </label>
            <Button type="submit" disabled={!customer.active || !saleId}>
              {t("message29")}
            </Button>
          </form>
          <form
            className="grid gap-3 sm:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (
                save((s, o) => {
                  const p = Number(points);
                  if (
                    !o.customers.some((c) => c.id === customer.id && c.active) ||
                    !Number.isInteger(p) ||
                    p <= 0 ||
                    p > customerSummary(s, o, customer.id).balance ||
                    !reason.trim()
                  )
                    throw Error(t("message30"));
                  o.redemptions.push({
                    id: crypto.randomUUID(),
                    customerId: customer.id,
                    points: p,
                    reason: reason.trim(),
                    at: new Date().toISOString(),
                  });
                })
              ) {
                setPoints("");
                setReason("");
              }
            }}
          >
            <label>
              {t("message31")}
              <input
                required
                type="number"
                min={1}
                max={Math.max(0, summary.balance)}
                value={points}
                onChange={(e) => setPoints(e.target.value)}
              />
            </label>
            <label>
              {t("message32")}
              <input
                required
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <Button type="submit" disabled={!customer.active || summary.balance <= 0}>
              {t("message33")}
            </Button>
          </form>
          <h3 className="font-semibold">{t("message34")}</h3>
          {summary.sales.map((s) => (
            <details key={s.id}>
              <summary>
                {s.number} · {new Date(s.at).toLocaleDateString("en-IN")} · {money(s.totalPaise)}
              </summary>
              {s.lines.map((l, i) => (
                <p key={i}>
                  {l.name} · {l.colour} / {l.sizeCode} × {l.qty}
                </p>
              ))}
              <p>
                {t("message35")}{" "}
                {money(
                  shop.saleReturns
                    .filter((r) => r.saleId === s.id)
                    .reduce((n, r) => n + r.refundPaise, 0),
                )}
              </p>
              <Button
                disabled={ops.redemptions.some((r) => r.customerId === customer.id)}
                onClick={() =>
                  save((_, o) => {
                    if (o.redemptions.some((r) => r.customerId === customer.id))
                      throw Error(t("message36"));
                    o.saleLinks = o.saleLinks.filter((l) => l.saleId !== s.id);
                  })
                }
              >
                {t("message37")}
              </Button>
            </details>
          ))}
          <h3 className="font-semibold">{t("message38")}</h3>
          {ops.redemptions
            .filter((r) => r.customerId === customer.id)
            .map((r) => (
              <p key={r.id}>
                {r.points} · {r.reason} · {new Date(r.at).toLocaleString("en-IN")}
              </p>
            ))}
        </section>
      )}
    </div>
  );
}
