import { createTranslator } from "next-intl";
import messages from "@/app/frontend_admin/admin_management/management_performance/locales/admin_management_performance_en.json";
export const t = createTranslator({ locale: "en", messages });
