"use client";
import { useTranslations } from "next-intl";
import { useAdminManagementCatalogue } from "@/app/frontend_admin/admin_management/management_catalogue/state/AdminManagementCatalogueStore";
import { moneyInput } from "@/app/frontend_admin/admin_management/management_catalogue/utils/AdminManagementCatalogueAmounts";
import { Button } from "@/components/ui/Button";
export function AdminManagementCatalogueVariantPrice({ id }: { id: string }) {
  const t = useTranslations("management"),
    { state, dispatch, notify, stale } = useAdminManagementCatalogue(),
    v = state.variants.find((v) => v.id === id)!;
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          const value = String(new FormData(e.currentTarget).get("price"));
          dispatch({
            type: "manage-variant",
            data: {
              operation: {
                id,
                priceOverridePaise:
                  value.trim() === "" ? null : moneyInput(value),
              },
            },
          });
        } catch (e) {
          notify(e instanceof Error ? e.message : t("invalidPrice"));
        }
      }}
    >
      <label className="grid gap-1 text-xs">
        {t("variantPrice")}
        <input
          key={String(v.priceOverridePaise)}
          name="price"
          aria-label={`${v.sku} ${t("variantPrice")}`}
          type="number"
          min="0"
          step="0.01"
          className="w-32"
          defaultValue={
            v.priceOverridePaise === undefined ? "" : v.priceOverridePaise / 100
          }
          placeholder={t("useDesignPrice")}
        />
      </label>
      <Button type="submit" disabled={stale}>
        {t("save")}
      </Button>
    </form>
  );
}
