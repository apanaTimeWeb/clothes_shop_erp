"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminSettingsWorkspace } from "@/app/frontend_admin/admin_settings/settings_workspace/state/AdminSettingsWorkspaceStore";
import {
  exportDemo,
  parseDemoImport,
  MAX_IMPORT_BYTES,
} from "@/app/frontend_admin/admin_settings/settings_workspace/state/AdminSettingsWorkspaceTransactions";
import type { AdminSettingsWorkspaceState } from "@/app/frontend_admin/admin_settings/settings_workspace/types/AdminSettingsWorkspaceTypes";
import { downloadText } from "@/app/frontend_admin/admin_settings/settings_workspace/utils/AdminSettingsWorkspaceDownload";
import { Button } from "@/components/ui/Button";
import { Confirm } from "@/components/ui/Confirm";
export function AdminSettingsWorkspaceBackup() {
  const t = useTranslations("settings"),
    { state, dispatch, stale, notify } = useAdminSettingsWorkspace(),
    [raw, setRaw] = useState(""),
    [preview, setPreview] = useState<AdminSettingsWorkspaceState | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <section className="space-y-5 rounded-xl border border-border bg-card p-6">
      <h2 className="text-xl font-semibold">{t("data")}</h2>
      <p className="text-sm text-secondary">{t("policy")}</p>
      <Button
        onClick={() => {
          downloadText(
            "clothes-shop-demo.json",
            exportDemo(state),
            "application/json",
          );
          notify(t("downloaded"));
        }}
      >
        {t("export")}
      </Button>
      <label className="grid gap-2">
        {t("import")}
        <input
          type="file"
          accept=".json,application/json"
          disabled={busy || stale}
          onChange={async (e) => {
            setPreview(null);
            setError("");
            setRaw("");
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            try {
              if (file.size > MAX_IMPORT_BYTES)
                throw new Error("Import exceeds 5 MB.");
              const text = await file.text();
              const next = parseDemoImport(text);
              setRaw(text);
              setPreview(next);
            } catch (err) {
              setError(err instanceof Error ? err.message : t("invalid"));
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {busy && <p role="status">{t("reading")}</p>}
      {error && (
        <div role="alert" className="rounded bg-warning-bg p-4 text-warning">
          <p>{t("invalid")}</p>
          <pre className="mt-2 whitespace-pre-wrap break-words text-sm">
            {error}
          </pre>
        </div>
      )}
      {preview && (
        <div className="space-y-4 rounded-lg bg-subtle p-4">
          <h3 className="font-semibold">{t("preview")}</h3>
          <p>{preview.settings.shopName}</p>
          <p>
            {t("products")}: {preview.products.length} · {t("variants")}:{" "}
            {preview.variants.length} · {t("sales")}: {preview.sales.length} ·{" "}
            {t("drafts")}:{" "}
            {preview.draftBills.filter((b) => b.status === "draft").length} ·{" "}
            {t("refunds")}: {preview.saleReturns.length}
          </p>
          <Confirm
            trigger={<Button disabled={stale}>{t("replace")}</Button>}
            title={t("confirmTitle")}
            description={t("confirmBody")}
            confirmLabel={t("replace")}
            cancelLabel={t("cancel")}
            onConfirm={() => {
              if (dispatch({ type: "demo-import", data: { operation: raw } })) {
                setRaw("");
                setPreview(null);
              }
            }}
          />
        </div>
      )}
      <Confirm
        trigger={<Button disabled={stale}>{t("reset")}</Button>}
        title={t("resetTitle")}
        description={t("resetBody")}
        confirmLabel={t("reset")}
        cancelLabel={t("cancel")}
        onConfirm={() => {
          if (dispatch({ type: "reset" })) {
            setRaw("");
            setPreview(null);
          }
        }}
      />
      <p className="text-xs text-secondary">{t("future")}</p>
    </section>
  );
}
