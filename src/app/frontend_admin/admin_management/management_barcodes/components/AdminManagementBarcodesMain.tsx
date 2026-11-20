"use client";
import { t } from "@/app/frontend_admin/admin_management/management_barcodes/utils/AdminManagementBarcodesMessages";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useAdminManagementBarcodes } from "@/app/frontend_admin/admin_management/management_barcodes/hooks/useAdminManagementBarcodes";
import { AdminManagementBarcodesCamera } from "@/app/frontend_admin/admin_management/management_barcodes/components/AdminManagementBarcodesCamera";
import { AdminManagementBarcodesLabel } from "@/app/frontend_admin/admin_management/management_barcodes/components/AdminManagementBarcodesLabel";
import { encodeLabel } from "@/app/frontend_admin/admin_management/management_barcodes/utils/AdminManagementBarcodesEncoding";
import { money } from "@/app/frontend_admin/admin_management/management_barcodes/utils/AdminManagementBarcodesAmounts";
export function AdminManagementBarcodesMain() {
  const { shop, ready, error, canEdit } = useAdminManagementBarcodes();
  const [input, setInput] = useState(""),
    [selected, setSelected] = useState(""),
    [message, setMessage] = useState(""),
    [qty, setQty] = useState(1),
    [labels, setLabels] = useState<{ id: string; qty: number }[]>([]),
    [printing, setPrinting] = useState(false);
  const preview = useRef<HTMLDivElement>(null);
  function scan(value: string) {
    const code = value.trim().replace(/^\*|\*$/g, "");
    setInput(code);
    const v = shop.variants.find(
      (v) =>
        v.sku.toLowerCase() === code.toLowerCase() &&
        v.status === "active" &&
        shop.products.some((p) => p.id === v.productId && p.status === "active"),
    );
    setSelected(v?.id || "");
    setMessage(v ? t("message14") : t("message15"));
  }
  useEffect(() => {
    if (!printing) return;
    const done = () => setPrinting(false);
    window.addEventListener("afterprint", done);
    const timer = setTimeout(() => window.print(), 100);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", done);
    };
  }, [printing]);
  if (!canEdit) return <p>{t("message16")}</p>;
  const variant = shop.variants.find((v) => v.id === selected),
    product = shop.products.find((p) => p.id === variant?.productId);
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">{t("message17")}</h1>
      <p>{t("message18")}</p>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      <form
        className="flex flex-wrap gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          scan(input);
        }}
      >
        <label>
          {t("message19")}
          <input
            autoComplete="off"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            list="barcode-skus"
          />
          <datalist id="barcode-skus">
            {shop.variants
              .filter((v) => v.status === "active")
              .map((v) => (
                <option key={v.id} value={v.sku} />
              ))}
          </datalist>
        </label>
        <Button type="submit" disabled={!ready}>
          {t("message20")}
        </Button>
      </form>
      <AdminManagementBarcodesCamera onScan={scan} />
      <p role="status">{message}</p>
      {variant && product && (
        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h2>
            {product.name} · {variant.colour} / {variant.sizeCode}
          </h2>
          <p>
            {variant.sku} · {money(variant.priceOverridePaise ?? product.defaultPricePaise)}
          </p>
          {shop.inventoryBalances
            .filter((b) => b.variantId === variant.id)
            .map((b) => (
              <p key={b.locationId}>
                {shop.locations.find((l) => l.id === b.locationId)?.rack} /{" "}
                {shop.locations.find((l) => l.id === b.locationId)?.shelf} /{" "}
                {shop.locations.find((l) => l.id === b.locationId)?.box}: {b.onHand - b.nonSellable}
                {t("message21")}
              </p>
            ))}
          <Link
            className="underline"
            href={`/frontend_admin/admin_billing/billing_checkout?sku=${encodeURIComponent(variant.sku)}`}
          >
            {t("message22")}
          </Link>
          <div ref={preview}>
            <AdminManagementBarcodesLabel sku={variant.sku} name={product.name} />
          </div>
          <div className="flex flex-wrap gap-3">
            <label>
              {t("message23")}
              <input
                type="number"
                min={1}
                max={100}
                value={qty}
                onChange={(e) =>
                  setQty(Math.min(100, Math.max(1, Math.floor(Number(e.target.value) || 1))))
                }
              />
            </label>
            <Button
              disabled={!encodeLabel(variant.sku)}
              onClick={() => {
                if (labels.reduce((n, l) => n + l.qty, 0) + qty > 200) {
                  setMessage(t("message24"));
                  return;
                }
                setLabels([...labels, { id: variant.id, qty }]);
              }}
            >
              {t("message25")}
            </Button>
            <Button
              disabled={!encodeLabel(variant.sku)}
              onClick={() => {
                const svg = preview.current?.querySelector("svg");
                if (!svg) return;
                const url = URL.createObjectURL(
                  new Blob([svg.outerHTML], { type: "image/svg+xml" }),
                );
                const a = document.createElement("a");
                a.href = url;
                a.download = "product-barcode.svg";
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
            >
              {t("message26")}
            </Button>
          </div>
        </section>
      )}
      <h2 className="text-xl font-semibold">{t("message27")}</h2>
      {labels.map((l, i) => (
        <div className="flex gap-3" key={i}>
          <span>
            {shop.variants.find((v) => v.id === l.id)?.sku} × {l.qty}
          </span>
          <Button onClick={() => setLabels(labels.filter((_, n) => n !== i))}>
            {t("message28")}
          </Button>
        </div>
      ))}
      <div className="flex gap-3">
        <Button disabled={!labels.length} onClick={() => setPrinting(true)}>
          {t("message29")}
        </Button>
        <Button
          onClick={() => {
            setLabels([]);
            setPrinting(false);
          }}
        >
          {t("message30")}
        </Button>
      </div>
      <p>{t("message31")}</p>
      {printing &&
        createPortal(
          <div id="print-receipt">
            {labels.flatMap((l, i) => {
              const v = shop.variants.find((v) => v.id === l.id)!;
              const p = shop.products.find((p) => p.id === v.productId)!;
              return Array.from({ length: l.qty }, (_, n) => (
                <section className="mb-4 break-inside-avoid" key={`${i}-${n}`}>
                  <p>
                    {p.name} · {v.colour} / {v.sizeCode}
                  </p>
                  <AdminManagementBarcodesLabel sku={v.sku} name={p.name} />
                </section>
              ));
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}
