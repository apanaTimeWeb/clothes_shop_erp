import { ADMIN_DASHBOARD_OVERVIEW_ROUTES } from "@/app/frontend_admin/admin_dashboard/dashboard_overview/config/admin_dashboard_overview.url_config";
import { ADMIN_SHOWROOM_CATALOGUE_ROUTES } from "@/app/frontend_admin/admin_showroom/showroom_catalogue/config/admin_showroom_catalogue.url_config";
import { ADMIN_SESSIONS_WORKSPACE_ROUTES } from "@/app/frontend_admin/admin_sessions/sessions_workspace/config/admin_sessions_workspace.url_config";
import { ADMIN_BILLING_CHECKOUT_ROUTES } from "@/app/frontend_admin/admin_billing/billing_checkout/config/admin_billing_checkout.url_config";
import { ADMIN_INVENTORY_BALANCES_ROUTES } from "@/app/frontend_admin/admin_inventory/inventory_balances/config/admin_inventory_balances.url_config";
import { ADMIN_SALES_HISTORY_ROUTES } from "@/app/frontend_admin/admin_sales/sales_history/config/admin_sales_history.url_config";
import { ADMIN_MANAGEMENT_STOCK_ROUTES } from "@/app/frontend_admin/admin_management/management_stock/config/admin_management_stock.url_config";
import { ADMIN_REPORTS_WORKSPACE_ROUTES } from "@/app/frontend_admin/admin_reports/reports_workspace/config/admin_reports_workspace.url_config";
import { ADMIN_SETTINGS_WORKSPACE_ROUTES } from "@/app/frontend_admin/admin_settings/settings_workspace/config/admin_settings_workspace.url_config";
export const ROUTES = {
  settings: ADMIN_SETTINGS_WORKSPACE_ROUTES.root,
  reports: ADMIN_REPORTS_WORKSPACE_ROUTES.root,
  management: ADMIN_MANAGEMENT_STOCK_ROUTES.domain,
  overview: ADMIN_DASHBOARD_OVERVIEW_ROUTES.root,
  showroom: ADMIN_SHOWROOM_CATALOGUE_ROUTES.root,
  sessions: ADMIN_SESSIONS_WORKSPACE_ROUTES.root,
  billing: ADMIN_BILLING_CHECKOUT_ROUTES.root,
  inventory: ADMIN_INVENTORY_BALANCES_ROUTES.root,
  sales: ADMIN_SALES_HISTORY_ROUTES.root,
} as const;
