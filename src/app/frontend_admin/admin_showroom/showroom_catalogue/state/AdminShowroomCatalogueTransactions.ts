import type { Offer } from "@/app/frontend_admin/admin_showroom/showroom_catalogue/schemas/AdminShowroomCatalogueInputSchema";
import {
  ensure,
  quantity,
  uid,
} from "@/app/frontend_admin/admin_showroom/showroom_catalogue/utils/AdminShowroomCatalogueAmounts";
import seed from "@/app/frontend_admin/admin_showroom/showroom_catalogue/mocks/AdminShowroomCatalogueFixture.json";
import type {
  AdminShowroomCatalogueState,
  Variant,
  AdminShowroomCatalogueAction,
  Payload,
  ActionType,
  SearchFilters,
  SearchResult,
} from "@/app/frontend_admin/admin_showroom/showroom_catalogue/types/AdminShowroomCatalogueTypes";
import { demoSchema } from "@/app/frontend_admin/admin_showroom/showroom_catalogue/schemas/AdminShowroomCatalogueSnapshotSchema";

export function createPresentationSeed(): AdminShowroomCatalogueState {
  return structuredClone(seed) as AdminShowroomCatalogueState;
}

export const productFor = (
  state: AdminShowroomCatalogueState,
  variant: Variant,
) => state.products.find((p) => p.id === variant.productId)!;

export const variantFor = (state: AdminShowroomCatalogueState, id: string) =>
  state.variants.find((v) => v.id === id)!;

export const priceFor = (
  state: AdminShowroomCatalogueState,
  variant: Variant,
) => variant.priceOverridePaise ?? productFor(state, variant).defaultPricePaise;

export const sellable = (
  state: AdminShowroomCatalogueState,
  variantId: string,
  locationId?: string,
) =>
  state.inventoryBalances
    .filter(
      (b) =>
        b.variantId === variantId &&
        (!locationId || b.locationId === locationId),
    )
    .reduce((sum, b) => sum + b.onHand - b.nonSellable, 0);

export const STORAGE_KEY = "clothes-shop.demo.next.v1";

export function transition(
  previous: AdminShowroomCatalogueState,
  action: AdminShowroomCatalogueAction,
  at = new Date().toISOString(),
): AdminShowroomCatalogueState {
  if (
    !(["session-new", "shortlist-add"] as readonly string[]).includes(
      action.type,
    )
  )
    throw new Error("This action does not belong to this capability.");
  const next =
    action.type === "reset"
      ? createPresentationSeed()
      : structuredClone(previous);
  const payload: Payload = {
    sessionId: "",
    variantId: "",
    locationId: "",
    pickId: "",
    billId: "",
    qty: "",
    quantities: [],
    discountPaise: 0,
    taxPercent: 0,
    payment: "Cash",
    ...action.data,
  };
  if (/^(session-|shortlist-|pick-|picks-)/.test(action.type))
    sessionAction(next, action.type, payload, at);
  next.revision = previous.revision + 1;
  return demoSchema.parse(next);
}

export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function allocate(
  state: AdminShowroomCatalogueState,
  variantId: string,
  input: unknown,
) {
  let qty = quantity(input);
  ensure(
    sellable(state, variantId) >= qty,
    "Not enough sellable stock. Refresh the selection.",
  );
  const result = [];
  for (const b of state.inventoryBalances.filter(
    (item) => item.variantId === variantId,
  )) {
    const take = Math.min(qty, b.onHand - b.nonSellable);
    if (take > 0) {
      result.push({ locationId: b.locationId, qty: take });
      qty -= take;
    }
    if (!qty) break;
  }
  return result;
}

