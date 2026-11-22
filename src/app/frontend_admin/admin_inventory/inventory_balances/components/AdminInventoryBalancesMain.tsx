"use client";
import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { PackagePlus } from "lucide-react";
import { useAdminInventoryBalances } from "@/app/frontend_admin/admin_inventory/inventory_balances/state/AdminInventoryBalancesStore";
import {
  productFor,
  variantFor,
  locationLabel,
  sellable,
} from "@/app/frontend_admin/admin_inventory/inventory_balances/state/AdminInventoryBalancesTransactions";
import { money } from "@/app/frontend_admin/admin_inventory/inventory_balances/utils/AdminInventoryBalancesAmounts";
import { Button } from "@/components/ui/Button";
import { AdminInventoryBalancesRestock } from "@/app/frontend_admin/admin_inventory/inventory_balances/components/AdminInventoryBalancesRestock";
import { resolveCatalogueProductImage } from "@/lib/product_images";
export function AdminInventoryBalancesMain() {
  const t = useTranslations("inventory"),
    { state, mode } = useAdminInventoryBalances();
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState(""),
    [page, setPage] = useState(1),
    [target, setTarget] = useState<{
      variantId: string;
      locationId: string;
    } | null>(null);
  const rows = state.inventoryBalances.filter((b) => {
    const v = variantFor(state, b.variantId),
      p = productFor(state, v),
      available = sellable(state, v.id);
    return (
      `${v.sku} ${p.name} ${v.colour} ${v.sizeCode}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (!filter ||
        (filter === "out"
          ? available === 0
          : available > 0 && available <= state.settings.lowStockThreshold))
    );
  });
  const pages = Math.max(1, Math.ceil(rows.length / 20)),
    current = Math.min(page, pages);
  return (
    <>
      <p className="text-[10px] tracking-widest text-secondary">
        {t("eyebrow")}
      </p>
      <h1 className="mt-3 text-3xl font-semibold">{t("title")}</h1>
      <p className="mb-6 mt-2 text-secondary">{t("subtitle")}</p>
      <div className="mb-5 flex flex-wrap gap-3">
        <label className="grow">
          <span className="sr-only">{t("search")}</span>
          <input
            className="w-full"
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          <span className="sr-only">{t("all")}</span>
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t("all")}</option>
            <option value="low">{t("low")}</option>
            <option value="out">{t("out")}</option>
          </select>
        </label>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-subtle text-xs text-secondary">
              <tr>
                {[
                  "sku",
                  "variant",
                  "location",
                  "onHand",
                  "sellable",
                  ...(mode === "Admin" ? ["cost"] : []),
                  "restock",
                ].map((key, i) => (
                  <th
                    key={key}
                    scope="col"
                    className={`whitespace-nowrap px-4 py-4 ${i === 0 ? "sticky start-0 z-10 bg-subtle" : ""}`}
                  >
                    {t(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.slice((current - 1) * 20, current * 20).map((b) => {
                const v = variantFor(state, b.variantId),
                  p = productFor(state, v);
                return (
                  <tr
                    key={`${b.variantId}-${b.locationId}`}
                    className="group hover:bg-subtle"
                  >
                    <th
                      scope="row"
                      className="sticky start-0 bg-card px-4 py-3 font-normal"
                    >
                      <div className="flex items-center gap-2.5">
                        <Image
                          src={resolveCatalogueProductImage(p.id, p.name, p.categoryId, v.colour)}
                          alt={p.name}
                          width={36}
                          height={36}
                          className="size-9 rounded-md object-contain bg-subtle border border-border p-0.5 shrink-0"
                          onError={(e) => { e.currentTarget.src = "/images/real-shirt-white.png"; }}
                        />
                        <div>
                          <strong className="block text-xs text-foreground font-semibold">
                            {v.sku}
                          </strong>
                          <span className="text-xs text-secondary truncate block max-w-[140px]">{p.name}</span>
                        </div>
                      </div>
                    </th>
                    <td className="px-4 py-4">
                      {v.colour}
                      <span className="block text-xs text-secondary">
                        {v.sizeCode} · {v.packUnit}
                      </span>
                    </td>
                    <td className="min-w-40 px-4 py-4 text-xs">
                      {locationLabel(state, b.locationId)}
                    </td>
                    <td className="px-4 py-4">{b.onHand}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${b.onHand - b.nonSellable ? "bg-success-bg text-success" : "bg-danger-bg text-danger"}`}
                      >
                        {b.onHand - b.nonSellable}
                      </span>
                    </td>
                    {mode === "Admin" && (
                      <td className="px-4 py-4">{money(p.costPricePaise)}</td>
                    )}
                    <td className="px-4 py-4">
                      <Button
                        aria-label={`${t("restock")} ${v.sku}`}
                        onClick={() =>
                          setTarget({
                            variantId: v.id,
                            locationId: b.locationId,
                          })
                        }
                      >
                        <PackagePlus size={16} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr>
                  <td
                    className="p-10 text-center text-secondary"
                    colSpan={mode === "Admin" ? 7 : 6}
                  >
                    {t("empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
          <span className="text-xs text-secondary">
            {t("rows", { count: rows.length })}
          </span>
          <div className="flex items-center gap-3">
            <Button
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
            >
              {t("previous")}
            </Button>
            <span className="text-xs">
              {t("page", { page: current, pages })}
            </span>
            <Button
              disabled={current === pages}
              onClick={() => setPage(current + 1)}
            >
              {t("next")}
            </Button>
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-secondary">{t("future")}</p>
      {target && (
        <AdminInventoryBalancesRestock
          {...target}
          onClose={() => setTarget(null)}
        />
      )}
    </>
  );
}
