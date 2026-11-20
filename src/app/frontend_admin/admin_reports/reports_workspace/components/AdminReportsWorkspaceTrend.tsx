"use client";
import { useTranslations } from "next-intl";
import { money } from "@/app/frontend_admin/admin_reports/reports_workspace/utils/AdminReportsWorkspaceAmounts";
export function AdminReportsWorkspaceTrend({
  days,
  payments,
}: {
  days: { day: string; sales: number; refunds: number }[];
  payments: { label: string; amount: number }[];
}) {
  const t = useTranslations("reports"),
    max = Math.max(1, ...days.map((d) => Math.max(d.sales, d.refunds)));
  return (
    <div className="my-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-xl font-semibold">{t("trend")}</h2>
        <p className="my-3 text-xs text-secondary">{t("trendNote")}</p>
        <div className="max-h-96 space-y-4 overflow-auto">
          {days.map((d) => (
            <div key={d.day}>
              <p className="mb-2 text-sm">
                {d.day} · {t("gross")}: {money(d.sales)} · {t("refunds")}:{" "}
                {money(d.refunds)}
              </p>
              <div aria-hidden="true" className="space-y-1">
                <div
                  className="h-3 rounded bg-brand"
                  style={{ width: `${(100 * d.sales) / max}%` }}
                />
                <div
                  className="h-3 rounded bg-warning"
                  style={{ width: `${(100 * d.refunds) / max}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">{t("payments")}</h2>
        {payments.map((p) => (
          <p
            key={p.label}
            className="flex justify-between border-b border-border py-4"
          >
            <span>{p.label}</span>
            <strong>{money(p.amount)}</strong>
          </p>
        ))}
      </section>
    </div>
  );
}
