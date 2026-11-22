"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LocaleProvider } from "@/components/ui/LocaleProvider";
import {
  useAdminWorkspaceNavigation,
  connectAdminWorkspaceNavigation,
} from "@/app/frontend_admin/admin_workspace/workspace_navigation/state/AdminWorkspaceNavigationStore";
import messages from "@/app/frontend_admin/admin_workspace/workspace_navigation/locales/admin_workspace_navigation_en.json";
import { isAuthenticated } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export function AdminWorkspaceNavigationBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  const ready = useAdminWorkspaceNavigation((s) => s.ready);
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    connectAdminWorkspaceNavigation();
    if (!isAuthenticated()) {
      setAuthed(false);
      router.replace(ROUTES.login);
    } else {
      setAuthed(true);
    }
  }, [router]);

  if (authed === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6 text-xs text-muted-foreground" role="status">
        Redirecting to login…
      </div>
    );
  }

  if (!ready || authed === null)
    return (
      <div className="min-h-64 p-6" role="status">
        Loading local demo…
      </div>
    );
  return (
    <LocaleProvider messages={{ shell: messages }}>{children}</LocaleProvider>
  );
}
