import type { AdminManagementImagesState } from "@/app/frontend_admin/admin_management/management_images/types/AdminManagementImagesTypes";
import { totals } from "@/app/frontend_admin/admin_management/management_images/utils/AdminManagementImagesAmounts";
import { paidForLine } from "@/app/frontend_admin/admin_management/management_images/utils/AdminManagementImagesAmounts";
import { z } from "zod";
export function validateCommerce(
  s: AdminManagementImagesState,
  fail: (message: string) => void,
) {
  const validDate = (v: string) =>
    /^\d{4}-\d{2}-\d{2}T/.test(v) && Number.isFinite(Date.parse(v));
  const dated = [
    ...s.sessions,
    ...s.draftBills,
    ...s.sales,
    ...s.payments,
    ...s.saleReturns,
    ...s.stockMovements,
    ...s.returnToBoxTasks,
  ];
  if (
    dated.some((x) => !validDate(x.at)) ||
    s.products.some((p) => !validDate(p.createdAt))
  )
    fail("Dates must be valid ISO timestamps.");
  for (const key of [
    "shortlistItems",
    "returnToBoxTasks",
    "payments",
    "stockMovements",
  ] as const) {
    if (new Set(s[key].map((x) => x.id)).size !== s[key].length)
      fail(`Duplicate ${key} ID.`);
  }
  if (
    new Set(s.products.map((p) => p.designCode.toLowerCase())).size !==
    s.products.length
  )
    fail("Duplicate design code.");
  if (
    new Set(s.variants.map((v) => v.sku.toLowerCase())).size !==
    s.variants.length
  )
    fail("Duplicate SKU.");
  if (
    new Set(
      s.variants.map(
        (v) =>
          `${v.productId}|${v.colour.toLowerCase()}|${v.sizeCode.toLowerCase()}`,
      ),
    ).size !== s.variants.length
  )
    fail("Duplicate colour / size combination.");
  if (
    s.products.some(
      (p) =>
        !s.categories.includes(p.categoryId) ||
        !s.departments.includes(p.departmentId),
    )
  )
    fail("Design vocabulary reference is missing.");
  if (
    s.activeSessionId &&
    !s.sessions.some((x) => x.id === s.activeSessionId && x.status === "open")
  )
    fail("Active session must be open.");
  if (
    s.inventoryBalances.some(
      (b) =>
        b.onHand > 0 &&
        !s.locations.some((l) => l.id === b.locationId && l.active),
    )
  )
    fail("Nonempty boxes must be active.");
  if (
    s.stockMovements.some(
      (m) =>
        !s.variants.some((v) => v.id === m.variantId) ||
        !s.locations.some((l) => l.id === m.locationId),
    )
  )
    fail("Broken stock movement reference.");
  if (
    s.returnToBoxTasks.some(
      (t) =>
        !s.pickItems.some(
          (p) =>
            p.id === t.pickId &&
            p.sessionId === t.sessionId &&
            p.locationId === t.locationId,
        ),
    )
  )
    fail("Broken return-to-box task.");
  for (const b of s.draftBills) {
    try {
      totals(b.lines, b.discountPaise, b.taxPercent);
    } catch {
      fail(`Invalid amounts in bill ${b.id}.`);
    }
    if (
      b.status === "completed" &&
      !s.sales.some((x) => x.id === b.saleId && x.billId === b.id)
    )
      fail("Completed bill requires its sale.");
    if (
      b.status === "draft" &&
      b.lines.some(
        (l) =>
          !s.pickItems.some(
            (p) =>
              p.id === l.pickId &&
              p.sessionId === b.sessionId &&
              p.status === "retrieved" &&
              p.variantId === l.variantId &&
              p.locationId === l.locationId &&
              p.qty >= l.qty,
          ),
      )
    )
      fail("Draft must reference matching retrieved items.");
  }
  const activePicks = s.draftBills
    .filter((b) => b.status === "draft")
    .flatMap((b) => b.lines.map((l) => l.pickId));
  if (new Set(activePicks).size !== activePicks.length)
    fail("A retrieved item is duplicated in active drafts.");
  for (const sale of s.sales) {
    if (
      !s.draftBills.some(
        (b) =>
          b.id === sale.billId &&
          b.status === "completed" &&
          b.saleId === sale.id,
      ) ||
      !s.sessions.some((x) => x.id === sale.sessionId)
    )
      fail("Broken sale or bill relationship.");
    if (
      sale.lines.some(
        (l) =>
          !s.variants.some((v) => v.id === l.variantId) ||
          !s.locations.some((x) => x.id === l.locationId),
      )
    )
      fail("Broken sale line reference.");
    try {
      const expected = totals(sale.lines, sale.discountPaise, sale.taxPercent);
      if (
        Object.entries(expected).some(
          ([key, v]) => sale[key as keyof typeof expected] !== v,
        )
      )
        fail("Saved sale totals do not reconcile.");
    } catch {
      fail("Invalid sale amounts.");
    }
    const payments = s.payments.filter((p) => p.saleId === sale.id);
    if (payments.length !== 1 || payments[0]?.amountPaise !== sale.totalPaise)
      fail("Sale payment does not reconcile.");
    sale.lines.forEach((line, index) => {
      const returns = s.saleReturns.filter(
        (r) => r.saleId === sale.id && r.lineIndex === index,
      );
      let qty = 0;
      for (const r of returns) {
        const paid = paidForLine(sale, index);
        const expected =
          Math.round((paid * (qty + r.qty)) / line.qty) -
          Math.round((paid * qty) / line.qty);
        if (r.refundPaise !== expected)
          fail("Refund amount differs from original paid allocation.");
        qty += r.qty;
      }
    });
  }
  if (s.payments.some((p) => !s.sales.some((x) => x.id === p.saleId)))
    fail("Broken payment reference.");
  const replacements = s.draftBills
    .filter((b) => b.returnId && b.status !== "abandoned")
    .map((b) => b.returnId);
  if (new Set(replacements).size !== replacements.length)
    fail("Duplicate replacement bill.");
  if (
    s.images.some(
      (i) =>
        !/^\/images\/[a-z0-9-]+\.svg$/.test(i.srcOrAssetKey) &&
        !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(
          i.srcOrAssetKey,
        ),
    )
  )
    fail(
      "Images must be packaged placeholders or embedded JPEG/PNG/WebP data.",
    );
  if (s.images.reduce((n, i) => n + i.srcOrAssetKey.length, 0) > 2500000)
    fail("Image storage limit exceeded.");
}

