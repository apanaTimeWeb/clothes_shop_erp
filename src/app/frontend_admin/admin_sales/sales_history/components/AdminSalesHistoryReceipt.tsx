"use client";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Printer } from "lucide-react";
import type { Sale } from "@/app/frontend_admin/admin_sales/sales_history/types/AdminSalesHistoryCommerce";
import {
  money,
  dateTime,
} from "@/app/frontend_admin/admin_sales/sales_history/utils/AdminSalesHistoryAmounts";
import { Button } from "@/components/ui/Button";
export function AdminSalesHistoryReceipt({
  sale,
  onClose,
}: {
  sale: Sale;
  onClose: () => void;
}) {
  const t = useTranslations("sales");
  const receipt = (
    <>
      <h2 className="text-2xl font-semibold">{sale.shopName}</h2>
      <p className="my-3 font-bold">{t("receipt")}</p>
      <p>
        {sale.number} · {dateTime(sale.at)}
      </p>
      <table className="my-5 w-full text-left text-sm">
        <thead>
          <tr>
            {["item", "quantity", "rate", "amount"].map((key) => (
              <th key={key} className="p-2">
                {t(key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sale.lines.map((line, index) => (
            <tr
              key={`${line.pickId}-${index}`}
              className="border-t border-border"
            >
              <td className="p-2">
                {line.name}
                <br />
                {line.sku} · {line.colour} / {line.sizeCode}
                <br />
                <small>{line.packUnit}</small>
              </td>
              <td className="p-2">{line.qty}</td>
              <td className="p-2">{money(line.pricePaise)}</td>
              <td className="p-2">
                {money(
                  line.qty * line.pricePaise - (line.lineDiscountPaise ?? 0),
                )}
                <br />
                <small>
                  {t("lineDiscount")}: {money(line.lineDiscountPaise ?? 0)}
                </small>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="space-y-2 border-t border-border pt-4">
        <p>
          {t("subtotal")}: {money(sale.subtotalPaise)}
        </p>
        <p>
          {t("discount")}: −{money(sale.discountPaise)}
        </p>
        <p>
          {t("tax")} ({sale.taxPercent}%): {money(sale.taxPaise)}
        </p>
        <p className="text-lg font-bold">
          {t("total")}: {money(sale.totalPaise)}
        </p>
        <p>
          {t("payment")}: {sale.payment}
        </p>
      </div>
      {sale.receiptNote && <p className="mt-4 text-sm">{sale.receiptNote}</p>}
      <p className="mt-5 text-xs text-secondary">{t("note")}</p>
    </>
  );
  return (
    <>
      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <div className="mb-5 flex justify-end gap-2">
          <Button onClick={() => window.print()}>
            <Printer size={16} />
            {t("print")}
          </Button>
          <Button onClick={onClose}>{t("close")}</Button>
        </div>
        <div className="overflow-auto">{receipt}</div>
      </section>
      {createPortal(<div id="print-receipt">{receipt}</div>, document.body)}
    </>
  );
}
