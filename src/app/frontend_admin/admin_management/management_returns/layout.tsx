"use client";
import { useEffect } from "react";
import { LocaleProvider } from "@/components/ui/LocaleProvider";
import {
  useAdminManagementReturns,
  connectAdminManagementReturns,
} from "@/app/frontend_admin/admin_management/management_returns/state/AdminManagementReturnsStore";
import messages from "@/app/frontend_admin/admin_management/management_returns/locales/admin_management_returns_en.json";

export default function AdminManagementReturnsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ready = useAdminManagementReturns((s) => s.ready);
  useEffect(() => connectAdminManagementReturns(), []);
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
