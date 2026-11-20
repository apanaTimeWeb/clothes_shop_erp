import { createTranslator } from "next-intl";
import messages from "@/app/frontend_admin/admin_showroom/showroom_studio/locales/admin_showroom_studio_en.json";
export const studioText = createTranslator({ locale: "en", messages });
