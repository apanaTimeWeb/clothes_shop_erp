import { Suspense } from "react";
import { AdminShowroomStudioMain } from "@/app/frontend_admin/admin_showroom/showroom_studio/components/AdminShowroomStudioMain";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-secondary">Loading Style Studio...</div>}>
      <AdminShowroomStudioMain />
    </Suspense>
  );
}
