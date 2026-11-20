"use client";
import { useTranslations } from "next-intl";

import { useEffect, useState } from "react";
import { readDocument, subscribeDocument } from "@/lib/browser_document";
import {
  operationsSchema,
  emptyOperations,
  operationsKey,
  pointBalance,
} from "@/app/frontend_admin/admin_billing/billing_checkout/state/AdminBillingCheckoutTransactions";
import type { AdminBillingCheckoutState } from "@/app/frontend_admin/admin_billing/billing_checkout/types/AdminBillingCheckoutTypes";
export function AdminBillingCheckoutRewards({
  shop,
  value,
  onChange,
  maximum,
  disabled,
}: {
  shop: AdminBillingCheckoutState;
  value: { customerId: string; points: number };
  onChange: (v: { customerId: string; points: number }) => void;
  maximum: number;
  disabled: boolean;
}) {
  const t = useTranslations("billing");
  const [ops, setOps] = useState(emptyOperations),
    [error, setError] = useState("");
  useEffect(() => {
    function load() {
      try {
        setOps(
          operationsSchema.parse(
            JSON.parse(readDocument(operationsKey) || JSON.stringify(emptyOperations)),
          ),
        );
        setError("");
      } catch {
        setError(t("upgrade1"));
      }
    }
    load();
    return subscribeDocument(operationsKey, load, load);
  }, [t]);
  const balance = pointBalance(shop, ops, value.customerId);
  return (
    <section className="my-4 grid gap-3 rounded-xl border border-border p-4">
      <h2>{t("upgrade2")}</h2>
      <p>{t("upgrade3")}</p>
      {error && <p role="alert">{error}</p>}
      <label>
        {t("upgrade4")}
        <select
          disabled={disabled || !!error}
          value={value.customerId}
          onChange={(e) => onChange({ customerId: e.target.value, points: 0 })}
        >
          <option value="">{t("upgrade5")}</option>
          {ops.customers
            .filter((c) => c.active && c.consent)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.phone}
              </option>
            ))}
        </select>
      </label>
      <p>
        {t("upgrade6")}
        {Math.max(0, balance)}
      </p>
      <label>
        {t("upgrade7")}
        <input
          disabled={disabled || !!error || !value.customerId}
          type="number"
          min={0}
          max={Math.max(0, Math.min(balance, maximum))}
          value={value.points}
          onChange={(e) =>
            onChange({
              ...value,
              points: Math.max(
                0,
                Math.min(Math.floor(Number(e.target.value) || 0), Math.max(0, balance), maximum),
              ),
            })
          }
        />
      </label>
    </section>
  );
}