export function validateReferences(
  s: AdminManagementImagesState,
  ctx: z.RefinementCtx,
) {
  const fail = (message: string) =>
    ctx.addIssue({ code: z.ZodIssueCode.custom, message });
  validateCommerce(s, fail);
  const unique = (values: string[]) => new Set(values).size === values.length;
  for (const values of [
    s.products.map((p) => p.id),
    s.variants.map((v) => v.id),
    s.variants.map((v) => v.sku),
    s.locations.map((l) => l.id),
    s.inventoryBalances.map((b) => `${b.variantId}|${b.locationId}`),
    s.sessions.map((x) => x.id),
    s.pickItems.map((x) => x.id),
    s.draftBills.map((x) => x.id),
    s.sales.map((x) => x.id),
    s.sales.map((x) => x.billId),
  ])
    if (!unique(values)) fail("Duplicate record identity.");
  const variants = new Set(s.variants.map((v) => v.id)),
    locations = new Set(s.locations.map((l) => l.id)),
    products = new Set(s.products.map((p) => p.id)),
    sessions = new Set(s.sessions.map((x) => x.id));
  if (
    s.variants.some((v) => !products.has(v.productId)) ||
    s.inventoryBalances.some(
      (b) => !variants.has(b.variantId) || !locations.has(b.locationId),
    )
  )
    fail("Broken inventory reference.");
  if (s.activeSessionId && !sessions.has(s.activeSessionId))
    fail("Broken active session.");
  if (
    [...s.shortlistItems, ...s.pickItems].some(
      (x) => !sessions.has(x.sessionId) || !variants.has(x.variantId),
    )
  )
    fail("Broken session item reference.");
  if (s.pickItems.some((x) => !locations.has(x.locationId)))
    fail("Broken pick location.");
  if (
    s.draftBills.some(
      (b) =>
        !sessions.has(b.sessionId) ||
        b.lines.some(
          (l) =>
            !variants.has(l.variantId) ||
            !locations.has(l.locationId) ||
            !s.pickItems.some((p) => p.id === l.pickId),
        ),
    )
  )
    fail("Broken draft reference.");

  if (s.images.some((i) => !products.has(i.productId)))
    fail("Broken image reference.");
  if (!unique(s.saleReturns.map((r) => r.id)))
    fail("Duplicate refund identity.");
  for (const r of s.saleReturns) {
    const sale = s.sales.find((x) => x.id === r.saleId),
      line = sale?.lines[r.lineIndex];
    if (!line || !locations.has(r.locationId)) {
      fail("Broken refund reference.");
      continue;
    }
    const returns = s.saleReturns.filter(
      (x) => x.saleId === r.saleId && x.lineIndex === r.lineIndex,
    );
    if (returns.reduce((n, x) => n + x.qty, 0) > line.qty)
      fail("Over-returned invoice line.");
  }
  if (
    [...s.sales, ...s.draftBills].some(
      (b) => b.returnId && !s.saleReturns.some((r) => r.id === b.returnId),
    )
  )
    fail("Broken replacement link.");
}
