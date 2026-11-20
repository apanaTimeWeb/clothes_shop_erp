"use client";
import { useTranslations } from "next-intl";
import { useAdminSettingsWorkspace } from "@/app/frontend_admin/admin_settings/settings_workspace/state/AdminSettingsWorkspaceStore";
import { AdminSettingsWorkspaceForm } from "@/app/frontend_admin/admin_settings/settings_workspace/components/AdminSettingsWorkspaceForm";
import { AdminSettingsWorkspaceBackup } from "@/app/frontend_admin/admin_settings/settings_workspace/components/AdminSettingsWorkspaceBackup";
export function AdminSettingsWorkspaceMain() {
  const t = useTranslations("settings"),
    mode = useAdminSettingsWorkspace((s) => s.mode),
    settings = useAdminSettingsWorkspace((s) => s.state.settings);
  return (
    <>
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
