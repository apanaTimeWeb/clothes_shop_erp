"use client";
import { t } from "@/app/frontend_admin/admin_management/management_purchases/utils/AdminManagementPurchasesMessages";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import type { Purchase } from "@/app/frontend_admin/admin_management/management_purchases/schemas/AdminManagementPurchasesOperationsSchema";
export function AdminManagementPurchasesReceive({
  purchase,
  labels,
  onReceive,
}: {
  purchase: Purchase;
  labels: string[];
  onReceive: (quantities: number[]) => boolean;
}) {
  const submitting = useRef(false);
  const remaining = purchase.lines.map((l) => l.qty - (l.receivedQty || 0));
  const [quantities, setQuantities] = useState(remaining);
  return (
    <details>
      <summary>{t("upgrade16")}</summary>
      <p>{t("upgrade17")}</p>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (submitting.current || !window.confirm(t("upgrade18"))) return;
          submitting.current = true;
          if (!onReceive(quantities)) submitting.current = false;
        }}
      >
        {purchase.lines.map((l, i) => (
          <label className="block" key={i}>
            {labels[i]}
            {t("upgrade19")}
            {l.qty}
            {t("upgrade20")}
            {l.receivedQty || 0}
            {t("upgrade21")}
            {remaining[i]}
            <input
              type="number"
              min={0}
              max={remaining[i]}
              required
              value={quantities[i]}
              onChange={(e) =>
                setQuantities(quantities.map((q, n) => (n === i ? Number(e.target.value) : q)))
              }
            />
          </label>
        ))}
        <Button type="submit">{t("upgrade22")}</Button>
      </form>
    </details>
  );
}
