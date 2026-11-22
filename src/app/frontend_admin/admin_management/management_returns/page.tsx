import { Suspense } from "react";
import { AdminManagementReturnsReturns } from "@/app/frontend_admin/admin_management/management_returns/components/AdminManagementReturnsReturns";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-96 rounded-xl bg-subtle p-8 motion-safe:animate-pulse">
          Loading returns...
        </div>
      }
    >
      <AdminManagementReturnsReturns />
    </Suspense>
  );
}
