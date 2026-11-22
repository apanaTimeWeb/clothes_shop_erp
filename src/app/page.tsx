"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { isAuthenticated } from "@/lib/auth";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace(ROUTES.overview);
    } else {
      router.replace(ROUTES.login);
    }
  }, [router]);

  return (
    <div className="min-h-screen grid place-items-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-xs text-muted-foreground">Redirecting to showroom…</span>
      </div>
    </div>
  );
}
