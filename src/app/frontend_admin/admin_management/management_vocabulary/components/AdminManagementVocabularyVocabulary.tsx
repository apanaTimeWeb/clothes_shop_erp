"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminManagementVocabulary } from "@/app/frontend_admin/admin_management/management_vocabulary/state/AdminManagementVocabularyStore";
import { Button } from "@/components/ui/Button";
import {
  AdminManagementVocabularyField as Field,
  readFields,
} from "@/app/frontend_admin/admin_management/management_vocabulary/components/AdminManagementVocabularyFields";
export function AdminManagementVocabularyVocabulary() {
  const t = useTranslations("management"),
    { state, dispatch, stale } = useAdminManagementVocabulary(),
    [kind, setKind] = useState<"categories" | "departments">("categories");
  return (
    <>
      <p className="mb-4 text-secondary">{t("vocabNote")}</p>
      <label className="grid gap-2">
        {t("vocabKind")}
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
        >
          {["categories", "departments"].map((k) => (
            <option key={k} value={k}>
              {t(k)}
            </option>
          ))}
        </select>
      </label>
      <p className="my-4">{state[kind].join(" · ")}</p>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const f = readFields(e.currentTarget);
          if (f.action === "rename" && !f.replacementName.trim()) {
            useAdminManagementVocabulary
              .getState()
              .notify(t("replacementName"));
            return;
          }
          dispatch({
            type: "manage-vocabulary",
            data: {
              operation: {
                kind,
                name: f.name,
                replacement:
                  f.action === "rename" ? f.replacementName : undefined,
                remove: f.action === "delete",
              },
            },
          });
        }}
      >
        <Field name="name" />
        <Field name="replacementName" required={false} />
        <label className="grid gap-2">
          {t("kind")}
          <select name="action">
            {["add", "rename", "delete"].map((k) => (
              <option key={k} value={k}>
                {t(k)}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" disabled={stale}>
          {t("save")}
        </Button>
      </form>
    </>
  );
}
