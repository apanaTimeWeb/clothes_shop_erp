"use client";
import { useEffect } from "react";
import { LocaleProvider } from "@/components/ui/LocaleProvider";
import {
  useAdminManagementIntake,
  connectAdminManagementIntake,
} from "@/app/frontend_admin/admin_management/management_intake/state/AdminManagementIntakeStore";
import messages from "@/app/frontend_admin/admin_management/management_intake/locales/admin_management_intake_en.json";

export default function AdminManagementIntakeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ready = useAdminManagementIntake((s) => s.ready),
    mode = useAdminManagementIntake((s) => s.mode);
  useEffect(() => connectAdminManagementIntake(), []);
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
