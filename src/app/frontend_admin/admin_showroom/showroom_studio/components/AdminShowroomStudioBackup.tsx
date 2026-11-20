"use client";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { readDocument, commitDocument } from "@/lib/browser_document";
import { Confirm } from "@/components/ui/Confirm";
import {
  preferencesSchema,
  type Preferences,
} from "@/app/frontend_admin/admin_showroom/showroom_studio/schemas/AdminShowroomStudioSchema";
const key = "clothes-shop.style-studio.v1";
export function AdminShowroomStudioBackup() {
  const t = useTranslations("studio");
  const [pending, setPending] = useState<Preferences | null>(null),
    [message, setMessage] = useState("");
  function replace(next: Preferences) {
    try {
      const raw = readDocument(key);
      commitDocument(key, raw, JSON.stringify(next));
      setPending(null);
      setMessage(t("message029"));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : t("message030"));
    }
  }
  return (
    <details>
      <summary>{t("message031")}</summary>
      <p>{t("message032")}</p>
      <Button
        onClick={() => {
          try {
            const data = preferencesSchema.parse(
              JSON.parse(readDocument(key) || "{}"),
            );
            const blob = new Blob(
              [
                JSON.stringify(
                  { studioVersion: 1, preferences: data },
                  null,
                  2,
                ),
              ],
              { type: "application/json" },
            );
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "clothes-shop-studio-backup.json";
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            setMessage(t("message033"));
          } catch {
            setMessage(t("message034"));
          }
        }}
      >
        {t("message035")}
      </Button>
      <label>
        {t("message036")}
        <input
          type="file"
          accept="application/json,.json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            setPending(null);
            if (!file) return;
            try {
              if (file.size > 4000000) throw Error(t("message037"));
              const raw = JSON.parse(await file.text());
              if (raw.studioVersion !== 1) throw Error(t("message038"));
              const data = preferencesSchema.parse(raw.preferences);
              if (
                JSON.stringify(data).length > 3500000 ||
                Object.keys(data).length > 1000
              )
                throw Error(t("message039"));
              setPending(data);
              setMessage(t("message040"));
            } catch (e) {
              setMessage(e instanceof Error ? e.message : t("message041"));
            }
          }}
        />
      </label>
      {pending && (
        <div>
          <p>
            {Object.keys(pending).length}
            {t("message042")}
          </p>
          <Button onClick={() => replace(pending)}>{t("message043")}</Button>
          <Button onClick={() => setPending(null)}>{t("message044")}</Button>
        </div>
      )}
      <Confirm
        trigger={<Button>{t("message045")}</Button>}
        title={t("message046")}
        description={t("message047")}
        confirmLabel={t("message048")}
        cancelLabel={t("message049")}
        onConfirm={() => replace({})}
      />
      <p role="status">{message}</p>
    </details>
  );
}
