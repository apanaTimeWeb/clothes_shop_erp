"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  bestOffer,
  loadCurrentOffers,
} from "@/app/frontend_admin/admin_billing/billing_checkout/state/AdminBillingCheckoutTransactions";
import { Receipt } from "lucide-react";
import { useAdminBillingCheckout } from "@/app/frontend_admin/admin_billing/billing_checkout/state/AdminBillingCheckoutStore";
import { ROUTES } from "@/lib/routes";
import {
  money,
  totals,
} from "@/app/frontend_admin/admin_billing/billing_checkout/utils/AdminBillingCheckoutAmounts";
import { AdminBillingCheckoutForm } from "@/app/frontend_admin/admin_billing/billing_checkout/components/AdminBillingCheckoutForm";
import { AdminBillingCheckoutPosEntry } from "@/app/frontend_admin/admin_billing/billing_checkout/components/AdminBillingCheckoutPosEntry";
export function AdminBillingCheckoutMain() {
  const t = useTranslations("billing"),
    state = useAdminBillingCheckout((s) => s.state),
    stale = useAdminBillingCheckout((s) => s.stale),
    [selected, setSelected] = useState(""),
    [dirty, setDirty] = useState(false);
  const drafts = state.draftBills.filter((d) => d.status === "draft"),
    bill = drafts.find((d) => d.id === selected) || drafts[0];
  function applyOffers() {
    if (!bill || dirty) return;
    try {
      const { dispatch, notify } = useAdminBillingCheckout.getState();
      const data = loadCurrentOffers();
      const discounts = bill.lines.map((line) => {
        const variant = state.variants.find((v) => v.id === line.variantId);
        const product = state.products.find(
          (p) => p.id === variant?.productId && p.status === "active",
        );
        const deal = product ? bestOffer(data.offers, product.id, line.pricePaise, data.at) : null;
        return Math.max(line.lineDiscountPaise || 0, (deal?.discount || 0) * line.qty);
      });
      const subtotal = bill.lines.reduce(
        (sum, line, i) => sum + line.pricePaise * line.qty - discounts[i],
        0,
      );
      if (
        dispatch({
          type: "bill-save",
          data: {
            billId: bill.id,
            operation: { applyOffers: true },
            quantities: bill.lines.map((l) => l.qty),
            lineDiscounts: discounts,
            discountPaise: Math.min(bill.discountPaise, subtotal),
            taxPercent: bill.taxPercent,
            payment: bill.payment,
          },
        })
      )
        notify(t("offersApplied"));
    } catch {
      useAdminBillingCheckout.getState().notify(t("offersError"));
    }
  }
  return (
    <>
      <p className="text-[10px] tracking-widest text-secondary">{t("eyebrow")}</p>
      <h1 className="mt-3 text-3xl font-semibold">{t("title")}</h1>
      <p className="mb-7 mt-2 text-secondary">{t("subtitle")}</p>
      <AdminBillingCheckoutPosEntry disabled={dirty} onSaved={setSelected} />
      {bill && (
        <div className="mb-5 rounded-xl border border-border bg-card p-4">
          <p className="mb-3 text-sm">{t("offersNote")}</p>
          <Button disabled={dirty || stale} onClick={applyOffers}>
            {t("applyOffers")}
          </Button>
        </div>
      )}
      {!bill ? (
        <section className="rounded-xl border border-border bg-card p-12 text-center">
          <Receipt className="mx-auto mb-4 text-secondary" size={32} />
          <h2 className="text-lg font-semibold">{t("noDrafts")}</h2>
          <p className="my-3 text-secondary">{t("empty")}</p>
          <Link href={ROUTES.sessions} className="underline">
            {t("sessions")}
          </Link>
          <p className="mt-5 text-xs text-secondary">{t("savedEmpty")}</p>
        </section>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="space-y-3">
            <h2 className="font-semibold">
              {t("drafts")} ({drafts.length})
            </h2>
            {drafts.map((d, i) => (
              <button
                key={d.id}
                onClick={() => {
                  if (!dirty || window.confirm(t("dirty"))) setSelected(d.id);
                }}
                className={`w-full rounded-xl border border-border p-4 text-left ${d.id === bill.id ? "bg-brand text-on-primary" : "bg-card"}`}
              >
                <strong>{t("bill", { number: i + 1 })}</strong>
                <p className="mt-2 text-xs">
                  {state.sessions.find((s) => s.id === d.sessionId)?.name} ·{" "}
                  {money(totals(d.lines, d.discountPaise, d.taxPercent).totalPaise)}
                </p>
              </button>
            ))}
          </aside>
          <AdminBillingCheckoutForm
            key={`${bill.id}:${bill.lines.length}:${bill.lines.map((l) => l.lineDiscountPaise || 0).join(",")}:${bill.discountPaise}`}
            bill={bill}
            onDirtyChange={setDirty}
          />
        </div>
      )}
    </>
  );
}
