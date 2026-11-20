"use client";
import { t } from "@/app/frontend_admin/admin_management/management_performance/utils/AdminManagementPerformanceMessages";

import { Button } from "@/components/ui/Button";
export default function Error({ reset }: { reset: () => void }) {
  return <Button onClick={reset}>{t("message17")}</Button>;
}
