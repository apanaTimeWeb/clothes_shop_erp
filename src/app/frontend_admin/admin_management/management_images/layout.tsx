"use client";
import { useEffect } from "react";
import { LocaleProvider } from "@/components/ui/LocaleProvider";
import {
  useAdminManagementImages,
  connectAdminManagementImages,
} from "@/app/frontend_admin/admin_management/management_images/state/AdminManagementImagesStore";
import messages from "@/app/frontend_admin/admin_management/management_images/locales/admin_management_images_en.json";

export default function AdminManagementImagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ready = useAdminManagementImages((s) => s.ready),
    mode = useAdminManagementImages((s) => s.mode);
  useEffect(() => connectAdminManagementImages(), []);
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
