"use client";
import { useEffect } from "react";
import { LocaleProvider } from "@/components/ui/LocaleProvider";
import {
  useAdminSettingsWorkspace,
  connectAdminSettingsWorkspace,
} from "@/app/frontend_admin/admin_settings/settings_workspace/state/AdminSettingsWorkspaceStore";
import messages from "@/app/frontend_admin/admin_settings/settings_workspace/locales/admin_settings_workspace_en.json";

export default function AdminSettingsWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ready = useAdminSettingsWorkspace((s) => s.ready);
  useEffect(() => connectAdminSettingsWorkspace(), []);
  if (!ready)
    return (
      <div className="min-h-64 p-6" role="status">
        Loading local demo…
      </div>
    );
  return (
    <LocaleProvider messages={{ settings: messages }}>
      {children}
    </LocaleProvider>
  );
}
