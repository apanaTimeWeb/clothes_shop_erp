"use client";
import { t } from "@/app/frontend_admin/admin_management/management_purchases/utils/AdminManagementPurchasesMessages";

import { AdminManagementPurchasesReceive } from "@/app/frontend_admin/admin_management/management_purchases/components/AdminManagementPurchasesReceive";
import { AdminManagementPurchasesPayments } from "@/app/frontend_admin/admin_management/management_purchases/components/AdminManagementPurchasesPayments";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Confirm } from "@/components/ui/Confirm";
import { useAdminManagementPurchases } from "@/app/frontend_admin/admin_management/management_purchases/hooks/useAdminManagementPurchases";
import { AdminManagementPurchasesSupplier } from "@/app/frontend_admin/admin_management/management_purchases/components/AdminManagementPurchasesSupplier";
import { AdminManagementPurchasesOrder } from "@/app/frontend_admin/admin_management/management_purchases/components/AdminManagementPurchasesOrder";
import {
  receivePurchase,
  purchaseTotal,
  supplierBalance,
} from "@/app/frontend_admin/admin_management/management_purchases/state/AdminManagementPurchasesActions";
import { money } from "@/app/frontend_admin/admin_management/management_purchases/utils/AdminManagementPurchasesAmounts";
import type { Supplier } from "@/app/frontend_admin/admin_management/management_purchases/schemas/AdminManagementPurchasesOperationsSchema";
export function AdminManagementPurchasesMain() {
  const { shop, ops, ready, error, canEdit, save } = useAdminManagementPurchases();
  const [editing, setEditing] = useState<Partial<Supplier> | null>(null),
    [ordering, setOrdering] = useState(false),
    [limit, setLimit] = useState(20);
  if (!canEdit) return <p>{t("message1")}</p>;
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">{t("message2")}</h1>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      {!ready && <p>{t("message3")}</p>}
      <div className="flex gap-3">
        <Button disabled={!ready} onClick={() => setEditing({})}>
          {t("message4")}
        </Button>
        <Button
          disabled={!ready || !ops.suppliers.some((s) => s.active)}
          onClick={() => setOrdering(true)}
        >
          {t("message5")}
        </Button>
      </div>
      {editing && (
        <AdminManagementPurchasesSupplier
          key={editing.id || "new"}
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={(s) =>
            save((_, o) => {
              const existing = o.suppliers.find((x) => x.id === s.id);
              if (existing) Object.assign(existing, s);
              else o.suppliers.push(s);
            })
          }
        />
      )}
      {ordering && (
        <AdminManagementPurchasesOrder
          shop={shop}
          suppliers={ops.suppliers.filter((s) => s.active)}
          onCancel={() => setOrdering(false)}
          onSave={(p) =>
            save((_, o) => {
              if (
                o.purchases.some(
                  (x) =>
                    x.supplierId === p.supplierId &&
                    x.reference.toLowerCase() === p.reference.toLowerCase() &&
                    x.status !== "cancelled",
                )
              )
                throw Error(t("message6"));
              o.purchases.push(p);
            })
          }
        />
      )}
      <details>
        <summary>{t("message7")}</summary>
        {ops.suppliers.map((s) => (
          <article className="my-3 rounded border border-border p-3" key={s.id}>
            <strong>{s.name}</strong>
            <p>
              {s.phone} · {s.email}
            </p>
            <p>{s.notes}</p>
            <p>
              {t("supplierPayable")}: {money(supplierBalance(ops, s.id).payable)} ·{" "}
              {t("supplierPaid")}: {money(supplierBalance(ops, s.id).paid)} ·{" "}
              {t("supplierOutstanding")}: {money(supplierBalance(ops, s.id).outstanding)}
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setEditing(s)}>{t("message8")}</Button>
              <Button
                onClick={() =>
                  save((_, o) => {
                    const x = o.suppliers.find((x) => x.id === s.id);
                    if (x) x.active = !x.active;
                  })
                }
              >
                {s.active ? t("message9") : t("message10")}
              </Button>
            </div>
          </article>
        ))}
      </details>
      <h2 className="text-xl font-semibold">{t("message11")}</h2>
      {!ops.purchases.length && <p>{t("message12")}</p>}
      {[...ops.purchases]
        .reverse()
        .slice(0, limit)
        .map((p) => (
          <article key={p.id} className="space-y-3 rounded-xl border border-border bg-card p-4">
            <h3>
              {p.reference} · {ops.suppliers.find((s) => s.id === p.supplierId)?.name}
            </h3>
            <p>
              {p.status} · {money(purchaseTotal(p))} ·{" "}
              {new Date(p.createdAt).toLocaleString("en-IN")}
            </p>
            <details>
              <summary>{t("message13")}</summary>
              {p.lines.map((l, i) => (
                <p key={i}>
                  {shop.variants.find((v) => v.id === l.variantId)?.sku} × {l.qty} ·{" "}
                  {money(l.unitCostPaise)} ·{" "}
                  {shop.locations.find((x) => x.id === l.locationId)?.box}
                </p>
              ))}
            </details>
            {["ordered", "partial"].includes(p.status) && (
              <div className="flex gap-3">
                <AdminManagementPurchasesReceive
                  key={p.lines.map((l) => l.receivedQty || 0).join(",")}
                  purchase={p}
                  labels={p.lines.map(
                    (l) =>
                      (shop.variants.find((v) => v.id === l.variantId)?.sku || l.variantId) +
                      " / " +
                      (shop.locations.find((x) => x.id === l.locationId)?.box || l.locationId),
                  )}
                  onReceive={(quantities) =>
                    save((s, o) => receivePurchase(s, o, p.id, quantities))
                  }
                />
                <Confirm
                  trigger={<Button>{t("message19")}</Button>}
                  title={t("message20")}
                  description={t("message21")}
                  confirmLabel={t("message19")}
                  cancelLabel={t("message22")}
                  onConfirm={() =>
                    save((_, o) => {
                      const x = o.purchases.find((x) => x.id === p.id);
                      if (!x || !["ordered", "partial"].includes(x.status))
                        throw Error(t("message23"));
                      if (
                        o.supplierPayments
                          .filter((v) => v.purchaseId === x.id && !v.voided)
                          .reduce((n, v) => n + v.amountPaise, 0) >
                        x.lines.reduce((n, l) => n + (l.receivedQty || 0) * l.unitCostPaise, 0)
                      )
                        throw Error(t("upgrade1"));
                      x.status = "cancelled";
                    })
                  }
                />
              </div>
            )}
            <AdminManagementPurchasesPayments
              purchase={p}
              ops={ops}
              save={(change) => save((_, o) => change(o))}
            />
            {p.receivedAt && (
              <p>
                {t("message24")}
                {new Date(p.receivedAt).toLocaleString("en-IN")}
              </p>
            )}
          </article>
        ))}
      {ops.purchases.length > limit && (
        <Button onClick={() => setLimit(limit + 20)}>{t("message25")}</Button>
      )}
    </div>
  );
}
