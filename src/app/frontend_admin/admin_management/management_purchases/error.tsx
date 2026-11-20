"use client";
import { t } from "@/app/frontend_admin/admin_management/management_purchases/utils/AdminManagementPurchasesMessages";

import { Button } from "@/components/ui/Button";
export default function Error({ reset }: { reset: () => void }) {
  return <Button onClick={reset}>{t("message51")}</Button>;
}