export function sessionAction(
  state: AdminShowroomCatalogueState,
  type: ActionType,
  data: Payload,
  at: string,
) {
  if (type === "session-new") {
    const id = uid("session");
    state.sessions.push({
      id,
      name: `Guest ${String(state.sessions.length + 1).padStart(2, "0")}`,
      status: "open",
      at,
    });
    state.activeSessionId = id;
    return;
  }
  const session = state.sessions.find(
    (s) => s.id === (data.sessionId || state.activeSessionId),
  );
  ensure(
    session && session.status === "open",
    "Start or choose an open customer session first.",
  );
  if (type === "session-switch") {
    state.activeSessionId = session.id;
    return;
  }
  const items = state.pickItems.filter((p) => p.sessionId === session.id);
  if (type === "session-close") {
    ensure(
      !items.some((p) => ["retrieved", "return-pending"].includes(p.status)),
      "Return or sell every retrieved item before closing this session.",
    );
    ensure(
      !state.draftBills.some(
        (d) => d.sessionId === session.id && d.status === "draft",
      ),
      "Abandon or complete this session’s bill first.",
    );
    items
      .filter((p) => p.status === "awaiting")
      .forEach((p) => (p.status = "cancelled"));
    session.status = "closed";
    state.activeSessionId = null;
    return;
  }
  if (type === "shortlist-add") {
    const qty = quantity(data.qty);
    const v = variantFor(state, data.variantId);
    ensure(
      v &&
        v.status === "active" &&
        state.products.find((p) => p.id === v.productId)?.status === "active",
      "This SKU is unavailable.",
    );
    const existing = state.shortlistItems.find(
      (i) =>
        i.sessionId === session.id &&
        i.variantId === v.id &&
        i.status === "shortlisted",
    );
    ensure(
      sellable(state, v.id) >= qty + (existing?.qty || 0),
      "The shortlist exceeds current availability.",
    );
    if (existing) existing.qty += qty;
    else
      state.shortlistItems.push({
        id: uid("shortlist"),
        sessionId: session.id,
        variantId: v.id,
        qty,
        status: "shortlisted",
      });
    return;
  }
  if (type === "shortlist-update") {
    const line = state.shortlistItems.find(
      (i) =>
        i.sessionId === session.id &&
        i.variantId === data.variantId &&
        i.status === "shortlisted",
    );
    ensure(line, "Shortlist item not found.");
    if (data.qty === 0)
      state.shortlistItems = state.shortlistItems.filter((i) => i !== line);
    else {
      const qty = quantity(data.qty);
      ensure(
        sellable(state, line.variantId) >= qty,
        "Quantity exceeds availability.",
      );
      line.qty = qty;
    }
    return;
  }
  if (type === "shortlist-clear") {
    state.shortlistItems = state.shortlistItems.filter(
      (i) => i.sessionId !== session.id || i.status !== "shortlisted",
    );
    return;
  }
  if (type === "picks-generate") {
    const lines = state.shortlistItems.filter(
      (i) => i.sessionId === session.id && i.status === "shortlisted",
    );
    ensure(lines.length, "Add a SKU to the shortlist first.");
    for (const line of lines) {
      for (const allocation of allocate(state, line.variantId, line.qty))
        state.pickItems.push({
          id: uid("pick"),
          sessionId: session.id,
          variantId: line.variantId,
          ...allocation,
          status: "awaiting",
        });
      line.status = "planned";
    }
    return;
  }
  const pick = items.find((p) => p.id === data.pickId);
  ensure(pick, "Pick line not found in this session.");
  ensure(
    !state.draftBills.some(
      (d) => d.status === "draft" && d.lines.some((l) => l.pickId === pick.id),
    ),
    "This item is in a draft. Abandon the draft before changing its handling.",
  );
  if (type === "pick-source") {
    ensure(
      pick.status === "awaiting",
      "Source can change before retrieval only.",
    );
    ensure(
      state.locations.some((l) => l.id === data.locationId && l.active) &&
        sellable(state, pick.variantId, data.locationId) >= pick.qty,
      "Insufficient stock at that source.",
    );
    pick.locationId = data.locationId;
    return;
  }
  if (type === "pick-retrieve") {
    ensure(pick.status === "awaiting", "This pick has already been handled.");
    ensure(
      sellable(state, pick.variantId, pick.locationId) >= pick.qty,
      "Source stock changed. Choose another source.",
    );
    pick.status = "retrieved";
    pick.retrievedAt = at;
    return;
  }
  if (type === "pick-reject") {
    ensure(
      pick.status === "retrieved",
      "Retrieve the item before rejecting it.",
    );
    pick.status = "return-pending";
    state.returnToBoxTasks.push({
      id: uid("return-task"),
      pickId: pick.id,
      sessionId: session.id,
      locationId: pick.locationId,
      qty: pick.qty,
      status: "pending",
      at,
    });
    return;
  }
  if (type === "pick-return") {
    ensure(
      pick.status === "return-pending",
      "This return was already handled or is not pending.",
    );
    pick.status = "returned";
    state.returnToBoxTasks
      .filter((t) => t.pickId === pick.id && t.status === "pending")
      .forEach((t) => {
        t.status = "returned";
        t.returnedAt = at;
      });
    return;
  }
  if (type === "pick-missing") {
    ensure(
      pick.status === "awaiting",
      "Only awaiting items can be marked not found.",
    );
    pick.status = "not-found";
    return;
  }
  throw new Error("Unknown session action.");
}

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
  state: AdminShowroomCatalogueState,
  query = "",
  filters: SearchFilters = {},
  offers: Offer[] = [],
  now = 0,
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
    const base = priceFor(state, v);
    const price = base - (bestOffer(offers, p.id, base, now)?.discount || 0);
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

export function bestOffer(
  offers: Offer[],
  productId: string,
  price: number,
  now: number,
) {
  const active = offers.filter(
    (o) =>
      o.enabled &&
      o.productId === productId &&
      Date.parse(o.startsAt) <= now &&
      Date.parse(o.endsAt) >= now,
  );
  const discounts = active
    .map((offer) => ({
      offer,
      discount: Math.min(
        price,
        offer.kind === "percent"
          ? Math.round((price * offer.amount) / 100)
          : offer.amount,
      ),
    }))
    .sort(
      (a, b) => b.discount - a.discount || a.offer.id.localeCompare(b.offer.id),
    );
  return discounts.find((d) => d.discount > 0) || null;
}
