"use client";
import { useEffect } from "react";
import { LocaleProvider } from "@/components/ui/LocaleProvider";
import {
  useAdminManagementCatalogue,
  connectAdminManagementCatalogue,
} from "@/app/frontend_admin/admin_management/management_catalogue/state/AdminManagementCatalogueStore";
import messages from "@/app/frontend_admin/admin_management/management_catalogue/locales/admin_management_catalogue_en.json";

export default function AdminManagementCatalogueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ready = useAdminManagementCatalogue((s) => s.ready),
    mode = useAdminManagementCatalogue((s) => s.mode);
  useEffect(() => connectAdminManagementCatalogue(), []);
  if (!ready)
    return (
      <div className="min-h-64 p-6" role="status">
        Loading local demo…
      </div>
    );
  return (
    <LocaleProvider messages={{ management: messages }}>
      {mode === "Admin" ? (
        children
      ) : (
        <p className="rounded-xl border border-border bg-card p-6">
          {messages.adminOnly}
        </p>
      )}
    </LocaleProvider>
  );
}
