import { AdminWorkspaceNavigationBoundary } from "@/app/frontend_admin/admin_workspace/workspace_navigation/components/AdminWorkspaceNavigationBoundary";
import { AdminWorkspaceNavigationShell } from "@/app/frontend_admin/admin_workspace/workspace_navigation/components/AdminWorkspaceNavigationShell";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AdminWorkspaceNavigationBoundary>
      <AdminWorkspaceNavigationShell>{children}</AdminWorkspaceNavigationShell>
    </AdminWorkspaceNavigationBoundary>
  );
}
