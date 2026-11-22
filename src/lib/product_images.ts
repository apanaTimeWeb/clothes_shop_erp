/**
 * Central image resolver for digital showroom catalogue.
 * Automatically resolves real photo cutouts for clothes products.
 */
export function resolveCatalogueProductImage(
  productId: string,
  name?: string,
  category?: string,
  colour?: string,
  fallbackSrc?: string
): string {
  const n = (name || "").toLowerCase();
  const c = (category || "").toLowerCase();
  const col = (colour || "").toLowerCase();

  // Polos
  if (n.includes("polo")) return "/images/real-polo-navy.png";

  // Shirts
  if (n.includes("linen") || n.includes("summer linen")) return "/images/real-shirt-blue.png";
  if (
    n.includes("formal shirt") ||
    n.includes("oxford") ||
    n.includes("weekday formal") ||
    n.includes("weekend oxford")
  ) {
    return "/images/real-shirt-white.png";
  }
  if (n.includes("city terrycot") || n.includes("camp collar") || n.includes("resort")) {
    return "/images/real-shirt-black.png";
  }
  if (n.includes("adventure shirt") || n.includes("flannel") || n.includes("plaid")) {
    return "/images/real-shirt-flannel.png";
  }
  if (c.includes("shirt")) {
    if (col.includes("black") || col.includes("dark") || col.includes("charcoal")) {
      return "/images/real-shirt-black.png";
    }
    if (col.includes("blue") || col.includes("navy")) return "/images/real-shirt-blue.png";
    if (col.includes("red")) return "/images/real-shirt-flannel.png";
    return "/images/real-shirt-white.png";
  }

  // T-Shirts / Tees
  if (n.includes("crew tee") || n.includes("cotton crew") || n.includes("essential crew")) {
    return col.includes("white") || col.includes("cream")
      ? "/images/real-tshirt-white.png"
      : "/images/real-tshirt-black.png";
  }
  if (
    n.includes("classic v tee") ||
    n.includes("oversized") ||
    n.includes("graphic") ||
    n.includes("lounge tee")
  ) {
    return "/images/real-tshirt-oversized.png";
  }
  if (c.includes("t-shirt") || c.includes("tshirt") || c.includes("tee")) {
    if (col.includes("white") || col.includes("cream")) return "/images/real-tshirt-white.png";
    if (col.includes("navy") || col.includes("blue")) return "/images/real-polo-navy.png";
    return "/images/real-tshirt-black.png";
  }

  // Jeans
  if (n.includes("straight denim")) return "/images/real-jeans-blue.png";
  if (n.includes("daily stretch denim") || n.includes("baggy") || n.includes("vintage")) {
    return "/images/real-baggy-jeans.png";
  }
  if (
    n.includes("junior denim") ||
    (c.includes("jean") && (col.includes("black") || col.includes("charcoal")))
  ) {
    return "/images/real-jeans-black.png";
  }
  if (c.includes("jean")) return "/images/real-jeans-blue.png";

  // Pants / Chinos / Cargo / Joggers / Trousers / Shorts
  if (n.includes("cargo") || n.includes("urban cargo") || n.includes("jogger")) {
    return "/images/real-joggers-olive.png";
  }
  if (n.includes("chinos") || n.includes("relaxed chinos")) {
    return "/images/real-chinos-beige.png";
  }
  if (
    n.includes("studio trousers") ||
    n.includes("trouser") ||
    n.includes("fleece") ||
    n.includes("sweat")
  ) {
    return "/images/real-joggers-grey.png";
  }
  if (n.includes("short") || n.includes("half")) {
    return "/images/real-shorts-khaki.png";
  }
  if (c.includes("pant") || c.includes("trouser")) {
    return "/images/real-chinos-beige.png";
  }

  // Winterwear / Pullovers / Cardigans
  if (c.includes("winter") || n.includes("pullover") || n.includes("knit") || n.includes("cardigan") || n.includes("warm")) {
    return col.includes("black") || col.includes("dark") ? "/images/real-shirt-black.png" : "/images/real-tshirt-oversized.png";
  }

  // Kids Sets / Rompers / Coordinated Sets
  if (c.includes("set") || n.includes("set") || n.includes("romper")) {
    return col.includes("navy") || col.includes("blue") ? "/images/real-polo-navy.png" : "/images/real-shirt-white.png";
  }

  // Ethnic / Kurta / Kurti
  if (n.includes("kurta") || n.includes("kurti") || c.includes("kurta") || c.includes("kurti")) {
    if (col.includes("blue") || col.includes("navy")) return "/images/real-shirt-blue.png";
    if (col.includes("red") || col.includes("maroon")) return "/images/real-shirt-flannel.png";
    return "/images/real-shirt-white.png";
  }

  // Fallbacks: if fallbackSrc exists and is not an svg placeholder, use it
  if (fallbackSrc && !fallbackSrc.endsWith(".svg")) {
    return fallbackSrc;
  }

  // Specific dresses or accessories fallbacks
  if (
    n.includes("dress") ||
    n.includes("saree") ||
    c.includes("sock") ||
    c.includes("belt") ||
    c.includes("cap")
  ) {
    return fallbackSrc || "/images/shirt-0.svg";
  }

  return "/images/real-shirt-white.png";
}
