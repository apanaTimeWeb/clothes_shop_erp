"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, SearchX, Sparkles } from "lucide-react";
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
import { resolveCatalogueProductImage } from "@/lib/product_images";
import {
  getTrialRack,
  addToTrialRack,
  removeFromTrialRack,
  convertProductToGarmentItem,
  type StoreGarmentItem,
} from "@/lib/trial_rack";

export function AdminShowroomCatalogueMain() {
  const t = useTranslations("showroom"), state = useAdminShowroomCatalogue((s) => s.state);
  const [query, setQuery] = useState(""), [debounced, setDebounced] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({}), [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState(1), [compare, setCompare] = useState<string[]>([]), [comparing, setComparing] = useState(false);
  const [trialItems, setTrialItems] = useState<StoreGarmentItem[]>(() => getTrialRack());

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleUpdate = () => setTrialItems(getTrialRack());
    window.addEventListener("trial-rack-changed", handleUpdate);
    return () => window.removeEventListener("trial-rack-changed", handleUpdate);
  }, []);

  const trialIds = useMemo(() => new Set(trialItems.map((x) => x.id)), [trialItems]);
  const offers = useAdminShowroomCatalogueOffers();
  const results = useMemo(
    () => search(state, debounced, filters, offers.offers, offers.now),
    [state, debounced, filters, offers.offers, offers.now],
  );

  function groupDesigns(rows: SearchResult[]) {
    const grouped = new Map<string, SearchResult>();
    for (const row of rows) {
      const prior = grouped.get(row.productId);
      if (!prior || (!prior.available && row.available)) grouped.set(row.productId, row);
    }
    return [...grouped.values()];
  }
  const designs = groupDesigns(results.exact);
  const alternatives = groupDesigns(results.alternatives);
  const pages = Math.max(1, Math.ceil(designs.length / 12)), currentPage = Math.min(page, pages);

  function handleToggleTrial(p: { id: string; name: string; categoryId: string }, col?: string) {
    if (trialIds.has(p.id)) removeFromTrialRack(p.id);
    else addToTrialRack(convertProductToGarmentItem(p, col));
  }

  function card(r: SearchResult, alternative = false) {
    const p = state.products.find((x) => x.id === r.productId)!;
    const base = priceFor(state, state.variants.find((v) => v.id === r.variantId)!);
    const deal = bestOffer(offers.offers, p.id, base, offers.now);
    const matches = results.exact.filter((x) => x.productId === p.id);
    const colours = [...new Set(matches.map((x) => state.variants.find((v) => v.id === x.variantId)!.colour))];
    const photo = resolveCatalogueProductImage(
      p.id, p.name, p.categoryId, colours[0],
      state.images.find((i) => i.productId === p.id)?.srcOrAssetKey
    );
    const isAdded = trialIds.has(p.id);

    return (
      <article key={r.productId} className="flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <button
          onClick={() => setSelected(r.variantId)}
          className="group text-left motion-safe:transition-shadow hover:shadow-dialog"
          aria-label={`${t("view")} — ${p.name}`}
        >
          <div className="relative overflow-hidden bg-subtle/80 flex items-center justify-center p-3">
            <Image
              src={photo}
              width={340}
              height={340}
              alt={p.name}
              className="aspect-square w-full object-contain motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-105"
              onError={(e) => { e.currentTarget.src = "/images/real-shirt-white.png"; }}
            />
            <span className="absolute left-2.5 top-2.5 rounded bg-card/90 px-2 py-0.5 text-[10px] font-semibold border border-border/80">
              {p.departmentId}
            </span>
            <span className="absolute bottom-2.5 right-2.5 rounded-full bg-card p-1.5 shadow-sm border border-border/80">
              <ArrowUpRight size={14} />
            </span>
          </div>
          <div className="p-4 space-y-1">
            <p className="text-[10px] tracking-widest text-secondary uppercase font-semibold">
              {p.designCode} · {p.fabric}
            </p>
            <h3 className="text-sm font-bold text-foreground truncate">{p.name}</h3>
            <div className="flex items-center justify-between gap-2 pt-1">
              <span>
                {deal && <del className="me-2 text-xs text-secondary">{money(base)}</del>}
                <strong className="text-sm text-foreground">{money(r.price)}</strong>
                {deal && <span className="block text-[11px] text-success">{deal.offer.name}</span>}
              </span>
              <span className="text-[11px] text-secondary">{colours.slice(0, 2).join(" / ") || p.categoryId}</span>
            </div>
            <p className={`text-[11px] pt-1 font-medium ${r.available ? "text-success" : "text-danger"}`}>
              {r.available ? t("available", { count: matches.reduce((s, x) => s + x.available, 0) || r.available }) : t("unavailable")}
            </p>
            {alternative && <p className="text-xs text-warning">{t("diff", { terms: r.missing.join(", ") })}</p>}
          </div>
        </button>

        {/* Action Controls: Add to Trial & Try In Studio */}
        <div className="border-t border-border p-2 flex flex-col gap-1.5 bg-subtle/30">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleToggleTrial(p, colours[0])}
              className={`flex-1 rounded-lg py-1.5 px-2 text-xs font-semibold transition-all flex items-center justify-center gap-1 shadow-sm ${
                isAdded
                  ? "bg-blue-600 text-white"
                  : "border border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              <span>🛍️</span>
              <span>{isAdded ? "✓ In Trial" : "+ Add to Trial"}</span>
            </button>
            <Link
              href={`/frontend_admin/admin_showroom/showroom_studio?product=${p.id}&colour=${encodeURIComponent(colours[0] || "Blue")}`}
              onClick={() => addToTrialRack(convertProductToGarmentItem(p, colours[0]))}
              className="rounded-lg border border-blue-500/30 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors flex items-center gap-1 shrink-0"
              title="Try On in Studio"
            >
              <Sparkles size={13} />
              <span>Try On</span>
            </Link>
          </div>
          <label className="flex items-center gap-2 pt-0.5 px-1 text-[11px] text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={compare.includes(r.variantId)}
              disabled={!compare.includes(r.variantId) && compare.length >= 3}
              onChange={(e) => setCompare(e.target.checked ? [...compare, r.variantId] : compare.filter((id) => id !== r.variantId))}
              className="rounded border-border accent-blue-600"
            />
            <span>{t("compare")} ({colours[0] || "Blue"})</span>
          </label>
        </div>
      </article>
    );
  }

  return (
    <>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-[10px] font-semibold tracking-[.2em] text-secondary uppercase">{t("eyebrow")}</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>
          <p className="mt-1 text-xs text-secondary">{t("subtitle")}</p>
        </div>
        <Link
          href="/frontend_admin/admin_showroom/showroom_studio"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all active:scale-95"
        >
          <span>🛍️ Trial Rack ({trialItems.length})</span>
          <span className="opacity-70">•</span>
          <span>Open Style Studio →</span>
        </Link>
      </div>

      {offers.failed && <p role="alert">{t("offerError")}</p>}
      <AdminShowroomCatalogueFilters
        query={query} setQuery={(q) => { setQuery(q); setPage(1); }}
        filters={filters} setFilters={(f) => { setFilters(f); setPage(1); }}
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{debounced ? t("exact") : t("collection")}</h2>
          <p className="mt-0.5 text-xs text-secondary" aria-live="polite">
            {t("results", { designs: designs.length, variants: results.exact.length })}
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-secondary">
          {t("sort")}
          <select
            value={filters.sort || ""}
            onChange={(e) => { setFilters({ ...filters, sort: e.target.value }); setPage(1); }}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
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
          {designs.slice((currentPage - 1) * 12, currentPage * 12).map((r) => card(r))}
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
          <Button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="min-h-9 px-3 text-xs">
            {t("previous")}
          </Button>
          <span className="text-xs">{t("page", { page: currentPage, pages })}</span>
          <Button disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)} className="min-h-9 px-3 text-xs">
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
          <span className="text-xs">{t("compareCount", { count: compare.length })}</span>
          <Button disabled={compare.length < 2} onClick={() => setComparing(true)} className="min-h-8 px-3 text-xs">
            {t("compare")}
          </Button>
          <Button onClick={() => setCompare([])} className="min-h-8 px-3 text-xs">{t("clear")}</Button>
        </div>
      )}

      {comparing && (
        <AdminShowroomCatalogueCompare
          ids={compare}
          onClose={() => setComparing(false)}
          onView={(id) => { setComparing(false); setSelected(id); }}
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
