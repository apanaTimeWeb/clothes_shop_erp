import { Suspense } from "react";
import { AdminShowroomCatalogueMain } from "@/app/frontend_admin/admin_showroom/showroom_catalogue/components/AdminShowroomCatalogueMain";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-secondary">Loading Showroom...</div>}>
      <AdminShowroomCatalogueMain />
    </Suspense>
  );
}
