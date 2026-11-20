"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Confirm } from "@/components/ui/Confirm";
import { readDocument, commitDocument } from "@/lib/browser_document";
import {
  offersSchema,
  type Offer,
} from "@/app/frontend_admin/admin_management/management_offers/schemas/AdminManagementOffersSchema";
const key = "clothes-shop.offers.v1";
export function AdminManagementOffersBackup() {
  const t = useTranslations("offers");
  const [pending, setPending] = useState<Offer[] | null>(null),
    [message, setMessage] = useState("");
  function replace(offers: Offer[]) {
    try {
      const raw = readDocument(key);
      commitDocument(
        key,
        raw,
        JSON.stringify(offersSchema.parse({ version: 1, offers })),
      );
      setPending(null);
      setMessage(t("saved"));
    } catch {
      setMessage(t("storageError"));
    }
  }
  return (
    <details>
      <summary>{t("backup")}</summary>
      <p>{t("backupNote")}</p>
      <Button
        onClick={() => {
          try {
            const data = offersSchema.parse(
              JSON.parse(readDocument(key) || '{"version":1,"offers":[]}'),
            );
            const url = URL.createObjectURL(
              new Blob([JSON.stringify(data, null, 2)], {
                type: "application/json",
              }),
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = "clothes-shop-offers.json";
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          } catch {
            setMessage(t("storageError"));
          }
        }}
      >
        {t("export")}
      </Button>
      <label>
        {t("import")}
        <input
          type="file"
          accept=".json,application/json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            setPending(null);
            if (!file) return;
            try {
              if (file.size > 500000) throw Error();
              setPending(
                offersSchema.parse(JSON.parse(await file.text())).offers,
              );
              setMessage(t("review"));
            } catch {
              setMessage(t("invalidBackup"));
            }
          }}
        />
      </label>
      {pending && (
        <div>
          <p>{t("count", { count: pending.length })}</p>
          <Button onClick={() => replace(pending)}>{t("replace")}</Button>
          <Button onClick={() => setPending(null)}>{t("cancel")}</Button>
        </div>
      )}
      <Confirm
        trigger={<Button>{t("reset")}</Button>}
        title={t("reset")}
        description={t("resetNote")}
        confirmLabel={t("reset")}
        cancelLabel={t("cancel")}
        onConfirm={() => replace([])}
      />
      <p role="status">{message}</p>
    </details>
  );
}
