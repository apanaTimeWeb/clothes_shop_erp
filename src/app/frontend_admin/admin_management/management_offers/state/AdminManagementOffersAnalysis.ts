import type {
  Catalogue,
  Offer,
} from "@/app/frontend_admin/admin_management/management_offers/schemas/AdminManagementOffersSchema";
export function offerStatus(o: Offer, now: number) {
  return !o.enabled
    ? "paused"
    : now < Date.parse(o.startsAt)
      ? "scheduled"
      : now > Date.parse(o.endsAt)
        ? "expired"
        : "active";
}
export function slowProducts(
  c: Catalogue,
  days: number,
  maxSold: number,
  minAge: number,
  now: number,
) {
  const since = now - days * 86400000;
  const units = new Map<string, number>(),
    last = new Map<string, number>();
  const map = new Map(c.variants.map((v) => [v.id, v.productId]));
  for (const sale of c.sales) {
    const at = Date.parse(sale.at);
    if (!Number.isFinite(at) || at > now) continue;
    for (const line of sale.lines) {
      const id = map.get(line.variantId);
      if (!id) continue;
      last.set(id, Math.max(last.get(id) || 0, at));
      if (at >= since) units.set(id, (units.get(id) || 0) + line.qty);
    }
  }
  const stock = new Map<string, number>();
  for (const balance of c.inventoryBalances) {
    const variant = c.variants.find(
      (v) => v.id === balance.variantId && v.status === "active",
    );
    if (variant)
      stock.set(
        variant.productId,
        (stock.get(variant.productId) || 0) +
          Math.max(0, balance.onHand - balance.nonSellable),
      );
  }
  return c.products
    .filter((p) => p.status === "active")
    .map((p) => ({
      product: p,
      sold: units.get(p.id) || 0,
      stock: stock.get(p.id) || 0,
      age: Math.max(0, Math.floor((now - Date.parse(p.createdAt)) / 86400000)),
      last: last.get(p.id),
    }))
    .filter((r) => r.stock > 0 && r.sold <= maxSold && r.age >= minAge)
    .sort((a, b) => a.sold - b.sold || b.stock - a.stock);
}
