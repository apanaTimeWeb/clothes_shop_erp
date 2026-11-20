"use client";
import { useEffect } from "react";
import { LocaleProvider } from "@/components/ui/LocaleProvider";
import {
  useAdminShowroomCatalogue,
  connectAdminShowroomCatalogue,
} from "@/app/frontend_admin/admin_showroom/showroom_catalogue/state/AdminShowroomCatalogueStore";
import messages from "@/app/frontend_admin/admin_showroom/showroom_catalogue/locales/admin_showroom_catalogue_en.json";

export default function AdminShowroomCatalogueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ready = useAdminShowroomCatalogue((s) => s.ready);
  useEffect(() => connectAdminShowroomCatalogue(), []);
  if (!ready)
    return (
      <div className="min-h-64 p-6" role="status">
        Loading local demo…
      </div>
    );
  return (
    <LocaleProvider messages={{ showroom: messages }}>
      {children}
    </LocaleProvider>
  );
}
