"use client";
import { useTranslations } from "next-intl";
import { useAdminSessionsWorkspace } from "@/app/frontend_admin/admin_sessions/sessions_workspace/state/AdminSessionsWorkspaceStore";
import {
  labelFor,
  priceFor,
  variantFor,
} from "@/app/frontend_admin/admin_sessions/sessions_workspace/state/AdminSessionsWorkspaceTransactions";
import { money } from "@/app/frontend_admin/admin_sessions/sessions_workspace/utils/AdminSessionsWorkspaceAmounts";
import { Button } from "@/components/ui/Button";
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
        .map((i) => (
          <form
            key={`${i.id}:${i.qty}`}
            className="flex flex-wrap items-end justify-between gap-3 py-4"
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
            <div className="grow">
              <p>{labelFor(state, i.variantId)}</p>
              <p className="text-sm text-secondary">
                {money(priceFor(state, variantFor(state, i.variantId)))} ×{" "}
                {i.qty}
              </p>
            </div>
            <label className="grid gap-1">
              {t("qty")}
              <input
                name="qty"
                className="w-24"
                type="number"
                min="1"
                step="1"
                required
                defaultValue={i.qty}
              />
            </label>
            <Button type="submit" disabled={stale}>
              {t("update")}
            </Button>
            <Button
              disabled={stale}
              onClick={() =>
                dispatch({
                  type: "shortlist-update",
                  data: { variantId: i.variantId, qty: 0 },
                })
              }
            >
              {t("remove")}
            </Button>
          </form>
        ))}
    </div>
  );
}
