"use client";
import { LocaleProvider } from "@/components/ui/LocaleProvider";
import messages from "@/app/frontend_admin/admin_management/management_purchases/locales/admin_management_purchases_en.json";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <LocaleProvider messages={{ retail: messages }}>{children}</LocaleProvider>;
}
