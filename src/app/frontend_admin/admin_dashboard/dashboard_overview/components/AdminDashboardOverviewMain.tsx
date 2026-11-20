"use client";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Shirt,
  Boxes,
  Receipt,
  PackageOpen,
  Search,
  Heart,
  MapPin,
  CheckCheck,
} from "lucide-react";
import { useAdminDashboardOverview } from "@/app/frontend_admin/admin_dashboard/dashboard_overview/state/AdminDashboardOverviewStore";
import { ROUTES } from "@/lib/routes";
import { sellable } from "@/app/frontend_admin/admin_dashboard/dashboard_overview/state/AdminDashboardOverviewTransactions";
import { money } from "@/app/frontend_admin/admin_dashboard/dashboard_overview/utils/AdminDashboardOverviewAmounts";
export function AdminDashboardOverviewMain() {
  const t = useTranslations("dashboard"),
    state = useAdminDashboardOverview((s) => s.state);
  const stats = [
    {
      key: "designs",
      value: state.products.length,
      hint: t("catalogue", { count: state.departments.length }),
      Icon: Shirt,
    },
    {
      key: "units",
      value: state.inventoryBalances.reduce(
        (n, b) => n + b.onHand - b.nonSellable,
        0,
      ),
      hint: t("stock"),
      Icon: Boxes,
    },
    {
      key: "sales",
      value: money(state.sales.reduce((n, s) => n + s.totalPaise, 0)),
      hint: t("salesHint"),
      Icon: Receipt,
    },
    {
      key: "pending",
      value: state.pickItems
        .filter((p) => ["retrieved", "return-pending"].includes(p.status))
        .reduce((sum, p) => sum + p.qty, 0),
      hint: t("pendingHint"),
      Icon: PackageOpen,
    },
  ];
  const low = state.variants.filter(
      (v) =>
        sellable(state, v.id) > 0 &&
        sellable(state, v.id) <= state.settings.lowStockThreshold,
    ).length,
    out = state.variants.filter((v) => !sellable(state, v.id)).length;
  return (
    <>
      <p className="text-[10px] font-semibold tracking-[.2em] text-secondary">
        {t("eyebrow")}
      </p>
      <div className="mb-7 mt-3">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-secondary">{t("subtitle")}</p>
      </div>
      <section className="mb-6 grid overflow-hidden rounded-2xl bg-brand text-on-primary md:grid-cols-[1.2fr_1fr]">
        <div className="p-7 md:p-10">
          <p className="mb-5 text-[10px] tracking-[.2em] text-accent">
            {t("heroTag")}
          </p>
          <h2 className="whitespace-pre-line font-serif text-4xl leading-tight md:text-5xl">
            {t("heroTitle")}
          </h2>
          <p className="mt-5 max-w-md text-sm leading-6 text-muted-inverse">
            {t("heroBody")}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={ROUTES.showroom}
              className="inline-flex min-h-11 items-center gap-3 rounded-lg bg-card px-5 py-3 text-sm font-semibold text-primary"
            >
              {t("browse")}
              <ArrowRight size={16} />
            </Link>
            <Link
              href={ROUTES.sessions}
              className="inline-flex min-h-11 items-center px-2 text-sm text-on-primary underline underline-offset-4"
            >
              {t("pick")}
            </Link>
          </div>
        </div>
        <Image
          src="/images/hero.svg"
          width={640}
          height={500}
          alt={t("art")}
          priority
          className="hidden h-full w-full object-cover md:block"
        />
      </section>
      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ key, value, hint, Icon }) => (
          <section
            key={key}
            className="rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-secondary">{t(key)}</p>
              <Icon size={18} className="text-secondary" />
            </div>
            <strong className="mt-4 block text-3xl font-semibold tracking-tight">
              {value}
            </strong>
            <p className="mt-2 text-[11px] text-secondary">{hint}</p>
          </section>
        ))}
      </div>
      <section className="mb-7 rounded-xl border border-border bg-card p-6">
        <div className="mb-6 flex flex-wrap justify-between gap-2">
          <h2 className="text-lg font-semibold">{t("flow")}</h2>
          <p className="text-xs text-secondary">{t("flowNote")}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[Search, Heart, MapPin, CheckCheck].map((Icon, index) => (
            <div key={index} className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-subtle text-primary">
                <Icon size={18} />
              </span>
              <div>
                <h3 className="text-sm font-semibold">
                  <span className="mr-1 text-secondary">0{index + 1}</span>{" "}
                  {t(`step${index + 1}`)}
                </h3>
                <p className="mt-2 max-w-52 text-xs leading-5 text-secondary">
                  {t(`step${index + 1}Body`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <div className="mb-4 flex justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("featured")}</h2>
        <Link
          className="text-xs underline underline-offset-4"
          href={ROUTES.showroom}
        >
          {t("all")} →
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {state.products.slice(0, 4).map((p) => (
          <Link
            href={ROUTES.showroom}
            key={p.id}
            className="flex items-center gap-3 overflow-hidden rounded-xl border border-border bg-card p-3"
          >
            <Image
              src={
                state.images.find((i) => i.productId === p.id)!.srcOrAssetKey
              }
              width={76}
              height={86}
              alt={t("illustration")}
              className="rounded-lg"
            />
            <div>
              <p className="text-[10px] text-secondary">
                {p.departmentId} · {p.fabric}
              </p>
              <h3 className="mt-1 text-sm font-semibold">{p.name}</h3>
              <p className="mt-2 text-xs">{money(p.defaultPricePaise)}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-warning-bg px-5 py-4">
        <div>
          <strong className="text-sm text-warning">{t("low")}</strong>
          <p className="mt-1 text-xs text-warning">
            {t("lowBody", { low, out })}
          </p>
        </div>
        <Link
          href={ROUTES.inventory}
          className="text-sm text-warning underline"
        >
          {t("inventory")} →
        </Link>
      </div>
      <p className="mt-6 text-center text-[9px] tracking-widest text-secondary">
        {t("note")}
      </p>
    </>
  );
}
