"use client";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
export default function ErrorBoundary({ reset }: { reset: () => void }) {
  const t = useTranslations("shell");
  return (
    <section
      role="alert"
      className="rounded-xl border border-border bg-card p-8"
    >
      <h1 className="text-2xl font-semibold">{t("errorTitle")}</h1>
      <p className="my-4 text-secondary">{t("errorBody")}</p>
      <Button onClick={reset}>{t("retry")}</Button>
    </section>
  );
}
