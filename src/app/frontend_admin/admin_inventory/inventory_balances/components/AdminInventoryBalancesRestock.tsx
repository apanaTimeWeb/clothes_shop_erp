"use client";
import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useAdminInventoryBalances } from "@/app/frontend_admin/admin_inventory/inventory_balances/state/AdminInventoryBalancesStore";
import {
  locationLabel,
  labelFor,
} from "@/app/frontend_admin/admin_inventory/inventory_balances/state/AdminInventoryBalancesTransactions";
import { Button } from "@/components/ui/Button";
import { restockSchema } from "@/app/frontend_admin/admin_inventory/inventory_balances/schemas/AdminInventoryBalancesInputSchema";
export function AdminInventoryBalancesRestock({
  variantId,
  locationId,
  onClose,
}: {
  variantId: string;
  locationId: string;
  onClose: () => void;
}) {
  const opener = useRef<HTMLElement | null>(
    typeof document !== "undefined"
      ? (document.activeElement as HTMLElement)
      : null,
  );
  const t = useTranslations("inventory"),
    { state, dispatch, notify, stale } = useAdminInventoryBalances();
  const [opening, setOpening] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ qty: number; locationId: string }>({
    resolver: zodResolver(restockSchema),
    defaultValues: { qty: 1, locationId },
  });
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
          className="fixed inset-x-4 top-1/4 z-50 mx-auto max-w-lg rounded-xl bg-card p-6 shadow-dialog"
        >
          <Dialog.Title className="text-xl font-semibold">
            {t("titleRestock")}
          </Dialog.Title>
          <Dialog.Description className="my-3 text-secondary">
            {labelFor(state, variantId)}
          </Dialog.Description>
          <p className="mb-5 text-xs leading-5 text-secondary">{t("note")}</p>
          <form
            onSubmit={handleSubmit((values) => {
              if (
                dispatch({
                  type: opening ? "opening-stock" : "restock",
                  data: { variantId, ...values },
                })
              ) {
                notify(t("saved"));
                onClose();
              }
            })}
            className="space-y-4"
          >
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={opening}
                onChange={(e) => setOpening(e.target.checked)}
              />
              {t("opening")}
            </label>
            <label className="grid gap-2">
              {t("qty")}
              <input
                type="number"
                min="1"
                step="1"
                {...register("qty")}
                aria-invalid={!!errors.qty}
              />
            </label>
            <label className="grid gap-2">
              {t("destination")}
              <select {...register("locationId")}>
                {state.locations
                  .filter((l) => l.active)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {locationLabel(state, l.id)}
                    </option>
                  ))}
              </select>
            </label>
            {Object.keys(errors).length > 0 && (
              <p role="alert" className="text-danger">
                {t("invalid")}
              </p>
            )}
            <div className="flex gap-3">
              <Button
                className="bg-brand text-on-primary hover:bg-brand-hover"
                type="submit"
                disabled={stale}
              >
                {t("submit")}
              </Button>
              <Dialog.Close asChild>
                <Button type="button">{t("cancel")}</Button>
              </Dialog.Close>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
