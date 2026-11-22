"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Users, Plus, PackageCheck, ArrowRight } from "lucide-react";
import { useAdminSessionsWorkspace } from "@/app/frontend_admin/admin_sessions/sessions_workspace/state/AdminSessionsWorkspaceStore";
import { ROUTES } from "@/lib/routes";
import {
  labelFor,
  locationLabel,
  sellable,
} from "@/app/frontend_admin/admin_sessions/sessions_workspace/state/AdminSessionsWorkspaceTransactions";
import { Button } from "@/components/ui/Button";
import { Confirm } from "@/components/ui/Confirm";
import { AdminSessionsWorkspaceShortlist } from "@/app/frontend_admin/admin_sessions/sessions_workspace/components/AdminSessionsWorkspaceShortlist";
import { AdminSessionsWorkspaceTrialRack } from "@/app/frontend_admin/admin_sessions/sessions_workspace/components/AdminSessionsWorkspaceTrialRack";
import { resolveCatalogueProductImage } from "@/lib/product_images";
export function AdminSessionsWorkspaceMain() {
  const t = useTranslations("sessions"),
    { state, dispatch, stale } = useAdminSessionsWorkspace(),
    router = useRouter();
  const session = state.sessions.find((s) => s.id === state.activeSessionId);
  const shortlist = state.shortlistItems.filter(
      (i) => i.sessionId === session?.id && i.status === "shortlisted",
    ),
    picks = state.pickItems.filter((p) => p.sessionId === session?.id),
    outstanding = picks.filter((p) =>
      ["retrieved", "return-pending"].includes(p.status),
    ).length;
  const locked = new Set(
    state.draftBills
      .filter((b) => b.status === "draft")
      .flatMap((b) => b.lines.map((l) => l.pickId)),
  );
  return (
    <>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">
        <Link href={ROUTES.overview} className="hover:underline">Overview</Link>
        <span>/</span>
        <span className="text-blue-600">Sessions & Picking</span>
      </div>
      <h1 className="mt-1 text-3xl font-semibold">{t("title")}</h1>
      <p className="mb-7 mt-2 text-secondary">{t("subtitle")}</p>
      <div className="grid gap-6 xl:grid-cols-[230px_minmax(0,1fr)]">
        <section className="self-start rounded-xl border border-border bg-card p-4">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <Users size={18} />
            {t("sessions")}
          </h2>
          <div className="space-y-2">
            {state.sessions.map((s) => (
              <button
                key={s.id}
                disabled={s.status === "closed" || stale}
                onClick={() => dispatch({ type: "session-switch", data: { sessionId: s.id } })}
                className={`flex min-h-11 w-full items-center justify-between rounded-lg p-3 text-left ${s.id === session?.id ? "bg-brand text-on-primary" : "bg-subtle text-primary"} disabled:opacity-50`}
              >
                <span>{s.name}</span>
                <span className="text-xs">{s.status === "closed" ? t("closed") : s.id === session?.id ? t("active") : t("resume")}</span>
              </button>
            ))}
          </div>
          <Button
            className="mt-3 w-full"
            disabled={stale}
            onClick={() => dispatch({ type: "session-new" })}
          >
            <Plus size={16} />
            {t("new")}
          </Button>
        </section>
        <div className="min-w-0 space-y-6">
          {!session ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center">
              <p className="mb-4">{t("empty")}</p>
              <Link href={ROUTES.showroom} className="underline">
                {t("browse")}
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{session.name}</h2>
                <Confirm
                  trigger={<Button disabled={stale}>{t("close")}</Button>}
                  title={t("closeTitle")}
                  description={t("closeDescription")}
                  confirmLabel={t("close")}
                  cancelLabel={t("cancel")}
                  onConfirm={() => dispatch({ type: "session-close" })}
                />
              </div>
              {outstanding > 0 && (
                <div className="rounded-lg bg-warning-bg p-4 text-sm text-warning">
                  {t("returnWarning", { count: outstanding })}
                </div>
              )}
              <AdminSessionsWorkspaceTrialRack />
              <section className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">{t("shortlist")}</h2>
                  <Link href={ROUTES.showroom} className="text-sm underline">
                    {t("browse")}
                  </Link>
                </div>
                <p className="mt-1 text-xs text-secondary">
                  {t("shortlistNote")}
                </p>
                {!shortlist.length ? (
                  <p className="py-8 text-secondary">{t("none")}</p>
                ) : (
                  <>
                    <AdminSessionsWorkspaceShortlist />
                    <div className="flex flex-wrap gap-3">
                      <Button
                        className="bg-brand text-on-primary hover:bg-brand-hover"
                        disabled={stale}
                        onClick={() => dispatch({ type: "picks-generate" })}
                      >
                        <PackageCheck size={18} />
                        {t("generate")}
                      </Button>
                      <Confirm
                        trigger={<Button disabled={stale}>{t("clear")}</Button>}
                        title={t("clearTitle")}
                        description={t("clearDescription")}
                        confirmLabel={t("clear")}
                        cancelLabel={t("cancel")}
                        onConfirm={() => dispatch({ type: "shortlist-clear" })}
                      />
                    </div>
                  </>
                )}
              </section>
              <section className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-lg font-semibold">{t("picks")}</h2>
                <p className="mt-1 text-xs text-secondary">{t("pickNote")}</p>
                {!picks.length && (
                  <p className="py-8 text-secondary">{t("noPicks")}</p>
                )}
                <div className="mt-4 space-y-3">
                  {picks.map((p) => {
                    const v = state.variants.find((x) => x.id === p.variantId);
                    const prod = state.products.find((x) => x.id === v?.productId);
                    const imgSrc = resolveCatalogueProductImage(prod?.id || "", prod?.name, prod?.categoryId, v?.colour);
                    return (
                      <article key={p.id} className="rounded-lg border border-border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <Image
                              src={imgSrc}
                              alt={labelFor(state, p.variantId)}
                              width={40}
                              height={40}
                              className="size-10 rounded-md object-contain bg-subtle border border-border p-0.5 shrink-0"
                              onError={(e) => { e.currentTarget.src = "/images/real-shirt-white.png"; }}
                            />
                            <strong className="text-sm">
                              {labelFor(state, p.variantId)} · {t("count", { count: p.qty })}
                            </strong>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs ${["purchased", "returned"].includes(p.status) ? "bg-success-bg text-success" : "bg-subtle text-secondary"}`}
                          >
                            {t(p.status)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-secondary">{locationLabel(state, p.locationId)}</p>
                        {p.status === "awaiting" && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <label className="grid gap-1">
                              {t("source")}
                              <select
                                value={p.locationId}
                                disabled={stale}
                                onChange={(e) => dispatch({ type: "pick-source", data: { pickId: p.id, locationId: e.target.value } })}
                              >
                                {state.locations
                                  .filter((l) => l.active && (l.id === p.locationId || sellable(state, p.variantId, l.id) >= p.qty))
                                  .map((l) => (<option key={l.id} value={l.id}>{locationLabel(state, l.id)}</option>))}
                              </select>
                            </label>
                            <Button className="self-end" disabled={stale} onClick={() => dispatch({ type: "pick-retrieve", data: { pickId: p.id } })}>{t("retrieve")}</Button>
                            <Button className="self-end" disabled={stale} onClick={() => dispatch({ type: "pick-missing", data: { pickId: p.id } })}>{t("missing")}</Button>
                          </div>
                        )}
                        {p.status === "retrieved" &&
                          (locked.has(p.id) ? (
                            <p className="mt-3 text-xs text-secondary">{t("locked")}</p>
                          ) : (
                            <Button className="mt-3" disabled={stale} onClick={() => dispatch({ type: "pick-reject", data: { pickId: p.id } })}>{t("reject")}</Button>
                          ))}
                        {p.status === "return-pending" && (
                          <Button className="mt-3" disabled={stale} onClick={() => dispatch({ type: "pick-return", data: { pickId: p.id } })}>{t("return")}</Button>
                        )}
                      </article>
                    );
                  })}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button
                    className="bg-brand text-on-primary hover:bg-brand-hover"
                    disabled={
                      stale ||
                      !picks.some(
                        (p) => p.status === "retrieved" && !locked.has(p.id),
                      )
                    }
                    onClick={() => {
                      if (dispatch({ type: "bill-create" }))
                        router.push(ROUTES.billing);
                    }}
                  >
                    {t("createBill")}
                    <ArrowRight size={16} />
                  </Button>
                  <Link
                    href={ROUTES.billing}
                    className="inline-flex min-h-11 items-center px-3 underline"
                  >
                    {t("openBilling")}
                  </Link>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
}
