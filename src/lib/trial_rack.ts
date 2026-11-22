import {
  STORE_CATALOG_ITEMS,
  type StoreGarmentItem,
} from "@/app/frontend_admin/admin_showroom/showroom_studio/utils/AdminShowroomStudioPhoto";

export { type StoreGarmentItem };

const STORAGE_KEY = "clothes-shop.trial-rack";

export function getDefaultTrialRack(): StoreGarmentItem[] {
  return [
    STORE_CATALOG_ITEMS[0], // Cotton Crewneck T-Shirt
    STORE_CATALOG_ITEMS[1], // Heavyweight White Tee
    STORE_CATALOG_ITEMS[4], // Casual Linen Shirt
    STORE_CATALOG_ITEMS[8], // 90s Vintage Baggy Jeans
    STORE_CATALOG_ITEMS[9], // Straight Denim Jeans
  ];
}

export function getTrialRack(): StoreGarmentItem[] {
  if (typeof window === "undefined") return getDefaultTrialRack();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const def = getDefaultTrialRack();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(def));
    return def;
  } catch {
    return getDefaultTrialRack();
  }
}

export function saveTrialRack(items: StoreGarmentItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("trial-rack-changed"));
  } catch {}
}

export function addToTrialRack(item: StoreGarmentItem): void {
  const current = getTrialRack();
  if (!current.some((x) => x.id === item.id)) {
    saveTrialRack([...current, item]);
  }
}

export function removeFromTrialRack(id: string): void {
  const current = getTrialRack();
  saveTrialRack(current.filter((x) => x.id !== id));
}

export function isInTrialRack(id: string): boolean {
  return getTrialRack().some((x) => x.id === id);
}

export function convertProductToGarmentItem(
  product: { id: string; name: string; categoryId?: string },
  colour?: string
): StoreGarmentItem {
  const catLower = (product.categoryId || "").toLowerCase();
  const nameLower = product.name.toLowerCase();
  const isBottom =
    catLower.includes("jean") ||
    catLower.includes("pant") ||
    catLower.includes("trouser") ||
    catLower.includes("short") ||
    catLower.includes("cargo") ||
    nameLower.includes("jean") ||
    nameLower.includes("pant") ||
    nameLower.includes("chinos") ||
    nameLower.includes("denim");

  const style =
    catLower.includes("short") || nameLower.includes("short")
      ? "shorts"
      : catLower.includes("cargo") || nameLower.includes("cargo")
        ? "cargo"
        : catLower.includes("jean") || nameLower.includes("denim")
          ? "jeans"
          : catLower.includes("trouser") || catLower.includes("pant")
            ? "trouser"
            : catLower.includes("polo") || nameLower.includes("polo")
              ? "polo"
              : catLower.includes("t-shirt") ||
                  catLower.includes("tshirt") ||
                  nameLower.includes("tee")
                ? "tshirt"
                : "shirt";

  const defaultCol = colour || (isBottom ? "Blue" : "Black");
  return {
    id: product.id,
    name: product.name,
    category: isBottom ? "bottom" : "top",
    style,
    defaultColour: defaultCol,
    colours: [defaultCol, "Black", "Navy", "Blue", "Charcoal", "Olive", "Grey"],
  };
}
