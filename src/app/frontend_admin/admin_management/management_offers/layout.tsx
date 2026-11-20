"use client";
import { LocaleProvider } from "@/components/ui/LocaleProvider";
import messages from "@/app/frontend_admin/admin_management/management_offers/locales/admin_management_offers_en.json";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider messages={{ offers: messages }}>{children}</LocaleProvider>
  );
}
