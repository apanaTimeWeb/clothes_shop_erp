"use client";
import { t } from "@/app/frontend_admin/admin_management/management_purchases/utils/AdminManagementPurchasesMessages";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type {
  Operations,
  Purchase,
} from "@/app/frontend_admin/admin_management/management_purchases/schemas/AdminManagementPurchasesOperationsSchema";
import { money } from "@/app/frontend_admin/admin_management/management_purchases/utils/AdminManagementPurchasesAmounts";
export function AdminManagementPurchasesPayments({
  purchase,
  ops,
  save,
}: {
  purchase: Purchase;
  ops: Operations;
  save: (change: (o: Operations) => void) => boolean;
}) {
  const [amount, setAmount] = useState(""),
    [reference, setReference] = useState(""),
    [due, setDue] = useState(purchase.dueDate || "");
  const rows = ops.supplierPayments.filter((x) => x.purchaseId === purchase.id),
    total = purchase.lines.reduce(
      (n, l) =>
        n + (purchase.status === "cancelled" ? l.receivedQty || 0 : l.qty) * l.unitCostPaise,
      0,
    ),
    paid = rows.filter((x) => !x.voided).reduce((n, x) => n + x.amountPaise, 0);
  return (
    <details>
      <summary>
        {t("upgrade2")}
        {money(paid)}
        {t("upgrade3")}
        {money(total - paid)}
      </summary>
      <p>{t("upgrade4")}</p>
      <form
        className="flex flex-wrap gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          save((o) => {
            const p = o.purchases.find((x) => x.id === purchase.id);
            if (!p) throw Error(t("upgrade5"));
            p.dueDate = due || undefined;
          });
        }}
      >
        <label>
          {t("upgrade6")}
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </label>
        <Button type="submit">{t("upgrade7")}</Button>
      </form>
      {purchase.dueDate && (
        <p>
          {t("upgrade8")}
          {purchase.dueDate}
        </p>
      )}
      <form
        className="grid gap-3 sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (
            save((o) => {
              const p = o.purchases.find((x) => x.id === purchase.id);
              if (!p) throw Error(t("upgrade9"));
              if (!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0 || !reference.trim())
                throw Error(t("upgrade10"));
              o.supplierPayments.push({
                id: crypto.randomUUID(),
                purchaseId: p.id,
                amountPaise: Math.round(Number(amount) * 100),
                at: new Date().toISOString(),
                reference: reference.trim(),
                voided: false,
              });
            })
          ) {
            setAmount("");
            setReference("");
          }
        }}
      >
        <label>
          {t("upgrade11")}
          <input
            required
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label>
          {t("upgrade12")}
          <input
            required
            maxLength={500}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </label>
        <Button type="submit" disabled={paid >= total}>
          {t("upgrade13")}
        </Button>
      </form>
      {rows.map((x) => (
        <div className="flex flex-wrap gap-3" key={x.id}>
          <span>
            {money(x.amountPaise)} · {x.reference} · {new Date(x.at).toLocaleString("en-IN")}{" "}
            {x.voided ? "(voided)" : ""}
          </span>
          <Button
            disabled={x.voided}
            onClick={() => {
              if (window.confirm(t("upgrade14")))
                save((o) => {
                  const p = o.supplierPayments.find((v) => v.id === x.id);
                  if (p) p.voided = true;
                });
            }}
          >
            {t("upgrade15")}
          </Button>
        </div>
      ))}
    </details>
  );
}
