"use client";
import { useEffect } from "react";
import { LocaleProvider } from "@/components/ui/LocaleProvider";
import {
  useAdminDashboardOverview,
  connectAdminDashboardOverview,
} from "@/app/frontend_admin/admin_dashboard/dashboard_overview/state/AdminDashboardOverviewStore";
import messages from "@/app/frontend_admin/admin_dashboard/dashboard_overview/locales/admin_dashboard_overview_en.json";

export default function AdminDashboardOverviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ready = useAdminDashboardOverview((s) => s.ready);
  useEffect(() => connectAdminDashboardOverview(), []);
  if (!ready)
    return (
      <div className="min-h-64 p-6" role="status">
        Loading local demo…
      </div>
    );
  return (
    <LocaleProvider messages={{ dashboard: messages }}>
      {children}
    </LocaleProvider>
  );
}
