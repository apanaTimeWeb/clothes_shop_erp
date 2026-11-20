import { createTranslator } from "next-intl";
import messages from "@/app/frontend_admin/admin_management/management_purchases/locales/admin_management_purchases_en.json";
export const t = createTranslator({ locale: "en", messages });
