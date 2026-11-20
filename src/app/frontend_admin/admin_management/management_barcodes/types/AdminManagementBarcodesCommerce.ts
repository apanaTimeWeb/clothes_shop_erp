export interface BillLine {
  pickId: string;
  variantId: string;
  locationId: string;
  qty: number;
  pricePaise: number;
  lineDiscountPaise?: number;
}

export interface Draft {
  id: string;
  sessionId: string;
  status: "draft" | "completed" | "abandoned";
  at: string;
  discountPaise: number;
  taxPercent: number;
  payment: string;
  lines: BillLine[];
  saleId?: string;
  returnId?: string;
}

export interface Amounts {
  subtotalPaise: number;
  discountPaise: number;
  taxPercent: number;
  taxPaise: number;
  totalPaise: number;
}

export interface SaleLine extends BillLine {
  sku: string;
  name: string;
  colour: string;
  sizeCode: string;
  packUnit: string;
  costPaise: number;
  productId?: string;
  category?: string;
  department?: string;
}

export interface Sale extends Amounts {
  id: string;
  billId: string;
  sessionId: string;
  number: string;
  at: string;
  shopName: string;
  receiptNote?: string;
  payment: string;
  lines: SaleLine[];
  returnId?: string;
}

export interface Movement {
  id: string;
  variantId: string;
  qtyDelta: number;
  locationId: string;
  reason: string;
  referenceId: string;
  at: string;
}

export interface Payment {
  id: string;
  saleId: string;
  amountPaise: number;
  label: string;
  at: string;
}

export interface SaleReturn {
  id: string;
  saleId: string;
  lineIndex: number;
  qty: number;
  refundPaise: number;
  locationId: string;
  condition: "sellable" | "damaged";
  reason: string;
  at: string;
}

export type ReportGroup = "design" | "sku" | "category" | "size" | "colour";

export interface ReportRow {
  key: string;
  label: string;
  sold: number;
  returned: number;
  grossPaise: number;
  refundPaise: number;
  netPaise: number;
  profitPaise: number;
}

export interface Session {
  id: string;
  name: string;
  status: "open" | "closed";
  at: string;
}
export interface Shortlist {
  id: string;
  sessionId: string;
  variantId: string;
  qty: number;
  status: "shortlisted" | "planned";
}
export interface Pick {
  id: string;
  sessionId: string;
  variantId: string;
  locationId: string;
  qty: number;
  status:
    | "awaiting"
    | "retrieved"
    | "return-pending"
    | "returned"
    | "purchased"
    | "not-found"
    | "cancelled";
  retrievedAt?: string;
}
export interface ReturnTask {
  id: string;
  pickId: string;
  sessionId: string;
  locationId: string;
  qty: number;
  status: "pending" | "returned";
  at: string;
  returnedAt?: string;
}
