import type {
  Session,
  Shortlist,
  Pick,
  ReturnTask,
} from "@/app/frontend_admin/admin_management/management_import/types/AdminManagementImportCommerce";
import type {
  Draft,
  Sale,
  Movement,
  Payment,
} from "@/app/frontend_admin/admin_management/management_import/types/AdminManagementImportCommerce";
import type { SaleReturn } from "@/app/frontend_admin/admin_management/management_import/types/AdminManagementImportCommerce";
export interface Product {
  id: string;
  designCode: string;
  name: string;
  departmentId: string;
  categoryId: string;
  fabric: string;
  sleeve: string;
  collar: string;
  fit: string;
  pattern: string;
  status: "active" | "archived";
  defaultPricePaise: number;
  costPricePaise: number;
  description: string;
  createdAt: string;
}

export interface Variant {
  id: string;
  productId: string;
  sku: string;
  colour: string;
  sizeCode: string;
  sizeSystem: string;
  packUnit: string;
  status: "active" | "archived";
  priceOverridePaise?: number;
}

export interface Location {
  id: string;
  rack: string;
  shelf: string;
  box: string;
  active: boolean;
}

export interface Balance {
  variantId: string;
  locationId: string;
  onHand: number;
  nonSellable: number;
}

export interface ProductImage {
  productId: string;
  angle: string;
  colour?: string;
  kind: "placeholder" | "actual" | "representative";
  srcOrAssetKey: string;
  label: string;
}

export interface AdminManagementImportState {
  schemaVersion: number;
  revision: number;
  products: Product[];
  variants: Variant[];
  inventoryBalances: Balance[];
  images: ProductImage[];
  locations: Location[];
  departments: string[];
  categories: string[];
  sessions: Session[];
  shortlistItems: Shortlist[];
  pickItems: Pick[];
  returnToBoxTasks: ReturnTask[];
  draftBills: Draft[];
  sales: Sale[];
  payments: Payment[];
  saleReturns: SaleReturn[];
  stockMovements: Movement[];
  settings: {
    shopName: string;
    taxPercent: number;
    lowStockThreshold: number;
    timeZone: string;
    receiptNote?: string;
    sizeVocabulary?: string[];
    fabricVocabulary?: string[];
  };
  activeSessionId: string | null;
}

export interface Payload {
  sessionId: string;
  variantId: string;
  locationId: string;
  pickId: string;
  billId: string;
  qty: unknown;
  quantities: unknown[];
  discountPaise: number;
  taxPercent: number;
  payment: string;
  operation?: unknown;
  lineDiscounts?: number[];
}

export type ActionType =
  | "session-new"
  | "session-switch"
  | "session-close"
  | "shortlist-add"
  | "shortlist-update"
  | "shortlist-clear"
  | "picks-generate"
  | "pick-source"
  | "pick-retrieve"
  | "pick-reject"
  | "pick-return"
  | "pick-missing"
  | "bill-create"
  | "bill-abandon"
  | "bill-remove"
  | "bill-save"
  | "bill-complete"
  | "restock"
  | "manage-product"
  | "manage-intake"
  | "manage-variant"
  | "manage-images"
  | "manage-archive"
  | "manage-location"
  | "manage-stock"
  | "manage-image"
  | "manage-vocabulary"
  | "manage-return"
  | "manage-pos"
  | "settings-save"
  | "demo-import"
  | "opening-stock"
  | "reset";

export interface AdminManagementImportAction {
  type: ActionType;
  data?: Partial<Payload>;
}

export interface SearchFilters {
  department?: string;
  category?: string;
  colour?: string;
  size?: string;
  fabric?: string;
  sleeve?: string;
  collar?: string;
  fit?: string;
  packUnit?: string;
  inStock?: boolean;
  maxPrice?: string;
  sort?: string;
}

export interface SearchResult {
  variantId: string;
  productId: string;
  price: number;
  available: number;
  missing: string[];
}

export type AdminManagementImportMode = "Staff" | "Customer" | "Admin";
