"use client";
import { t } from "@/app/frontend_admin/admin_management/management_import/utils/AdminManagementImportMessages";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Confirm } from "@/components/ui/Confirm";
import { useAdminManagementImport } from "@/app/frontend_admin/admin_management/management_import/hooks/useAdminManagementImport";
import {
  prepareImport,
  template,
  parseCsv,
  headers,
} from "@/app/frontend_admin/admin_management/management_import/state/AdminManagementImportCsv";
export function AdminManagementImportMain() {
  const { shop, ready, canEdit, save, error } = useAdminManagementImport(),
    [csv, setCsv] = useState(""),
    [preview, setPreview] = useState<ReturnType<typeof prepareImport> | null>(null),
    [base, setBase] = useState(""),
    [message, setMessage] = useState("");
  const generation = useRef(0);
  if (!canEdit) return <p>{t("message1")}</p>;
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">{t("upgrade1")}</h1>
      <p>{t("upgrade2")}</p>
      <Button disabled={!ready} onClick={() => template(shop)}>
        {t("upgrade3")}
      </Button>
      <details>
        <summary>{t("upgrade4")}</summary>
        <p>
          {t("upgrade5")}
          {shop.departments.join(", ")}
        </p>
        <p>
          {t("upgrade6")}
          {shop.categories.join(", ")}
        </p>
        {shop.locations
          .filter((l) => l.active)
          .map((l) => (
            <p key={l.id}>
              {l.id} — {l.rack}/{l.shelf}/{l.box}
            </p>
          ))}
      </details>
      <label>
        {t("upgrade7")}
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={async (e) => {
            const ticket = ++generation.current;
            const file = e.target.files?.[0];
            e.target.value = "";
            setPreview(null);
            setCsv("");
            if (!file) return;
            try {
              if (file.size > 2000000) throw Error(t("upgrade8"));
              const text = await file.text();
              if (ticket !== generation.current) return;
              setCsv(text);
              setMessage(t("upgrade9"));
            } catch (err) {
              setMessage(err instanceof Error ? err.message : t("upgrade10"));
            }
          }}
        />
      </label>
      <Button
        disabled={!csv || !ready}
        onClick={() => {
          try {
            const p = prepareImport(shop, csv);
            setPreview(p);
            setBase(JSON.stringify(shop));
            setMessage(p.errors.length ? t("upgrade11") : t("upgrade12"));
          } catch (err) {
            setPreview(null);
            setMessage(err instanceof Error ? err.message : t("upgrade13"));
          }
        }}
      >
        {t("upgrade14")}
      </Button>
      {preview && (
        <section className="space-y-3">
          <p>
            {t("upgrade15")}
            {preview.count}
            {t("upgrade16")} {preview.next.products.length - shop.products.length}
            {t("upgrade17")} {preview.next.variants.length - shop.variants.length}
          </p>
          {preview.errors.map((e, i) => (
            <p role="alert" className="text-danger" key={i}>
              {e}
            </p>
          ))}
          <div className="max-h-96 overflow-auto">
            <table>
              <thead>
                <tr>
                  {headers.map((h) => (
                    <th className="p-2" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parseCsv(csv).map((row, i) => (
                  <tr key={i}>
                    {row.map((v, j) => (
                      <td className="p-2" key={j}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!preview.errors.length && (
            <Confirm
              trigger={<Button>{t("upgrade18")}</Button>}
              title={t("upgrade19")}
              description={t("upgrade20")}
              confirmLabel={t("upgrade21")}
              cancelLabel={t("upgrade22")}
              onConfirm={() => {
                if (
                  save((s) => {
                    if (JSON.stringify(s) !== base) throw Error(t("upgrade23"));
                    const result = prepareImport(s, csv);
                    if (result.errors.length) throw Error(result.errors.join("\n"));
                    Object.assign(s, result.next);
                  })
                ) {
                  setPreview(null);
                  setCsv("");
                  setMessage(t("upgrade24"));
                }
              }}
            />
          )}
        </section>
      )}
      <p role="status">{error || message}</p>
    </div>
  );
}
