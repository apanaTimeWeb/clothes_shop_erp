"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { AdminBillingCheckoutRewards } from "@/app/frontend_admin/admin_billing/billing_checkout/components/AdminBillingCheckoutRewards";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useAdminBillingCheckout } from "@/app/frontend_admin/admin_billing/billing_checkout/state/AdminBillingCheckoutStore";
import { ROUTES } from "@/lib/routes";
import { resolveCatalogueProductImage } from "@/lib/product_images";
import type { Draft } from "@/app/frontend_admin/admin_billing/billing_checkout/types/AdminBillingCheckoutCommerce";
import {
  labelFor,
  locationLabel,
} from "@/app/frontend_admin/admin_billing/billing_checkout/state/AdminBillingCheckoutTransactions";
import {
  money,
  totals,
} from "@/app/frontend_admin/admin_billing/billing_checkout/utils/AdminBillingCheckoutAmounts";
import { Button } from "@/components/ui/Button";
import { Confirm } from "@/components/ui/Confirm";
import { billSchema } from "@/app/frontend_admin/admin_billing/billing_checkout/schemas/AdminBillingCheckoutInputSchema";
import type { BillForm } from "@/app/frontend_admin/admin_billing/billing_checkout/schemas/AdminBillingCheckoutInputSchema";
export function AdminBillingCheckoutForm({
  bill,
  onDirtyChange,
}: {
  bill: Draft;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [reward, setReward] = useState({ customerId: "", points: 0 });
  const t = useTranslations("billing"),
    { state, dispatch, stale, notify } = useAdminBillingCheckout(),
    router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<BillForm>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      quantities: bill.lines.map((l) => l.qty),
      lineDiscounts: bill.lines.map((l) => String((l.lineDiscountPaise ?? 0) / 100)),
      discount: String(bill.discountPaise / 100),
      tax: bill.taxPercent,
      payment: bill.payment as BillForm["payment"],
    },
  });
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);
  useEffect(() => {
    if (!isDirty) return;
    const guard = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    const click = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a[href]") && !window.confirm(t("dirty"))) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const discard = (e: Event) => {
      if (!window.confirm(t("dirty"))) e.preventDefault();
      else reset();
    };
    window.addEventListener("demo-request-discard", discard);
    window.addEventListener("beforeunload", guard);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("demo-request-discard", discard);
      window.removeEventListener("beforeunload", guard);
      document.removeEventListener("click", click, true);
    };
  }, [isDirty, t, reset]);
  const amount = totals(
    bill.lines,
    Math.min(totals(bill.lines).subtotalPaise, bill.discountPaise + reward.points * 100),
    bill.taxPercent,
  );
  return (
    <section className="rounded-xl border border-border bg-card p-5 md:p-7">
      <div className="mb-6 rounded-lg bg-warning-bg px-4 py-3 text-xs font-bold tracking-widest text-warning">
        {t("demo")}
      </div>
      <AdminBillingCheckoutRewards
        shop={state}
        value={reward}
        onChange={setReward}
        maximum={Math.floor((totals(bill.lines).subtotalPaise - bill.discountPaise) / 100)}
        disabled={stale || isDirty}
      />
      <form
        onSubmit={handleSubmit((values) => {
          if (
            dispatch({
              type: "bill-save",
              data: {
                billId: bill.id,
                quantities: values.quantities,
                lineDiscounts: values.lineDiscounts.map((v) => Math.round(Number(v) * 100)),
                discountPaise: Math.round(Number(values.discount) * 100),
                taxPercent: values.tax,
                payment: values.payment,
              },
            })
          ) {
            reset(values);
            notify(t("saved"));
          }
        })}
      >
        <div className="space-y-4">
          {bill.lines.map((line, index) => {
            const v = state.variants.find((x) => x.id === line.variantId);
            const p = state.products.find((prod) => prod.id === v?.productId);
            const imgSrc = resolveCatalogueProductImage(p?.id || "", p?.name, p?.categoryId, v?.colour);
            return (
              <div
                key={line.pickId}
                className="grid gap-3 border-b border-border pb-4 sm:grid-cols-[1fr_100px]"
              >
                <div className="flex items-center gap-3">
                  <Image
                    src={imgSrc}
                    alt={p?.name || labelFor(state, line.variantId)}
                    width={48}
                    height={48}
                    className="size-12 rounded-lg border border-border bg-subtle p-1 object-contain shrink-0"
                    onError={(e) => { e.currentTarget.src = "/images/real-shirt-white.png"; }}
                  />
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{labelFor(state, line.variantId)}</h3>
                    <p className="mt-0.5 text-xs text-secondary">
                      {locationLabel(state, line.locationId)}
                    </p>
                    <p className="mt-1 text-xs font-semibold">
                      {t("price")}: {money(line.pricePaise)}
                    </p>
                  </div>
                </div>
              <Confirm
                title={t("removeLine")}
                description={t("removeLineNote")}
                confirmLabel={t("removeLine")}
                cancelLabel={t("cancel")}
                trigger={<Button disabled={stale || isDirty}>{t("removeLine")}</Button>}
                onConfirm={() =>
                  dispatch({
                    type: "bill-remove",
                    data: { billId: bill.id, pickId: line.pickId },
                  })
                }
              />
              <label className="grid gap-1 text-xs">
                {t("qty")}
                <input
                  type="number"
                  min="1"
                  max={state.pickItems.find((p) => p.id === line.pickId)?.qty}
                  step="1"
                  aria-invalid={!!errors.quantities?.[index]}
                  {...register(`quantities.${index}`)}
                />
              </label>
              <label className="grid gap-1 text-xs">
                {t("lineDiscount")}
                <input
                  inputMode="decimal"
                  {...register(`lineDiscounts.${index}`)}
                  aria-invalid={!!errors.lineDiscounts?.[index]}
                />
              </label>
            </div>
          );
        })}
        </div>
        <p className="mt-3 text-xs leading-5 text-secondary">{t("remaining")}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <label className="grid gap-2">
            {t("discount")}
            <input inputMode="decimal" {...register("discount")} aria-invalid={!!errors.discount} />
          </label>
          <label className="grid gap-2">
            {t("tax")}
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              {...register("tax")}
              aria-invalid={!!errors.tax}
            />
          </label>
          <label className="grid gap-2">
            {t("payment")}
            <select {...register("payment")}>
              {(["Cash", "UPI", "Card"] as const).map((p) => (
                <option value={p} key={p}>
                  {t(p)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-2 text-xs text-secondary">{t("paymentNote")}</p>
        {Object.keys(errors).length > 0 && (
          <p className="mt-3 text-danger" role="alert">
            {t("validation")}
          </p>
        )}
        <div className="my-6 space-y-3 rounded-xl bg-subtle p-5">
          <div className="flex justify-between">
            <span>{t("subtotal")}</span>
            <span>{money(amount.subtotalPaise)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("discountTotal")}</span>
            <span>−{money(amount.discountPaise)}</span>
          </div>
          <div className="flex justify-between">
            <span>
              {t("taxTotal")} ({amount.taxPercent}%)
            </span>
            <span>{money(amount.taxPaise)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-4 text-xl font-semibold">
            <span>{t("total")}</span>
            <span>{money(amount.totalPaise)}</span>
          </div>
        </div>
        {isDirty && (
          <p className="mb-3 rounded bg-warning-bg p-3 text-xs text-warning">{t("dirty")}</p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={stale || !isDirty}>
            {t("save")}
          </Button>
          {isDirty && (
            <Button
              type="button"
              onClick={() => {
                reset();
                onDirtyChange(false);
              }}
              className="text-xs"
            >
              Revert Changes
            </Button>
          )}
          <Confirm
            trigger={
              <Button
                type="button"
                disabled={stale || isDirty}
                className="bg-brand text-on-primary hover:bg-brand-hover"
              >
                {t("complete")}
              </Button>
            }
            title={t("confirmTitle")}
            description={t("confirmBody")}
            confirmLabel={t("complete")}
            cancelLabel={t("cancel")}
            onConfirm={() => {
              if (dispatch({ type: "bill-complete", data: { billId: bill.id, operation: reward } }))
                router.push(ROUTES.sales);
            }}
          />
          <Confirm
            trigger={
              <Button type="button" disabled={stale}>
                {t("abandon")}
              </Button>
            }
            title={t("abandonTitle")}
            description={t("abandonBody")}
            confirmLabel={t("abandonConfirm")}
            cancelLabel={t("cancel")}
            onConfirm={() => {
              if (dispatch({ type: "bill-abandon", data: { billId: bill.id } }))
                onDirtyChange(false);
            }}
          />
        </div>
      </form>
    </section>
  );
}
