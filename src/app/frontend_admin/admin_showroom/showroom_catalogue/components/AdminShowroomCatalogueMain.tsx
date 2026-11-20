"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, SearchX } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useAdminShowroomCatalogue,
  useAdminShowroomCatalogueOffers,
} from "@/app/frontend_admin/admin_showroom/showroom_catalogue/state/AdminShowroomCatalogueStore";
import {
  search,
  bestOffer,
  priceFor,
} from "@/app/frontend_admin/admin_showroom/showroom_catalogue/state/AdminShowroomCatalogueTransactions";
import { money } from "@/app/frontend_admin/admin_showroom/showroom_catalogue/utils/AdminShowroomCatalogueAmounts";
import type {
  SearchFilters,
  SearchResult,
} from "@/app/frontend_admin/admin_showroom/showroom_catalogue/types/AdminShowroomCatalogueTypes";
import { Button } from "@/components/ui/Button";
import { AdminShowroomCatalogueFilters } from "@/app/frontend_admin/admin_showroom/showroom_catalogue/components/AdminShowroomCatalogueFilters";
import { AdminShowroomCatalogueDetail } from "@/app/frontend_admin/admin_showroom/showroom_catalogue/components/AdminShowroomCatalogueDetail";
import { AdminShowroomCatalogueCompare } from "@/app/frontend_admin/admin_showroom/showroom_catalogue/components/AdminShowroomCatalogueCompare";
export function AdminShowroomCatalogueMain() {
  const t = useTranslations("showroom"),
    state = useAdminShowroomCatalogue((s) => s.state);
  const [query, setQuery] = useState(""),
    [debounced, setDebounced] = useState(""),
    [filters, setFilters] = useState<SearchFilters>({}),
    [selected, setSelected] = useState<string | null>(null),
    [page, setPage] = useState(1),
    [compare, setCompare] = useState<string[]>([]),
    [comparing, setComparing] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(timer);
  }, [query]);
  const offers = useAdminShowroomCatalogueOffers();
  const results = useMemo(
    () => search(state, debounced, filters, offers.offers, offers.now),
    [state, debounced, filters, offers.offers, offers.now],
  );
  function groupDesigns(rows: SearchResult[]) {
    const grouped = new Map<string, SearchResult>();
    for (const row of rows) {
      const prior = grouped.get(row.productId);
      if (!prior || (!prior.available && row.available))
        grouped.set(row.productId, row);
    }
    return [...grouped.values()];
  }
  const designs = groupDesigns(results.exact);
  const alternatives = groupDesigns(results.alternatives);
  const pages = Math.max(1, Math.ceil(designs.length / 12)),
    currentPage = Math.min(page, pages);
  function card(r: SearchResult, alternative = false) {
    const p = state.products.find((p) => p.id === r.productId)!;
    const base = priceFor(
      state,
      state.variants.find((v) => v.id === r.variantId)!,
    );
    const deal = bestOffer(offers.offers, p.id, base, offers.now);
    const photo =
      state.images.find((i) => i.productId === p.id && i.kind === "actual") ??
      state.images.find((i) => i.productId === p.id);
    const matches = results.exact.filter((x) => x.productId === p.id);
    const colours = [
      ...new Set(
        matches.map(
          (x) => state.variants.find((v) => v.id === x.variantId)!.colour,
        ),
      ),
    ];
    return (
      <article
        key={r.productId}
        className="grid overflow-hidden rounded-xl border border-border bg-card"
      >
        <button
          onClick={() => setSelected(r.variantId)}
          className="group overflow-hidden rounded-xl border border-border bg-card text-left shadow-card motion-safe:transition-shadow hover:shadow-dialog"
          aria-label={`${t("view")} — ${p.name}`}
        >
          <div className="relative overflow-hidden bg-subtle">
            <Image
              src={photo?.srcOrAssetKey || "/images/shirt-0.svg"}
              width={360}
              height={360}
              alt={photo?.label ?? t("illustration")}
              className="aspect-square w-full object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = "/images/shirt-0.svg";
              }}
            />
            <span className="absolute left-3 top-3 rounded bg-card px-2 py-1 text-[10px] font-medium">
              {p.departmentId}
            </span>
            <span className="absolute bottom-3 right-3 rounded-full bg-card p-2">
              <ArrowUpRight size={16} />
            </span>
          </div>
          <div className="p-4">
            <p className="text-[10px] tracking-widest text-secondary">
              {p.designCode} · {p.fabric.toUpperCase()}
            </p>
            <h3 className="mt-2 text-base font-semibold">{p.name}</h3>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span>
                {deal && (
                  <del className="me-2 text-xs text-secondary">
                    {money(base)}
                  </del>
                )}
                <strong>{money(r.price)}</strong>
                {deal && (
                  <span className="block text-xs text-success">
                    {deal.offer.name}
                  </span>
                )}
              </span>
              <span className="text-xs text-secondary">
                {colours.length
                  ? colours.slice(0, 2).join(" / ")
                  : p.categoryId}
              </span>
            </div>
            <p
              className={`mt-3 text-xs ${r.available ? "text-success" : "text-danger"}`}
            >
              {r.available
                ? t("available", {
                    count:
                      matches.reduce((sum, x) => sum + x.available, 0) ||
                      r.available,
                  })
                : t("unavailable")}
            </p>
            {alternative && (
              <p className="mt-2 text-xs text-warning">
                {t("diff", { terms: r.missing.join(", ") })}
              </p>
            )}
            <p className="mt-2 text-[10px] text-secondary">
              {photo?.kind === "actual" ? t("actualImage") : t("illustration")}
            </p>
          </div>
        </button>
        <label className="flex min-h-11 items-center gap-2 px-4 py-3 text-sm">
          <input
            type="checkbox"
            checked={compare.includes(r.variantId)}
            disabled={!compare.includes(r.variantId) && compare.length >= 3}
            onChange={(e) =>
              setCompare(
                e.target.checked
                  ? [...compare, r.variantId]
                  : compare.filter((id) => id !== r.variantId),
              )
            }
          />
          {t("compare")} ·{" "}
          {state.variants.find((v) => v.id === r.variantId)?.colour} /{" "}
          {state.variants.find((v) => v.id === r.variantId)?.sizeCode}
        </label>
      </article>
    );
  }
  return (
    <>
      <div className="mb-7">
        <p className="text-[10px] font-semibold tracking-[.2em] text-secondary">
          {t("eyebrow")}
        </p>
        <Link
          href="/frontend_admin/admin_showroom/showroom_studio"
          className="underline"
        >
          {t("styleStudio")}
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-secondary">{t("subtitle")}</p>
      </div>
      {offers.failed && <p role="alert">{t("offerError")}</p>}
      <AdminShowroomCatalogueFilters
        query={query}
        setQuery={(q) => {
          setQuery(q);
          setPage(1);
        }}
        filters={filters}
        setFilters={(f) => {
          setFilters(f);
          setPage(1);
        }}
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            {debounced ? t("exact") : t("collection")}
          </h2>
          <p className="mt-1 text-xs text-secondary" aria-live="polite">
            {t("results", {
              designs: designs.length,
              variants: results.exact.length,
            })}
          </p>
        </div>
        <label className="flex items-center gap-2 text-secondary">
          {t("sort")}
          <select
            value={filters.sort || ""}
            onChange={(e) => {
              setFilters({ ...filters, sort: e.target.value });
              setPage(1);
            }}
          >
            <option value="">{t("relevance")}</option>
            <option value="recent">{t("recent")}</option>
            <option value="price-asc">{t("priceLow")}</option>
            <option value="price-desc">{t("priceHigh")}</option>
          </select>
        </label>
      </div>
      {designs.length ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {designs
            .slice((currentPage - 1) * 12, currentPage * 12)
            .map((r) => card(r))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <SearchX className="mx-auto text-secondary" />
          <h3 className="mt-4 text-lg font-semibold">{t("emptyTitle")}</h3>
          <p className="mt-2 text-secondary">{t("emptyBody")}</p>
        </div>
      )}
      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <Button
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            {t("previous")}
          </Button>
          <span className="text-xs">
            {t("page", { page: currentPage, pages })}
          </span>
          <Button
            disabled={currentPage === pages}
            onClick={() => setPage(currentPage + 1)}
          >
            {t("next")}
          </Button>
        </div>
      )}
      {!designs.length && alternatives.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">{t("similar")}</h2>
          <p className="mb-4 mt-2 text-secondary">{t("similarNote")}</p>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {alternatives.slice(0, 8).map((r) => card(r, true))}
          </div>
        </section>
      )}
      {compare.length > 0 && (
        <div className="sticky bottom-4 mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-dialog">
          <span>{t("compareCount", { count: compare.length })}</span>
          <Button
            disabled={compare.length < 2}
            onClick={() => setComparing(true)}
          >
            {t("compare")}
          </Button>
          <Button onClick={() => setCompare([])}>{t("clear")}</Button>
        </div>
      )}
      {comparing && (
        <AdminShowroomCatalogueCompare
          ids={compare}
          onClose={() => setComparing(false)}
          onView={(id) => {
            setComparing(false);
            setSelected(id);
          }}
        />
      )}
      {selected && (
        <AdminShowroomCatalogueDetail
          key={selected}
          variantId={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
