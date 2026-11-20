"use client";
import { createTranslator } from "next-intl";
import { Button } from "@/components/ui/Button";
import messages from "@/app/frontend_admin/admin_management/management_offers/locales/admin_management_offers_en.json";
const t = createTranslator({ locale: "en", messages });
export default function Error({ reset }: { reset: () => void }) {
  return <Button onClick={reset}>{t("retry")}</Button>;
}
