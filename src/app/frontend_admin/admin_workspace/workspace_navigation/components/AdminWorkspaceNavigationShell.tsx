"use client";
import { requestDiscard } from "@/app/frontend_admin/admin_workspace/workspace_navigation/hooks/useAdminWorkspaceNavigationUnsaved";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard, Shirt, Users, Receipt, Boxes, ChartNoAxesCombined,
  Plus, RotateCcw, Menu, ArrowUpRight, X, LogOut, Sparkles,
} from "lucide-react";
import { logoutUser, getAuthUser, type AuthUser } from "@/lib/auth";
import { useAdminWorkspaceNavigation } from "@/app/frontend_admin/admin_workspace/workspace_navigation/state/AdminWorkspaceNavigationStore";
import { ROUTES } from "@/lib/routes";
import { STORAGE_KEY } from "@/app/frontend_admin/admin_workspace/workspace_navigation/state/AdminWorkspaceNavigationTransactions";
import type { AdminWorkspaceNavigationMode } from "@/app/frontend_admin/admin_workspace/workspace_navigation/types/AdminWorkspaceNavigationTypes";
import { Button } from "@/components/ui/Button";
import { Confirm } from "@/components/ui/Confirm";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const nav = [
  ["overview", LayoutDashboard],
  ["showroom", Shirt],
  ["studio", Sparkles],
  ["sessions", Users],
  ["billing", Receipt],
  ["inventory", Boxes],
  ["sales", ChartNoAxesCombined],
  ["management", Boxes],
  ["reports", ChartNoAxesCombined],
  ["settings", Menu],
] as const;

export function AdminWorkspaceNavigationShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("shell"), path = usePathname(), router = useRouter();
  const { state, ready, hydrate, notice, stale, mode, setMode, dispatch, markStale, notify } =
    useAdminWorkspaceNavigation();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => { setUser(getAuthUser()); }, []);

  const handleLogout = () => {
    logoutUser();
    router.push(`${ROUTES.login}?logged_out=1`);
  };

  useEffect(() => {
    const changed = (e: StorageEvent) => { if (e.key === STORAGE_KEY) markStale(); };
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, [hydrate, markStale]);

  const current = state.sessions.find((s) => s.id === state.activeSessionId);

  return (
    <>
      <a className="fixed -top-20 left-4 z-50 rounded bg-card p-4 focus:top-2" href="#main">
        {t("skip")}
      </a>
      <div className="min-h-screen lg:grid lg:grid-cols-[236px_minmax(0,1fr)]">
        <aside className={`${open ? "block" : "hidden"} border-r border-border bg-sidebar text-on-primary lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col`}>
          <Link href={ROUTES.overview} className="flex items-center gap-3 px-6 py-8">
            <div className="grid size-10 place-items-center rounded-xl border border-muted-inverse">
              <Shirt size={22} />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">{state.settings.shopName}</div>
              <div className="mt-1 text-[8px] tracking-widest text-muted-inverse">{t("brandSub")}</div>
            </div>
          </Link>
          <div className="px-6 pb-4 pt-5 text-[10px] tracking-widest text-muted-inverse">{t("workspace")}</div>
          <nav className="space-y-2 px-3" aria-label={t("workspace")}>
            {nav
              .filter(([key]) => mode !== "Customer" || key === "showroom" || key === "studio")
              .map(([key, Icon]) => (
                <Link
                  key={key}
                  href={ROUTES[key]}
                  onClick={() => setOpen(false)}
                  aria-current={path === ROUTES[key] ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-lg px-4 py-3 text-sm motion-safe:transition-colors ${
                    path === ROUTES[key] ? "bg-card text-primary" : "text-muted-inverse hover:bg-brand hover:text-on-primary"
                  }`}
                >
                  <Icon size={18} strokeWidth={2} />
                  {t(key)}
                </Link>
              ))}
          </nav>
          <div className="m-4 mt-10 rounded-xl border border-muted-inverse p-4 lg:mt-auto">
            <div className="text-[10px] tracking-widest text-accent">{t("progress")}</div>
            <p className="mt-3 text-sm font-semibold">{t("progressTitle")}</p>
            <p className="mt-2 text-xs leading-5 text-muted-inverse">{t("progressDescription")}</p>
          </div>
          <div className="px-6 pb-2 text-xs text-muted-inverse">{t("local")}</div>
          <div className="mx-3 mb-4 rounded-xl border border-muted-inverse/40 bg-card/10 p-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-on-primary truncate">{user?.name || "Admin"}</p>
              <p className="text-[10px] text-muted-inverse truncate">{user?.role || "Administrator"}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg p-1.5 text-danger hover:bg-danger/20 transition-colors"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-4 md:px-8">
            <div className="flex items-center gap-3">
              <Button className="lg:hidden" aria-label={t("menu")} onClick={() => setOpen(!open)}>
                <Menu size={18} />
              </Button>
              <span className="rounded-full bg-success-bg px-3 py-1 text-[10px] font-bold tracking-widest text-success">
                {t("demo")}
              </span>
              <span className="hidden text-xs text-secondary xl:block">{t("note")}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ThemeToggle />
              <label className="flex items-center gap-2">
                <span className="sr-only">{t("mode")}</span>
                <select
                  value={mode}
                  onChange={(e) => {
                    if (requestDiscard()) setMode(e.target.value as AdminWorkspaceNavigationMode);
                  }}
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
                >
                  {(["Staff", "Customer", "Admin"] as const).map((m) => (
                    <option key={m} value={m}>{t(m)}</option>
                  ))}
                </select>
              </label>

              {user && (
                <div
                  className="hidden md:flex items-center gap-1.5 rounded-lg border border-border bg-subtle px-2.5 py-1 text-xs"
                  title={`${user.name} (${user.role}) • ${user.store}`}
                >
                  <span className="size-2 rounded-full bg-success shrink-0" />
                  <span className="font-semibold text-foreground max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground hidden xl:inline truncate max-w-[100px]">
                    · {user.role.split(" ")[0]}
                  </span>
                </div>
              )}

              <Button
                onClick={handleLogout}
                className="flex items-center gap-1.5 min-h-8 px-2.5 py-1 text-xs text-danger hover:bg-danger/10 hover:text-danger hover:border-danger/40 transition-colors"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Log out</span>
              </Button>
            </div>
          </header>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 md:px-8">
            <div className="flex items-center gap-3">
              <Users size={18} className="text-secondary" />
              <span className="text-xs text-secondary">{t("active")}</span>
              <strong className="text-sm">{current?.name || t("noSession")}</strong>
              {current && mode !== "Customer" && (
                <Link href={ROUTES.sessions} aria-label={t("sessions")} className="p-3">
                  <ArrowUpRight size={16} />
                </Link>
              )}
            </div>
            <div className="flex gap-2">
              <Button disabled={!ready || stale} onClick={() => dispatch({ type: "session-new" })}>
                <Plus size={16} />
                {t("newSession")}
              </Button>
              {mode !== "Customer" && (
                <Confirm
                  title={t("resetTitle")}
                  description={t("resetDescription")}
                  confirmLabel={t("resetConfirm")}
                  cancelLabel={t("cancel")}
                  onConfirm={() => dispatch({ type: "reset" })}
                  trigger={
                    <Button aria-label={t("reset")} disabled={!ready || stale}>
                      <RotateCcw size={16} />
                      <span className="hidden md:inline">{t("reset")}</span>
                    </Button>
                  }
                />
              )}
            </div>
          </div>

          {notice && (
            <div role="status" className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-warning-bg p-3 text-sm text-warning md:mx-8">
              <span>{notice}</span>
              {stale ? (
                <Button onClick={() => window.location.reload()}>{t("reload")}</Button>
              ) : (
                <button className="p-2" aria-label={t("closeNotice")} onClick={() => notify("")}>
                  <X size={16} />
                </button>
              )}
            </div>
          )}

          <main id="main" className="mx-auto max-w-[1600px] p-4 md:p-8">
            {!ready ? (
              <div className="min-h-96 rounded-xl bg-subtle p-8 motion-safe:animate-pulse">
                {t("loading")}
              </div>
            ) : mode === "Customer" && !path.includes("showroom_catalogue") && !path.includes("showroom_studio") ? (
              <div className="mx-auto my-12 max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-card sm:p-12">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-blue-600/10 text-blue-600">
                  <Shirt size={32} />
                </div>
                <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground">{t("customerPortalTitle")}</h2>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{t("customerPortalSubtitle")}</p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Link href={ROUTES.showroom} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
                    {t("customerPortalCatalogue")}
                  </Link>
                  <Link href={ROUTES.studio} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-subtle transition-colors">
                    {t("customerPortalStudio")}
                  </Link>
                </div>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </>
  );
}