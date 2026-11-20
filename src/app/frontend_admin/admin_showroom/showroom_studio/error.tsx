"use client";
import { studioText as t } from "@/app/frontend_admin/admin_showroom/showroom_studio/utils/AdminShowroomStudioMessages";
import { Button } from "@/components/ui/Button";
export default function ErrorBoundary({ reset }: { reset: () => void }) {
  return (
    <section
      role="alert"
      className="min-h-64 rounded-xl border border-border bg-card p-6"
    >
      <h2 className="text-xl font-semibold">{t("errorTitle")}</h2>
      <p className="my-4">{t("errorBody")}</p>
      <Button onClick={reset}>{t("retry")}</Button>
    </section>
  );
}
