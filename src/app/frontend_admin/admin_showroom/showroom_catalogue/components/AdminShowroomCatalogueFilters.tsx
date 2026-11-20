"use client";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAdminShowroomCatalogue } from "@/app/frontend_admin/admin_showroom/showroom_catalogue/state/AdminShowroomCatalogueStore";
import type { SearchFilters } from "@/app/frontend_admin/admin_showroom/showroom_catalogue/types/AdminShowroomCatalogueTypes";
import { Button } from "@/components/ui/Button";
export function AdminShowroomCatalogueFilters({
  query,
  setQuery,
  filters,
  setFilters,
}: {
  query: string;
  setQuery: (s: string) => void;
  filters: SearchFilters;
  setFilters: (f: SearchFilters) => void;
}) {
  const t = useTranslations("showroom"),
    state = useAdminShowroomCatalogue((s) => s.state);
  const change = (key: keyof SearchFilters, value: string | boolean) =>
    setFilters(
      key === "category"
        ? {
            ...filters,
            category: String(value),
            sleeve: "",
            collar: "",
            size: "",
            fit: "",
            packUnit: "",
          }
        : key === "colour"
          ? { ...filters, colour: String(value), size: "" }
          : { ...filters, [key]: value },
    );
  const visibleProducts = state.products.filter(
    (p) =>
      (!filters.category || p.categoryId === filters.category) &&
      (!filters.department || p.departmentId === filters.department),
  );
  const visibleVariants = state.variants.filter((v) =>
    visibleProducts.some((p) => p.id === v.productId),
  );
  const facets = [
    ["colour", [...new Set(visibleVariants.map((v) => v.colour))]],
    [
      "size",
      [
        ...new Set(
          visibleVariants
            .filter((v) => !filters.colour || v.colour === filters.colour)
            .map((v) => v.sizeCode),
        ),
      ],
    ],
    ["fabric", [...new Set(visibleProducts.map((p) => p.fabric))]],
    ["fit", [...new Set(visibleProducts.map((p) => p.fit))]],
    ["packUnit", [...new Set(visibleVariants.map((v) => v.packUnit))]],
  ] as const;
  return (
    <section
      className="mb-7 rounded-xl border border-border bg-card p-4 shadow-card"
      aria-label={t("searchLabel")}
    >
      <div className="flex flex-col gap-3 lg:flex-row">
        <label className="relative grow">
          <span className="sr-only">{t("searchLabel")}</span>
          <Search size={18} className="absolute left-3 top-3 text-secondary" />
          <input
            className="w-full pl-10 font-normal"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            list="showroom-suggestions"
          />
        </label>
        <label>
          <span className="sr-only">{t("allDepartments")}</span>
          <select
            className="w-full"
            value={filters.department || ""}
            onChange={(e) => change("department", e.target.value)}
          >
            <option value="">{t("allDepartments")}</option>
            {state.departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">{t("allCategories")}</span>
          <select
            className="w-full"
            value={filters.category || ""}
            onChange={(e) => change("category", e.target.value)}
          >
            <option value="">{t("allCategories")}</option>
            {state.categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <datalist id="showroom-suggestions">
        {[
          "black cotton full sleeve collar tshirt XL",
          "telecot shirt",
          "white formal shirt 42",
          "dark blue jeans 34",
          "ladies kurti XXL",
          "kids red dress",
          "black socks",
        ].map((q) => (
          <option key={q} value={q} />
        ))}
      </datalist>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <SlidersHorizontal
          className="mb-3 hidden text-secondary sm:block"
          size={16}
        />
        {facets.map(([key, values]) => (
          <label className="grid gap-1" key={key}>
            {t(key)}
            <select
              value={filters[key] || ""}
              onChange={(e) => change(key, e.target.value)}
            >
              <option value="">{t("any")}</option>
              {values.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        ))}
        {[
          "T-shirt",
          "Shirt",
          "Kurti",
          "Kurta",
          "Dress",
          "Winterwear",
          "Set",
        ].includes(filters.category || "") &&
          (["sleeve", "collar"] as const).map((key) => (
            <label className="grid gap-1" key={key}>
              {t(key)}
              <select
                value={filters[key] || ""}
                onChange={(e) => change(key, e.target.value)}
              >
                <option value="">{t("any")}</option>
                {[
                  ...new Set(
                    state.products
                      .filter((p) => p.categoryId === filters.category)
                      .map((p) => p[key]),
                  ),
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          ))}
        <label className="grid gap-1">
          {t("maxPrice")}
          <input
            className="w-32"
            type="number"
            min="0"
            value={filters.maxPrice || ""}
            onChange={(e) => change("maxPrice", e.target.value)}
          />
        </label>
        <label className="mb-3 flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!filters.inStock}
            onChange={(e) => change("inStock", e.target.checked)}
          />
          {t("inStock")}
        </label>
        <Button
          onClick={() => {
            setQuery("");
            setFilters({});
          }}
          className="ml-auto"
        >
          <X size={14} />
          {t("clear")}
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {Object.entries(filters)
          .filter(([key, value]) => key !== "sort" && !!value)
          .map(([key, value]) => (
            <Button
              key={key}
              aria-label={`${t("removeFilter")} ${key}`}
              onClick={() => {
                const next = { ...filters };
                delete next[key as keyof SearchFilters];
                setFilters(next);
              }}
            >
              {t(
                key === "department"
                  ? "allDepartments"
                  : key === "category"
                    ? "allCategories"
                    : key,
              )}
              : {value === true ? t("inStock") : String(value)} ×
            </Button>
          ))}
      </div>
    </section>
  );
}
