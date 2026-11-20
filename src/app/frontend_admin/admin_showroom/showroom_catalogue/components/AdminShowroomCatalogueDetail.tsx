"use client";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { AdminShowroomCatalogueGallery } from "@/app/frontend_admin/admin_showroom/showroom_catalogue/components/AdminShowroomCatalogueGallery";
import { X, Plus, Sparkles } from "lucide-react";
import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { shortlistSchema } from "@/app/frontend_admin/admin_showroom/showroom_catalogue/schemas/AdminShowroomCatalogueInputSchema";
import {
  useAdminShowroomCatalogue,
  useAdminShowroomCatalogueOffers,
} from "@/app/frontend_admin/admin_showroom/showroom_catalogue/state/AdminShowroomCatalogueStore";
import {
  bestOffer,
  productFor,
  variantFor,
  sellable,
  priceFor,
} from "@/app/frontend_admin/admin_showroom/showroom_catalogue/state/AdminShowroomCatalogueTransactions";
import { money } from "@/app/frontend_admin/admin_showroom/showroom_catalogue/utils/AdminShowroomCatalogueAmounts";
import { Button } from "@/components/ui/Button";
export function AdminShowroomCatalogueDetail({
  variantId,
  onClose,
}: {
  variantId: string;
  onClose: () => void;
}) {
  const opener = useRef<HTMLElement | null>(
    typeof document !== "undefined"
      ? (document.activeElement as HTMLElement)
      : null,
  );
  const t = useTranslations("showroom"),
    { state, dispatch, notify, stale } = useAdminShowroomCatalogue();
  const [selected, setSelected] = useState(variantId);
  const variant = variantFor(state, selected),
    product = productFor(state, variant),
    variants = state.variants.filter(
      (v) => v.productId === product.id && v.status === "active",
    );

  const offers = useAdminShowroomCatalogueOffers();
  const deal = bestOffer(
    offers.offers,
    product.id,
    priceFor(state, variant),
    offers.now,
  );
  const available = sellable(state, selected);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ qty: number }>({
    resolver: zodResolver(shortlistSchema),
    defaultValues: { qty: 1 },
  });
  function changeColour(colour: string) {
    const next =
      variants.find(
        (v) => v.colour === colour && v.sizeCode === variant.sizeCode,
      ) || variants.find((v) => v.colour === colour);
    if (next) setSelected(next.id);
  }
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-backdrop" />
        <Dialog.Content
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener.current?.focus();
          }}
          className="fixed inset-3 z-50 m-auto max-h-[92dvh] max-w-4xl overflow-auto rounded-2xl border border-border bg-card p-5 shadow-dialog md:inset-y-10 md:p-8"
        >
          <Dialog.Close asChild>
            <Button
              className="absolute right-4 top-4 z-10"
              aria-label={t("close")}
            >
              <X size={18} />
            </Button>
          </Dialog.Close>
          <div className="grid gap-7 md:grid-cols-2">
            <AdminShowroomCatalogueGallery
              key={variant.colour}
              productId={product.id}
              colour={variant.colour}
            />
            <div className="pt-10 md:pt-4">
              <p className="mb-3 text-xs tracking-widest text-secondary">
                {product.designCode} / {product.departmentId}
              </p>
              <Dialog.Title className="text-3xl font-semibold tracking-tight">
                {product.name}
              </Dialog.Title>
              <Dialog.Description className="mt-3 text-sm leading-6 text-secondary">
                {product.description}
              </Dialog.Description>
              <p className="mt-5 text-2xl font-semibold">
                {deal && (
                  <del className="me-3 text-base text-secondary">
                    {money(priceFor(state, variant))}
                  </del>
                )}
                {money(priceFor(state, variant) - (deal?.discount || 0))}{" "}
                <span className="text-xs font-normal text-secondary">
                  {t("price")}
                </span>
              </p>
              {deal && (
                <p className="text-success">
                  {deal.offer.name} · {t("offerBilling")}
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  product.fabric,
                  product.sleeve !== "None" ? `${product.sleeve} sleeve` : null,
                  product.collar !== "None" ? product.collar : null,
                ]
                  .filter(Boolean)
                  .map((x) => (
                    <span
                      key={x}
                      className="rounded-full bg-subtle px-3 py-1 text-xs"
                    >
                      {x}
                    </span>
                  ))}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <label className="grid gap-2">
                  {t("colour")}
                  <select
                    value={variant.colour}
                    onChange={(e) => changeColour(e.target.value)}
                  >
                    {[...new Set(variants.map((v) => v.colour))].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2">
                  {t("size")}
                  <select
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                  >
                    {variants
                      .filter((v) => v.colour === variant.colour)
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.sizeCode}
                          {!sellable(state, v.id)
                            ? ` — ${t("unavailable")}`
                            : ""}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
              <div className="my-5 space-y-2 border-y border-border py-4 text-xs text-secondary">
                <p>
                  {t("sku")}:{" "}
                  <strong className="text-primary">{variant.sku}</strong>
                </p>
                <p>
                  {t("unit")}: {variant.packUnit}
                </p>
                <p className={available ? "text-success" : "text-danger"}>
                  {available
                    ? t("available", { count: available })
                    : t("unavailable")}
                </p>
              </div>
              <form
                onSubmit={handleSubmit((values) => {
                  if (
                    dispatch({
                      type: "shortlist-add",
                      data: { variantId: selected, qty: values.qty },
                    })
                  ) {
                    notify(t("added"));
                    onClose();
                  }
                })}
              >
                <label className="grid gap-2">
                  {t("quantity")}
                  <input
                    type="number"
                    min="1"
                    step="1"
                    max={available}
                    aria-invalid={!!errors.qty}
                    aria-describedby={errors.qty ? "qty-error" : undefined}
                    {...register("qty")}
                  />
                </label>
                {errors.qty && (
                  <p id="qty-error" className="mt-2 text-danger">
                    {t("required")}
                  </p>
                )}
                <Button
                  type="submit"
                  className="mt-4 w-full bg-brand text-on-primary hover:bg-brand-hover"
                  disabled={!available || !state.activeSessionId || stale}
                >
                  <Plus size={18} />
                  {t("add")}
                </Button>
                <Link
                  href={`/frontend_admin/admin_showroom/showroom_studio?product=${product.id}&colour=${encodeURIComponent(variant.colour)}`}
                  className="mt-3 flex w-full min-h-11 items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
                >
                  <Sparkles size={18} />
                  Virtual Try-On & Style Preview
                </Link>
              </form>
              <p className="mt-3 text-xs leading-5 text-secondary">
                {!state.activeSessionId ? t("sessionNeeded") : t("notReserved")}
              </p>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
