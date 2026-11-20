"use client";
import { t } from "@/app/frontend_admin/admin_management/management_backup/utils/AdminManagementBackupMessages";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { readDocument, subscribeDocument } from "@/lib/browser_document";
import {
  capture,
  keys,
} from "@/app/frontend_admin/admin_management/management_backup/state/AdminManagementBackupArchive";
export function AdminManagementBackupHealth() {
  const [status, setStatus] = useState("Checking saved data…"),
    [backup, setBackup] = useState(""),
    [size, setSize] = useState(0);
  function refresh() {
    try {
      capture();
      setStatus(t("upgrade1"));
    } catch (e) {
      setStatus("Data needs attention: " + (e instanceof Error ? e.message : t("upgrade2")));
    }
    try {
      const raw = readDocument("clothes-shop.backup-status.v1"),
        at = raw ? JSON.parse(raw).requestedAt : null,
        ms = Date.parse(at || "");
      setBackup(
        Number.isFinite(ms)
          ? "Last backup export requested: " +
              new Date(ms).toLocaleString("en-IN") +
              (Date.now() - ms > 7 * 86400000 ? t("upgrade3") : t("upgrade4"))
          : t("upgrade5"),
      );
      setSize(Object.values(keys).reduce((n, k) => n + (readDocument(k)?.length || 0) * 2, 0));
    } catch {
      setBackup(t("upgrade6"));
    }
  }
  useEffect(() => {
    const initial = setTimeout(refresh, 0);
    const off = [...Object.values(keys), "clothes-shop.backup-status.v1"].map((k) =>
      subscribeDocument(k, refresh, refresh),
    );
    const timer = setInterval(refresh, 60000);
    return () => {
      off.forEach((f) => f());
      clearInterval(timer);
      clearTimeout(initial);
    };
  }, []);
  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h2 className="text-xl font-semibold">{t("upgrade7")}</h2>
      <p role="status" className="whitespace-pre-wrap">
        {status}
      </p>
      <p>{backup}</p>
      <p>
        {t("upgrade8")}
        {(size / 1024 / 1024).toFixed(2)}
        {t("upgrade9")}
      </p>
      <p>{t("upgrade10")}</p>
      <Button onClick={refresh}>{t("upgrade11")}</Button>
    </section>
  );
}
