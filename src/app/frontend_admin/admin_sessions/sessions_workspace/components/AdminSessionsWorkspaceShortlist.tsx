"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useAdminSessionsWorkspace } from "@/app/frontend_admin/admin_sessions/sessions_workspace/state/AdminSessionsWorkspaceStore";
import {
  labelFor,
  priceFor,
  variantFor,
} from "@/app/frontend_admin/admin_sessions/sessions_workspace/state/AdminSessionsWorkspaceTransactions";
import { money } from "@/app/frontend_admin/admin_sessions/sessions_workspace/utils/AdminSessionsWorkspaceAmounts";
import { Button } from "@/components/ui/Button";
import { resolveCatalogueProductImage } from "@/lib/product_images";

export function AdminSessionsWorkspaceShortlist() {
  const t = useTranslations("sessions"),
    { state, dispatch, stale } = useAdminSessionsWorkspace();

  return (
    <div className="my-4 divide-y divide-border">
      {state.shortlistItems
        .filter(
          (i) =>
            i.sessionId === state.activeSessionId && i.status === "shortlisted",
        )
        .map((i) => {
          const v = variantFor(state, i.variantId);
          const p = state.products.find((prod) => prod.id === v.productId);
          const imgSrc = resolveCatalogueProductImage(
            p?.id || "",
            p?.name,
            p?.categoryId,
            v.colour,
          );

          return (
            <form
              key={`${i.id}:${i.qty}`}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
              onSubmit={(e) => {
                e.preventDefault();
                dispatch({
                  type: "shortlist-update",
                  data: {
                    variantId: i.variantId,
                    qty: new FormData(e.currentTarget).get("qty"),
                  },
                });
              }}
            >
              <div className="flex items-center gap-3 grow">
                <Image
                  src={imgSrc}
                  alt={p?.name || labelFor(state, i.variantId)}
                  width={52}
                  height={52}
                  className="size-12 rounded-lg border border-border bg-subtle p-1 object-contain shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = "/images/real-shirt-white.png";
                  }}
                />
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {labelFor(state, i.variantId)}
                  </p>
                  <p className="text-xs text-secondary">
                    {money(priceFor(state, v))} × {i.qty}
                  </p>
                </div>
              </div>
              <div className="flex items-end gap-2">
                <label className="grid gap-1">
                  <span className="text-xs text-secondary">{t("qty")}</span>
                  <input
                    name="qty"
                    className="w-20"
                    type="number"
                    min="1"
                    step="1"
                    required
                    defaultValue={i.qty}
                  />
                </label>
                <Button type="submit" disabled={stale} className="min-h-9 text-xs">
                  {t("update")}
                </Button>
                <Button
                  disabled={stale}
                  className="min-h-9 text-xs"
                  onClick={() =>
                    dispatch({
                      type: "shortlist-update",
                      data: { variantId: i.variantId, qty: 0 },
                    })
                  }
                >
                  {t("remove")}
                </Button>
              </div>
            </form>
          );
        })}
    </div>
  );
}