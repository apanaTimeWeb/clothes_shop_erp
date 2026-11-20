"use client";
import { t } from "@/app/frontend_admin/admin_management/management_backup/utils/AdminManagementBackupMessages";

import { Button } from "@/components/ui/Button";
export default function Error({ reset }: { reset: () => void }) {
  return <Button onClick={reset}>{t("message43")}</Button>;
}
