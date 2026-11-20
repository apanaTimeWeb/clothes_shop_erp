import { t } from "@/app/frontend_admin/admin_management/management_import/utils/AdminManagementImportMessages";
import type { AdminManagementImportState } from "@/app/frontend_admin/admin_management/management_import/types/AdminManagementImportTypes";
import { demoSchema } from "@/app/frontend_admin/admin_management/management_import/schemas/AdminManagementImportSnapshotSchema";
export const headers = [
  "sku",
  "designCode",
  "name",
  "department",
  "category",
  "fabric",
  "sleeve",
  "collar",
  "fit",
  "pattern",
  "priceINR",
  "costINR",
  "colour",
  "size",
  "sizeSystem",
  "packUnit",
  "locationId",
  "quantity",
];
export function parseCsv(text: string) {
  if (text.length > 2000000) throw Error(t("upgrade25"));
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false,
    closed = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else cell += c;
      continue;
    }
    if (c === '"') {
      if (cell || closed) throw Error(t("upgrade26"));
      quoted = true;
      continue;
    }
    if (c === "," || c === "\n" || c === "\r") {
      row.push(cell.trim());
      cell = "";
      closed = false;
      if (c !== ",") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        if (row.some(Boolean)) rows.push(row);
        row = [];
      }
      continue;
    }
    if (closed && c.trim()) throw Error(t("upgrade27"));
    if (!closed) cell += c;
  }
  if (quoted) throw Error(t("upgrade28"));
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  if (rows.length < 2 || rows.length > 1001) throw Error(t("upgrade29"));
  if (rows[0].join(",") !== headers.join(",")) throw Error(t("upgrade30"));
  return rows.slice(1);
}
export function prepareImport(shop: AdminManagementImportState, text: string) {
  const rows = parseCsv(text),
    next = structuredClone(shop),
    errors: string[] = [];
  const fields = [
    "name",
    "departmentId",
    "categoryId",
    "fabric",
    "sleeve",
    "collar",
    "fit",
    "pattern",
  ] as const;
  for (const [index, row] of rows.entries()) {
    try {
      if (row.length !== headers.length || row.some((x) => !x || x.length > 120))
        throw Error(t("upgrade31"));
      const [
        sku,
        designCode,
        name,
        department,
        category,
        fabric,
        sleeve,
        collar,
        fit,
        pattern,
        price,
        cost,
        colour,
        size,
        sizeSystem,
        packUnit,
        locationId,
        quantity,
      ] = row;
      if (next.variants.some((v) => v.sku.toLowerCase() === sku.toLowerCase()))
        throw Error("Duplicate/existing SKU: " + sku);
      if (!next.departments.includes(department) || !next.categories.includes(category))
        throw Error(t("upgrade32"));
      if (!next.locations.some((l) => l.id === locationId && l.active)) throw Error(t("upgrade33"));
      if (
        !/^\d+(\.\d{1,2})?$/.test(price) ||
        !/^\d+(\.\d{1,2})?$/.test(cost) ||
        Number(price) > 1000000 ||
        Number(cost) > 1000000
      )
        throw Error(t("upgrade34"));
      if (!/^\d+$/.test(quantity) || Number(quantity) > 100000) throw Error(t("upgrade35"));
      const values = {
        name,
        departmentId: department,
        categoryId: category,
        fabric,
        sleeve,
        collar,
        fit,
        pattern,
      };
      let product = next.products.find(
        (p) => p.designCode.toLowerCase() === designCode.toLowerCase(),
      );
      if (
        product &&
        (product.status !== "active" ||
          fields.some((k) => product![k] !== values[k]) ||
          product.defaultPricePaise !== Math.round(Number(price) * 100) ||
          product.costPricePaise !== Math.round(Number(cost) * 100))
      )
        throw Error(t("upgrade36"));
      if (!product) {
        product = {
          id: crypto.randomUUID(),
          designCode,
          ...values,
          defaultPricePaise: Math.round(Number(price) * 100),
          costPricePaise: Math.round(Number(cost) * 100),
          description: "",
          status: "active",
          createdAt: new Date().toISOString(),
        };
        next.products.push(product);
      }
      if (
        next.variants.some(
          (v) =>
            v.productId === product!.id &&
            v.colour.toLowerCase() === colour.toLowerCase() &&
            v.sizeCode.toLowerCase() === size.toLowerCase(),
        )
      )
        throw Error(t("upgrade37"));
      const id = crypto.randomUUID(),
        qty = Number(quantity);
      next.variants.push({
        id,
        productId: product.id,
        sku,
        colour,
        sizeCode: size,
        sizeSystem,
        packUnit,
        status: "active",
      });
      next.inventoryBalances.push({ variantId: id, locationId, onHand: qty, nonSellable: 0 });
      if (qty)
        next.stockMovements.push({
          id: crypto.randomUUID(),
          variantId: id,
          locationId,
          qtyDelta: qty,
          reason: "csv-opening-stock",
          referenceId: id,
          at: new Date().toISOString(),
        });
    } catch (e) {
      errors.push("Row " + (index + 2) + ": " + (e instanceof Error ? e.message : t("upgrade38")));
    }
  }
  next.revision++;
  if (!errors.length) {
    const parsed = demoSchema.safeParse(next);
    if (!parsed.success)
      errors.push(
        ...parsed.error.issues.slice(0, 10).map((x) => x.path.join(".") + ": " + x.message),
      );
  }
  return { next, errors, count: rows.length };
}
export function template(shop: AdminManagementImportState) {
  const row = [
    "NEW-DEMO-BLACK-M",
    "NEW-DEMO",
    "Sample new design",
    shop.departments[0],
    shop.categories[0],
    "Cotton",
    "Full",
    "Collar",
    "Regular",
    "Solid",
    "999",
    "500",
    "Black",
    "M",
    "Alpha",
    "Piece",
    shop.locations.find((l) => l.active)?.id || "LOCATION-ID",
    "0",
  ];
  const csv = [headers, row]
    .map((r) => r.map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(","))
    .join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
    a = document.createElement("a");
  a.href = url;
  a.download = "catalogue-import-template.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
