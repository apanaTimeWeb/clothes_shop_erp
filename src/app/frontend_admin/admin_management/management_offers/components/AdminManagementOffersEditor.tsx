"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import {
  offerSchema,
  type Offer,
  type Catalogue,
} from "@/app/frontend_admin/admin_management/management_offers/schemas/AdminManagementOffersSchema";
export function AdminManagementOffersEditor({
  products,
  initial,
  onSave,
  onCancel,
}: {
  products: Catalogue["products"];
  initial: Partial<Offer>;
  onSave: (o: Offer) => boolean;
  onCancel: () => void;
}) {
  const t = useTranslations("offers");
  const day = (iso?: string) =>
    iso ? new Date(Date.parse(iso) + 19800000).toISOString().slice(0, 10) : "";
  const [name, setName] = useState(initial.name || ""),
    [product, setProduct] = useState(
      initial.productId || products[0]?.id || "",
    ),
    [kind, setKind] = useState(initial.kind || "percent"),
    [value, setValue] = useState(
      String(
        initial.amount
          ? initial.kind === "fixed"
            ? initial.amount / 100
            : initial.amount
          : 10,
      ),
    ),
    [start, setStart] = useState(day(initial.startsAt)),
    [end, setEnd] = useState(day(initial.endsAt)),
    [enabled, setEnabled] = useState(initial.enabled ?? true),
    [error, setError] = useState(false);
  return (
    <form
      className="space-y-4 rounded-xl border border-border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          if (!/^\d+(\.\d{1,2})?$/.test(value) || !start || !end) throw Error();
          const offer = offerSchema.parse({
            id: initial.id || crypto.randomUUID(),
            productId: product,
            name,
            kind,
            amount:
              kind === "fixed"
                ? Math.round(Number(value) * 100)
                : Number(value),
            startsAt: new Date(start + "T00:00:00+05:30").toISOString(),
            endsAt: new Date(end + "T23:59:59.999+05:30").toISOString(),
            enabled,
          });
          if (!products.some((p) => p.id === product) || !onSave(offer))
            throw Error();
          setError(false);
          onCancel();
        } catch {
          setError(true);
        }
      }}
    >
      <h2 className="text-xl font-semibold">{t("edit")}</h2>
      <label>
        {t("product")}
        <select value={product} onChange={(e) => setProduct(e.target.value)}>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.designCode} · {p.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("name")}
        <input
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label>
        {t("kind")}
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as "percent" | "fixed")}
        >
          <option value="percent">{t("percent")}</option>
          <option value="fixed">{t("fixed")}</option>
        </select>
      </label>
      <label>
        {t("value")}
        <input
          required
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          {t("start")}
          <input
            required
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label>
          {t("end")}
          <input
            required
            type="date"
            min={start}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
      </div>
      <p>{t("dateNote")}</p>
      <label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />{" "}
        {t("enabled")}
      </label>
      {error && (
        <p role="alert" className="text-danger">
          {t("invalid")}
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit">{t("save")}</Button>
        <Button onClick={onCancel}>{t("cancel")}</Button>
      </div>
    </form>
  );
}
