"use client";
import { t } from "@/app/frontend_admin/admin_management/management_backup/utils/AdminManagementBackupMessages";

import { AdminManagementBackupHealth } from "@/app/frontend_admin/admin_management/management_backup/components/AdminManagementBackupHealth";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Confirm } from "@/components/ui/Confirm";
import { useAdminManagementBackup } from "@/app/frontend_admin/admin_management/management_backup/hooks/useAdminManagementBackup";
import {
  capture,
  restore,
  resetAll,
  download,
  completeSchema,
  type Archive,
} from "@/app/frontend_admin/admin_management/management_backup/state/AdminManagementBackupArchive";
export function AdminManagementBackupMain() {
  const importGeneration = useRef(0);
  const { canEdit } = useAdminManagementBackup();
  const [pending, setPending] = useState<Archive | null>(null),
    [message, setMessage] = useState("");
  if (!canEdit) return <p>{t("message1")}</p>;
  function action(run: () => void) {
    try {
      run();
      setMessage(t("message2"));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : t("message3"));
    }
  }
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">{t("message4")}</h1>
      <AdminManagementBackupHealth />
      <p>{t("message5")}</p>
      <p>{t("message6")}</p>
      <Button onClick={() => action(() => download(capture()))}>{t("message7")}</Button>
      <label>
        {t("message8")}
        <input
          type="file"
          accept=".json,application/json"
          onChange={async (e) => {
            const ticket = ++importGeneration.current;
            const file = e.target.files?.[0];
            e.target.value = "";
            setPending(null);
            if (!file) return;
            try {
              if (file.size > 20000000) throw Error(t("message9"));
              const data = completeSchema.parse(JSON.parse(await file.text()));
              if (ticket !== importGeneration.current) return;
              setPending(data);
              setMessage(t("message10"));
            } catch (err) {
              if (ticket !== importGeneration.current) return;
              setMessage(err instanceof Error ? err.message : t("message11"));
            }
          }}
        />
      </label>
      {pending && (
        <section className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h2 className="text-xl font-semibold">{t("message12")}</h2>
          <p>
            {t("message13")}
            {new Date(pending.exportedAt).toLocaleString("en-IN")}
          </p>
          <ul>
            <li>
              {t("message14")}
              {pending.shop.products.length}
            </li>
            <li>
              {t("message15")}
              {pending.shop.sales.length}
            </li>
            <li>
              {t("message16")}
              {pending.offers.offers.length}
            </li>
            <li>
              {t("message17")}
              {Object.keys(pending.studio).length}
            </li>
            <li>
              {t("message18")}
              {pending.operations.suppliers.length}
            </li>
            <li>
              {t("message19")}
              {pending.operations.purchases.length}
            </li>
            <li>
              {t("message20")}
              {pending.operations.customers.length}
            </li>
            <li>
              {t("message21")}
              {pending.operations.redemptions.length}
            </li>
          </ul>
          <Confirm
            trigger={<Button>{t("message22")}</Button>}
            title={t("message23")}
            description={t("message24")}
            confirmLabel={t("message25")}
            cancelLabel={t("message26")}
            onConfirm={() =>
              action(() => {
                restore(pending);
                setPending(null);
                window.location.reload();
              })
            }
          />
          <Button onClick={() => setPending(null)}>{t("message27")}</Button>
        </section>
      )}
      <details>
        <summary>{t("message28")}</summary>
        <p>{t("message29")}</p>
        <Confirm
          trigger={<Button>{t("message30")}</Button>}
          title={t("message31")}
          description={t("message32")}
          confirmLabel={t("message33")}
          cancelLabel={t("message26")}
          onConfirm={() =>
            action(() => {
              resetAll();
              window.location.reload();
            })
          }
        />
      </details>
      <p role="status" className="whitespace-pre-wrap">
        {message}
      </p>
      <p>{t("message34")}</p>
    </div>
  );
}
