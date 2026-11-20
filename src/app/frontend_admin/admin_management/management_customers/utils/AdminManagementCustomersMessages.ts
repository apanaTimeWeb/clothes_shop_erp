import { createTranslator } from "next-intl";
import messages from "@/app/frontend_admin/admin_management/management_customers/locales/admin_management_customers_en.json";
export const t = createTranslator({ locale: "en", messages });
