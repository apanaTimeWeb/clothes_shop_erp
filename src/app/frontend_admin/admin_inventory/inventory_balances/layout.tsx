"use client";
import { useEffect } from "react";
import { LocaleProvider } from "@/components/ui/LocaleProvider";
import {
  useAdminInventoryBalances,
  connectAdminInventoryBalances,
} from "@/app/frontend_admin/admin_inventory/inventory_balances/state/AdminInventoryBalancesStore";
import messages from "@/app/frontend_admin/admin_inventory/inventory_balances/locales/admin_inventory_balances_en.json";

export default function AdminInventoryBalancesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ready = useAdminInventoryBalances((s) => s.ready);
  useEffect(() => connectAdminInventoryBalances(), []);
  if (!ready)
    return (
      <div className="min-h-64 p-6" role="status">
        Loading local demo…
      </div>
    );
  return (
    <LocaleProvider messages={{ inventory: messages }}>
      {children}
    </LocaleProvider>
  );
}
