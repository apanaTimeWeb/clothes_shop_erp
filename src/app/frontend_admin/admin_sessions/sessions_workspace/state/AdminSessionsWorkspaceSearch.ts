import type {
  AdminSessionsWorkspaceState,
  SearchFilters,
  SearchResult,
} from "@/app/frontend_admin/admin_sessions/sessions_workspace/types/AdminSessionsWorkspaceTypes";
import {
  productFor,
  priceFor,
  sellable,
} from "@/app/frontend_admin/admin_sessions/sessions_workspace/state/AdminSessionsWorkspaceTransactions";
export function normalize(text: string) {
  return String(text)
    .toLowerCase()
    .replace(/t[ -]?shirts?|tees?\b/g, "tshirt")
    .replace(/telecot/g, "terrycot")
    .replace(/collar wala|collared|polo/g, "collar")
    .replace(/long[ -]sleeve/g, "full")
    .replace(/short[ -]sleeve/g, "half")
    .replace(/full[ -]sleeve/g, "full")
    .replace(/half[ -]sleeve/g, "half")
    .replace(/ladies|womens?\b/g, "women")
    .replace(/children/g, "kids")
    .replace(/grey/g, "gray")
    .replace(/crew|round neck/g, "round")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}
export function search(
  state: AdminSessionsWorkspaceState,
  query = "",
  filters: SearchFilters = {},
) {
  const terms = normalize(query)
    .split(" ")
    .filter(Boolean)
    .filter((t) => !["sleeve", "sleeves"].includes(t));
  const exact: SearchResult[] = [],
    alternatives: SearchResult[] = [];
  for (const v of state.variants) {
    const p = productFor(state, v);
    if (p.status !== "active" || v.status !== "active") continue;
    if (filters.department && p.departmentId !== filters.department) continue;
    if (filters.category && p.categoryId !== filters.category) continue;
    if (filters.colour && v.colour !== filters.colour) continue;
    if (filters.size && v.sizeCode !== filters.size) continue;
    if (filters.fabric && p.fabric !== filters.fabric) continue;
    if (filters.sleeve && p.sleeve !== filters.sleeve) continue;
    if (filters.collar && p.collar !== filters.collar) continue;
    if (filters.fit && p.fit !== filters.fit) continue;
    if (filters.packUnit && v.packUnit !== filters.packUnit) continue;
    if (filters.inStock && !sellable(state, v.id)) continue;
    const price = priceFor(state, v);
    if (filters.maxPrice && price > Number(filters.maxPrice) * 100) continue;
    const words = new Set(
      normalize(
        [
          p.name,
          p.departmentId,
          p.categoryId,
          p.fabric,
          p.sleeve,
          p.collar,
          p.fit,
          p.pattern,
          v.colour,
          v.sizeCode,
          ["Boys", "Girls", "Baby/Toddler"].includes(p.departmentId)
            ? "kids"
            : "",
        ].join(" "),
      ).split(" "),
    );
    const identifier = [v.sku, p.id, p.designCode].some(
      (id) => normalize(id) === normalize(query),
    );
    const missing = identifier
      ? []
      : terms.filter((t) =>
          /^\d+$/.test(t) ? t !== v.sizeCode.toLowerCase() : !words.has(t),
        );
    const entry = {
      variantId: v.id,
      productId: p.id,
      price,
      available: sellable(state, v.id),
      missing,
    };
    if (!missing.length) exact.push(entry);
    else if (
      terms.length > 1 &&
      missing.length < terms.length &&
      entry.available
    )
      alternatives.push(entry);
  }
  const sort = (a: SearchResult, b: SearchResult) =>
    filters.sort === "price-asc"
      ? a.price - b.price
      : filters.sort === "price-desc"
        ? b.price - a.price
        : filters.sort === "recent"
          ? (
              state.products.find((p) => p.id === b.productId)?.createdAt ?? ""
            ).localeCompare(
              state.products.find((p) => p.id === a.productId)?.createdAt ?? "",
            )
          : a.missing.length - b.missing.length;
  return {
    exact: exact.sort(sort),
    alternatives: alternatives.sort(sort).slice(0, 24),
  };
}
