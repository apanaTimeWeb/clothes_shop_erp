"use client";
import { useEffect } from "react";
import { LocaleProvider } from "@/components/ui/LocaleProvider";
import {
  useAdminManagementStock,
  connectAdminManagementStock,
} from "@/app/frontend_admin/admin_management/management_stock/state/AdminManagementStockStore";
import messages from "@/app/frontend_admin/admin_management/management_stock/locales/admin_management_stock_en.json";

export default function AdminManagementStockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ready = useAdminManagementStock((s) => s.ready);
  useEffect(() => connectAdminManagementStock(), []);
  if (!ready)
    return (
      <div className="min-h-64 p-6" role="status">
        Loading local demo…
      </div>
    );
  return (
    <LocaleProvider messages={{ management: messages }}>
      {children}
    </LocaleProvider>
  );
}
