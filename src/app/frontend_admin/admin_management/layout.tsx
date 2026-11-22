"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { ADMIN_MANAGEMENT_IMPORT_ROUTES } from "@/app/frontend_admin/admin_management/management_import/config/admin_management_import.url_config";
import { ADMIN_MANAGEMENT_PERFORMANCE_ROUTES } from "@/app/frontend_admin/admin_management/management_performance/config/admin_management_performance.url_config";
import { ADMIN_MANAGEMENT_PLANNING_ROUTES } from "@/app/frontend_admin/admin_management/management_planning/config/admin_management_planning.url_config";
import { ADMIN_MANAGEMENT_CUSTOMERS_ROUTES } from "@/app/frontend_admin/admin_management/management_customers/config/admin_management_customers.url_config";
import { ADMIN_MANAGEMENT_PURCHASES_ROUTES } from "@/app/frontend_admin/admin_management/management_purchases/config/admin_management_purchases.url_config";
import { ADMIN_MANAGEMENT_BARCODES_ROUTES } from "@/app/frontend_admin/admin_management/management_barcodes/config/admin_management_barcodes.url_config";
import { ADMIN_MANAGEMENT_BACKUP_ROUTES } from "@/app/frontend_admin/admin_management/management_backup/config/admin_management_backup.url_config";
import { ADMIN_MANAGEMENT_INTAKE_ROUTES } from "@/app/frontend_admin/admin_management/management_intake/config/admin_management_intake.url_config";
import { ADMIN_MANAGEMENT_CATALOGUE_ROUTES } from "@/app/frontend_admin/admin_management/management_catalogue/config/admin_management_catalogue.url_config";
import { ADMIN_MANAGEMENT_STOCK_ROUTES } from "@/app/frontend_admin/admin_management/management_stock/config/admin_management_stock.url_config";
import { ADMIN_MANAGEMENT_IMAGES_ROUTES } from "@/app/frontend_admin/admin_management/management_images/config/admin_management_images.url_config";
import { ADMIN_MANAGEMENT_RETURNS_ROUTES } from "@/app/frontend_admin/admin_management/management_returns/config/admin_management_returns.url_config";
import { ADMIN_MANAGEMENT_VOCABULARY_ROUTES } from "@/app/frontend_admin/admin_management/management_vocabulary/config/admin_management_vocabulary.url_config";
import { ADMIN_MANAGEMENT_OFFERS_ROUTES } from "@/app/frontend_admin/admin_management/management_offers/config/admin_management_offers.url_config";

const tabs = [
  ["stock", ADMIN_MANAGEMENT_STOCK_ROUTES.root],
  ["intake", ADMIN_MANAGEMENT_INTAKE_ROUTES.root],
  ["catalogue", ADMIN_MANAGEMENT_CATALOGUE_ROUTES.root],
  ["images", ADMIN_MANAGEMENT_IMAGES_ROUTES.root],
  ["barcodes", ADMIN_MANAGEMENT_BARCODES_ROUTES.root],
  ["customers", ADMIN_MANAGEMENT_CUSTOMERS_ROUTES.root],
  ["offers", ADMIN_MANAGEMENT_OFFERS_ROUTES.root],
  ["purchases", ADMIN_MANAGEMENT_PURCHASES_ROUTES.root],
  ["returns", ADMIN_MANAGEMENT_RETURNS_ROUTES.root],
  ["planning", ADMIN_MANAGEMENT_PLANNING_ROUTES.root],
  ["performance", ADMIN_MANAGEMENT_PERFORMANCE_ROUTES.root],
  ["vocabulary", ADMIN_MANAGEMENT_VOCABULARY_ROUTES.root],
  ["backup", ADMIN_MANAGEMENT_BACKUP_ROUTES.root],
  ["CSV import", ADMIN_MANAGEMENT_IMPORT_ROUTES.root],
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-secondary">
        <Link href={ROUTES.overview} className="hover:underline">Overview</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Store Management</span>
      </nav>
      <nav aria-label="Shop operations" className="mb-6 flex flex-wrap gap-2 sm:gap-2.5">
        {tabs.map(([name, href]) => {
          const isActive = path === href || (path.startsWith(href) && href !== "/frontend_admin/admin_management/");
          return (
            <Link
              key={href}
              href={href}
              className={`min-h-10 rounded-lg px-3.5 py-2 capitalize text-xs sm:text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600 text-white font-semibold shadow-sm"
                  : "border border-border bg-card text-foreground hover:bg-subtle"
              }`}
            >
              {name}
            </Link>
          );
        })}
      </nav>
      {children}
    </>
  );
}