"use client";
import { useEffect } from "react";
import { LocaleProvider } from "@/components/ui/LocaleProvider";
import {
  useAdminSalesHistory,
  connectAdminSalesHistory,
} from "@/app/frontend_admin/admin_sales/sales_history/state/AdminSalesHistoryStore";
import messages from "@/app/frontend_admin/admin_sales/sales_history/locales/admin_sales_history_en.json";

export default function AdminSalesHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ready = useAdminSalesHistory((s) => s.ready);
  useEffect(() => connectAdminSalesHistory(), []);
  if (!ready)
    return (
      <div className="min-h-64 p-6" role="status">
        Loading local demo…
      </div>
    );
  return (
    <LocaleProvider messages={{ sales: messages }}>{children}</LocaleProvider>
  );
}
