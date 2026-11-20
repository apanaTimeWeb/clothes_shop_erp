"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useAdminSettingsWorkspace } from "@/app/frontend_admin/admin_settings/settings_workspace/state/AdminSettingsWorkspaceStore";
import { Button } from "@/components/ui/Button";
const formSchema = z.object({
  shopName: z.string().trim().min(1).max(120),
  taxPercent: z.coerce.number().min(0).max(100),
  lowStockThreshold: z.coerce.number().int().min(0).max(100000),
  receiptNote: z.string().max(300),
  sizeVocabulary: z.string().max(3000),
  fabricVocabulary: z.string().max(6000),
});
type Values = z.infer<typeof formSchema>;
export function AdminSettingsWorkspaceForm() {
  const t = useTranslations("settings"),
    { state, dispatch, stale, notify } = useAdminSettingsWorkspace();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...state.settings,
      receiptNote: state.settings.receiptNote ?? "",
      sizeVocabulary: (state.settings.sizeVocabulary ?? []).join(", "),
      fabricVocabulary: (state.settings.fabricVocabulary ?? []).join(", "),
    },
  });
  return (
    <form
      className="grid gap-4 rounded-xl border border-border bg-card p-6 sm:grid-cols-2"
      onSubmit={handleSubmit((v) => {
        const list = (text: string) => [
          ...new Set(
            text
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean),
          ),
        ];
        if (
          dispatch({
            type: "settings-save",
            data: {
              operation: {
                ...v,
                timeZone: "Asia/Kolkata",
                sizeVocabulary: list(v.sizeVocabulary),
                fabricVocabulary: list(v.fabricVocabulary),
              },
            },
          })
        ) {
          reset(v);
          notify(t("saved"));
        }
      })}
    >
      {(
        [
          "shopName",
          "taxPercent",
          "lowStockThreshold",
          "receiptNote",
          "sizeVocabulary",
          "fabricVocabulary",
        ] as const
      ).map((key) => (
        <label className="grid gap-2" key={key}>
          {t(key)}
          <input
            type={
              key === "taxPercent" || key === "lowStockThreshold"
                ? "number"
                : "text"
            }
            step={key === "taxPercent" ? "0.01" : "1"}
            min={0}
            {...register(key)}
            aria-invalid={!!errors[key]}
          />
          {errors[key] && (
            <span role="alert" className="text-sm text-danger">
              {t("validation")}
            </span>
          )}
        </label>
      ))}
      <p className="text-sm text-secondary sm:col-span-2">{t("timeZone")}</p>
      <Button type="submit" disabled={stale || !isDirty}>
        {t("save")}
      </Button>
    </form>
  );
}
