"use client";
import { LocaleProvider } from "@/components/ui/LocaleProvider";
import messages from "@/app/frontend_admin/admin_showroom/showroom_studio/locales/admin_showroom_studio_en.json";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider messages={{ studio: messages }}>{children}</LocaleProvider>
  );
}
