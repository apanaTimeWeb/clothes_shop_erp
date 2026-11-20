import { createTranslator } from "next-intl";
import messages from "@/app/frontend_admin/admin_management/management_planning/locales/admin_management_planning_en.json";
export const t = createTranslator({ locale: "en", messages });
