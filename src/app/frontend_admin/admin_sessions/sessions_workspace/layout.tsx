"use client";
import { useEffect } from "react";
import { LocaleProvider } from "@/components/ui/LocaleProvider";
import {
  useAdminSessionsWorkspace,
  connectAdminSessionsWorkspace,
} from "@/app/frontend_admin/admin_sessions/sessions_workspace/state/AdminSessionsWorkspaceStore";
import messages from "@/app/frontend_admin/admin_sessions/sessions_workspace/locales/admin_sessions_workspace_en.json";

export default function AdminSessionsWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ready = useAdminSessionsWorkspace((s) => s.ready);
  useEffect(() => connectAdminSessionsWorkspace(), []);
  if (!ready)
    return (
      <div className="min-h-64 p-6" role="status">
        Loading local demo…
      </div>
    );
  return (
    <LocaleProvider messages={{ sessions: messages }}>
      {children}
    </LocaleProvider>
  );
}
