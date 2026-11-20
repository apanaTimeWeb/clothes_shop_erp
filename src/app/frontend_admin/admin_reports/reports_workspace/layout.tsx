"use client";
import { useEffect } from "react";
import { LocaleProvider } from "@/components/ui/LocaleProvider";
import {
  useAdminReportsWorkspace,
  connectAdminReportsWorkspace,
} from "@/app/frontend_admin/admin_reports/reports_workspace/state/AdminReportsWorkspaceStore";
import messages from "@/app/frontend_admin/admin_reports/reports_workspace/locales/admin_reports_workspace_en.json";

export default function AdminReportsWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ready = useAdminReportsWorkspace((s) => s.ready);
  useEffect(() => connectAdminReportsWorkspace(), []);
  if (!ready)
    return (
      <div className="min-h-64 p-6" role="status">
        Loading local demo…
      </div>
    );
  return (
    <LocaleProvider messages={{ reports: messages }}>{children}</LocaleProvider>
  );
}
