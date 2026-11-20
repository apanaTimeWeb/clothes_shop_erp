"use client";
import { useEffect } from "react";
import { LocaleProvider } from "@/components/ui/LocaleProvider";
import {
  useAdminWorkspaceNavigation,
  connectAdminWorkspaceNavigation,
} from "@/app/frontend_admin/admin_workspace/workspace_navigation/state/AdminWorkspaceNavigationStore";
import messages from "@/app/frontend_admin/admin_workspace/workspace_navigation/locales/admin_workspace_navigation_en.json";

export function AdminWorkspaceNavigationBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  const ready = useAdminWorkspaceNavigation((s) => s.ready);
  useEffect(() => connectAdminWorkspaceNavigation(), []);
  if (!ready)
    return (
      <div className="min-h-64 p-6" role="status">
        Loading local demo…
      </div>
    );
  return (
    <LocaleProvider messages={{ shell: messages }}>{children}</LocaleProvider>
  );
}
