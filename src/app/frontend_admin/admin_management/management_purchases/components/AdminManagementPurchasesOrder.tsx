"use client";
import { t } from "@/app/frontend_admin/admin_management/management_purchases/utils/AdminManagementPurchasesMessages";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { AdminManagementPurchasesState } from "@/app/frontend_admin/admin_management/management_purchases/types/AdminManagementPurchasesTypes";
import {
  purchaseSchema,
  type Purchase,
  type Supplier,
} from "@/app/frontend_admin/admin_management/management_purchases/schemas/AdminManagementPurchasesOperationsSchema";
import { money } from "@/app/frontend_admin/admin_management/management_purchases/utils/AdminManagementPurchasesAmounts";
export function AdminManagementPurchasesOrder({
  shop,
  suppliers,
  onSave,
  onCancel,
}: {
  shop: AdminManagementPurchasesState;
  suppliers: Supplier[];
  onSave: (p: Purchase) => boolean;
  onCancel: () => void;
}) {
  const [supplier, setSupplier] = useState(suppliers[0]?.id || ""),
    [reference, setReference] = useState(""),
    [sku, setSku] = useState(""),
    [location, setLocation] = useState(""),
    [qty, setQty] = useState("1"),
    [cost, setCost] = useState(""),
    [lines, setLines] = useState<Purchase["lines"]>([]),
    [error, setError] = useState("");
  function add() {
    const v = shop.variants.find(
      (v) => v.sku.toLowerCase() === sku.trim().toLowerCase() && v.status === "active",
    );
    if (
      !v ||
      !shop.products.some((p) => p.id === v.productId && p.status === "active") ||
      !shop.locations.some((l) => l.id === location && l.active) ||
      !Number.isInteger(Number(qty)) ||
      Number(qty) < 1 ||
      Number(qty) > 100000 ||
      !/^\d+(\.\d{1,2})?$/.test(cost) ||
      Number(cost) > 1000000
    ) {
      setError(t("message52"));
      return;
    }
    if (lines.length >= 100) {
      setError(t("message53"));
      return;
    }
    setLines([
      ...lines,
      {
        variantId: v.id,
        locationId: location,
        qty: Number(qty),
        unitCostPaise: Math.round(Number(cost) * 100),
      },
    ]);
    setError("");
  }
  return (
    <form
      className="space-y-4 rounded-xl border border-border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          const p = purchaseSchema.parse({
            id: crypto.randomUUID(),
            supplierId: supplier,
            reference: reference.trim(),
            status: "ordered",
            createdAt: new Date().toISOString(),
            lines,
          });
          if (onSave(p)) onCancel();
        } catch {
          setError(t("message54"));
        }
      }}
    >
      <h2 className="text-xl font-semibold">{t("message26")}</h2>
      <p>{t("message27")}</p>
      <label>
        {t("message28")}
        <select required value={supplier} onChange={(e) => setSupplier(e.target.value)}>
          <option value="">{t("message29")}</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("message30")}
        <input
          required
          maxLength={120}
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          {t("message31")}
          <input
            list="purchase-skus"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
          />
          <datalist id="purchase-skus">
            {shop.variants
              .filter((v) => v.status === "active")
              .map((v) => (
                <option key={v.id} value={v.sku} />
              ))}
          </datalist>
        </label>
        <label>
          {t("message32")}
          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="">{t("message33")}</option>
            {shop.locations
              .filter((l) => l.active)
              .map((l) => (
                <option value={l.id} key={l.id}>
                  {l.rack} / {l.shelf} / {l.box}
                </option>
              ))}
          </select>
        </label>
        <label>
          {t("message34")}
          <input
            type="number"
            min={1}
            max={100000}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </label>
        <label>
          {t("message35")}
          <input inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} />
        </label>
      </div>
      <Button onClick={add}>{t("message36")}</Button>
      {lines.map((l, i) => (
        <div className="flex flex-wrap gap-3" key={i}>
          <span>
            {shop.variants.find((v) => v.id === l.variantId)?.sku} × {l.qty} ·{" "}
            {money(l.unitCostPaise * l.qty)}
          </span>
          <Button onClick={() => setLines(lines.filter((_, n) => n !== i))}>
            {t("message37")}
          </Button>
        </div>
      ))}
      <p>
        {t("message38")}
        {money(lines.reduce((n, l) => n + l.qty * l.unitCostPaise, 0))}
      </p>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit" disabled={!lines.length}>
          {t("message39")}
        </Button>
        <Button onClick={onCancel}>{t("message18")}</Button>
      </div>
    </form>
  );
}
