"use client";
import { t } from "@/app/frontend_admin/admin_management/management_customers/utils/AdminManagementCustomersMessages";

import { Button } from "@/components/ui/Button";
export default function Error({ reset }: { reset: () => void }) {
  return <Button onClick={reset}>{t("message42")}</Button>;
}
