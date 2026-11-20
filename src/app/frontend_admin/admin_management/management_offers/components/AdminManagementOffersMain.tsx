"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Confirm } from "@/components/ui/Confirm";
import { useAdminManagementOffers } from "@/app/frontend_admin/admin_management/management_offers/hooks/useAdminManagementOffers";
import {
  slowProducts,
  offerStatus,
} from "@/app/frontend_admin/admin_management/management_offers/state/AdminManagementOffersAnalysis";
import { AdminManagementOffersEditor } from "@/app/frontend_admin/admin_management/management_offers/components/AdminManagementOffersEditor";
import { AdminManagementOffersBackup } from "@/app/frontend_admin/admin_management/management_offers/components/AdminManagementOffersBackup";
import type { Offer } from "@/app/frontend_admin/admin_management/management_offers/schemas/AdminManagementOffersSchema";
export function AdminManagementOffersMain() {
  const t = useTranslations("offers");
  const { catalogue, offers, canEdit, ready, error, now, update } =
    useAdminManagementOffers();
  const [editing, setEditing] = useState<Partial<Offer> | null>(null),
    [days, setDays] = useState(30),
    [maxSold, setMaxSold] = useState(2),
    [age, setAge] = useState(14);
  if (!canEdit) return <p>{t("staffOnly")}</p>;
  const candidates = slowProducts(catalogue, days, maxSold, age, now);
  const products = catalogue.products.filter((p) => p.status === "active");
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">{t("title")}</h1>
      <p>{t("intro")}</p>
      {error && (
        <p role="alert" className="text-danger">
          {t("storageError")}
        </p>
      )}
      <AdminManagementOffersBackup />
      {!ready && !error && <p>{t("loading")}</p>}
      <Button
        disabled={!ready || !products.length}
        onClick={() => setEditing({})}
      >
        {t("new")}
      </Button>
      {editing && (
        <AdminManagementOffersEditor
          key={editing.id || editing.productId || "new"}
          initial={editing}
          products={products}
          onSave={(o) => update(o)}
          onCancel={() => setEditing(null)}
        />
      )}
      <section>
        <h2 className="text-xl font-semibold">{t("offers")}</h2>
        {!offers.length && <p>{t("empty")}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          {offers.map((o) => (
            <article
              key={o.id}
              className="space-y-2 rounded-xl border border-border bg-card p-4"
            >
              <h3 className="font-semibold">{o.name}</h3>
              <p>
                {catalogue.products.find((p) => p.id === o.productId)?.name ||
                  o.productId}{" "}
                · {t(offerStatus(o, now))}
              </p>
              <p>
                {o.kind === "percent"
                  ? t("percentValue", { value: o.amount })
                  : t("fixedValue", {
                      value: new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                      }).format(o.amount / 100),
                    })}
              </p>
              <p>
                {new Intl.DateTimeFormat("en-IN", {
                  timeZone: "Asia/Kolkata",
                }).format(new Date(o.startsAt))}{" "}
                –{" "}
                {new Intl.DateTimeFormat("en-IN", {
                  timeZone: "Asia/Kolkata",
                }).format(new Date(o.endsAt))}{" "}
                · {t("india")}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setEditing(o)}>{t("edit")}</Button>
                <Button onClick={() => update({ ...o, enabled: !o.enabled })}>
                  {t(o.enabled ? "pause" : "enable")}
                </Button>
                <Confirm
                  trigger={<Button>{t("delete")}</Button>}
                  title={t("delete")}
                  description={t("deleteNote")}
                  confirmLabel={t("delete")}
                  cancelLabel={t("cancel")}
                  onConfirm={() => update(null, o.id)}
                />
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t("slow")}</h2>
        <p>{t("slowNote")}</p>
        <div className="flex flex-wrap gap-4">
          <label>
            {t("days")}
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              {[7, 30, 60, 90].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("maxSold")}
            <input
              type="number"
              min={0}
              max={1000}
              value={maxSold}
              onChange={(e) =>
                setMaxSold(
                  Math.min(
                    1000,
                    Math.max(0, Math.floor(Number(e.target.value) || 0)),
                  ),
                )
              }
            />
          </label>
          <label>
            {t("minAge")}
            <input
              type="number"
              min={0}
              max={3650}
              value={age}
              onChange={(e) =>
                setAge(
                  Math.min(
                    3650,
                    Math.max(0, Math.floor(Number(e.target.value) || 0)),
                  ),
                )
              }
            />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead>
              <tr>
                {["product", "sold", "stock", "age", "action"].map((k) => (
                  <th key={k}>{t(k)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {candidates.map((r) => (
                <tr key={r.product.id}>
                  <td>
                    {r.product.designCode} · {r.product.name}
                  </td>
                  <td>{r.sold}</td>
                  <td>{r.stock}</td>
                  <td>{r.age}</td>
                  <td>
                    <Button
                      onClick={() => setEditing({ productId: r.product.id })}
                    >
                      {t("makeOffer")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!candidates.length && <p>{t("noSlow")}</p>}
      </section>
    </div>
  );
}
