"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAdminSettingsWorkspace } from "@/app/frontend_admin/admin_settings/settings_workspace/state/AdminSettingsWorkspaceStore";
import { ROUTES } from "@/lib/routes";
import { AdminSettingsWorkspaceForm } from "@/app/frontend_admin/admin_settings/settings_workspace/components/AdminSettingsWorkspaceForm";
import { AdminSettingsWorkspaceBackup } from "@/app/frontend_admin/admin_settings/settings_workspace/components/AdminSettingsWorkspaceBackup";
export function AdminSettingsWorkspaceMain() {
  const t = useTranslations("settings"),
    mode = useAdminSettingsWorkspace((s) => s.mode),
    settings = useAdminSettingsWorkspace((s) => s.state.settings);
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-xs text-secondary">
        <Link href={ROUTES.overview} className="hover:underline">Overview</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Store Settings</span>
      </nav>
      <h1 className="text-3xl font-semibold">{t("title")}</h1>
      <p className="my-3 text-secondary">{t("subtitle")}</p>
      {mode !== "Admin" ? (
        <p className="rounded-xl bg-card p-6">{t("adminOnly")}</p>
      ) : (
        <div className="space-y-6">
          <AdminSettingsWorkspaceForm key={JSON.stringify(settings)} />
          <AdminSettingsWorkspaceBackup />
        </div>
      )}
    </>
  );
}
