import { redirect } from "next/navigation";
import { ADMIN_MANAGEMENT_STOCK_ROUTES } from "@/app/frontend_admin/admin_management/management_stock/config/admin_management_stock.url_config";
export default function Page() {
  redirect(ADMIN_MANAGEMENT_STOCK_ROUTES.root);
}
