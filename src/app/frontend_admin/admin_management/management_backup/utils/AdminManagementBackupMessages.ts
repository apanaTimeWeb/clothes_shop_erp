import { createTranslator } from "next-intl";
import messages from "@/app/frontend_admin/admin_management/management_backup/locales/admin_management_backup_en.json";
export const t = createTranslator({ locale: "en", messages });
