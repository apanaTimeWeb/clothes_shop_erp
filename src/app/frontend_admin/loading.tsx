"use client";
import { useTranslations } from "next-intl";
export default function Loading() {
  const t = useTranslations("shell");
  return (
    <div
      role="status"
      className="min-h-96 rounded-xl bg-subtle p-8 motion-safe:animate-pulse"
    >
      {t("loading")}
    </div>
  );
}
