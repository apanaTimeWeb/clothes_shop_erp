"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAdminReportsWorkspace } from "@/app/frontend_admin/admin_reports/reports_workspace/state/AdminReportsWorkspaceStore";
import { ROUTES } from "@/lib/routes";
import { salesReport } from "@/app/frontend_admin/admin_reports/reports_workspace/state/AdminReportsWorkspaceReports";
import { dateRange } from "@/app/frontend_admin/admin_reports/reports_workspace/utils/AdminReportsWorkspaceDates";
import { money } from "@/app/frontend_admin/admin_reports/reports_workspace/utils/AdminReportsWorkspaceAmounts";
import {
  csvText,
  downloadText,
} from "@/app/frontend_admin/admin_reports/reports_workspace/utils/AdminReportsWorkspaceDownload";
import type { ReportGroup } from "@/app/frontend_admin/admin_reports/reports_workspace/types/AdminReportsWorkspaceCommerce";
import { Button } from "@/components/ui/Button";
import { AdminReportsWorkspaceTrend } from "@/app/frontend_admin/admin_reports/reports_workspace/components/AdminReportsWorkspaceTrend";
import { AdminReportsWorkspaceStock } from "@/app/frontend_admin/admin_reports/reports_workspace/components/AdminReportsWorkspaceStock";
export function AdminReportsWorkspaceMain() {
  const t = useTranslations("reports"),
    { state, mode } = useAdminReportsWorkspace(),
    [preset, setPreset] = useState("all"),
    [dates, setDates] = useState({ from: "", to: "" }),
    [group, setGroup] = useState<ReportGroup>("design");
  const valid =
    (!dates.from || /^\d{4}-\d{2}-\d{2}$/.test(dates.from)) &&
    (!dates.to || /^\d{4}-\d{2}-\d{2}$/.test(dates.to)) &&
    (!dates.from || !dates.to || dates.from <= dates.to);
  const report = useMemo(
    () => salesReport(state, dates.from, dates.to, group),
    [state, dates, group],
  );
  const admin = mode === "Admin";
  const exportRows = () =>
    downloadText(
      "demo-sales-report.csv",
      csvText([
        [
          t("name"),
          t("sold"),
          t("returned"),
          "Gross INR",
          "Refund INR",
          "Net INR",
          ...(admin ? ["Estimated profit INR"] : []),
        ],
        ...report.rows.map((r) => [
          r.label,
          r.sold,
          r.returned,
          r.grossPaise / 100,
          r.refundPaise / 100,
          r.netPaise / 100,
          ...(admin ? [r.profitPaise / 100] : []),
        ]),
      ]),
      "text/csv;charset=utf-8",
    );
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-xs text-secondary">
        <Link href={ROUTES.overview} className="hover:underline">Overview</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Reports & Analytics</span>
      </nav>
      <h1 className="text-3xl font-semibold">{t("title")}</h1>
      <p className="my-3 text-secondary">{t("subtitle")}</p>
      <div className="my-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-2">
          {t("range")}
          <select
            value={preset}
            onChange={(e) => {
              setPreset(e.target.value);
              if (e.target.value !== "custom")
                setDates(dateRange(e.target.value));
            }}
          >
            {["all", "day", "week", "month", "custom"].map((k) => (
              <option key={k} value={k}>
                {t(k)}
              </option>
            ))}
          </select>
        </label>
        {(["from", "to"] as const).map((k) => (
          <label key={k} className="grid gap-2">
            {t(k)}
            <input
              type="date"
              value={dates[k]}
              onChange={(e) => {
                setPreset("custom");
                setDates({ ...dates, [k]: e.target.value });
              }}
            />
          </label>
        ))}
        <label className="grid gap-2">
          {t("group")}
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value as ReportGroup)}
          >
            {["design", "sku", "category", "size", "colour"].map((k) => (
              <option key={k} value={k}>
                {t(k)}
              </option>
            ))}
          </select>
        </label>
        {(preset !== "all" || dates.from || dates.to) && (
          <Button
            type="button"
            className="self-end min-h-10 text-xs"
            onClick={() => {
              setPreset("all");
              setDates({ from: "", to: "" });
            }}
          >
            Reset Range ✕
          </Button>
        )}
      </div>
      {!valid ? (
        <p role="alert" className="rounded bg-warning-bg p-4 text-warning">
          {t("invalidRange")}
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(
              [
                ["gross", report.gross],
                ["refunds", report.refunded],
                ["net", report.net],
                ...(admin ? [["profit", report.profit]] : []),
              ] as [string, number][]
            ).map(([key, n]) => (
              <article
                className="rounded-xl border border-border bg-card p-5"
                key={key}
              >
                <p className="text-sm text-secondary">{t(key)}</p>
                <strong className="mt-2 block text-2xl">{money(n)}</strong>
              </article>
            ))}
          </div>
          <p className="my-4 text-sm">
            {t("transactions")}: {report.salesCount} · {t("returnUnits")}:{" "}
            {report.returnedUnits}
          </p>
          {admin && (
            <p className="mb-5 text-xs text-secondary">{t("profitNote")}</p>
          )}
          <section className="my-6 rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">{t("tableTitle")}</h2>
              <Button onClick={exportRows}>{t("export")}</Button>
            </div>
            {!report.rows.length ? (
              <p className="py-8 text-secondary">{t("empty")}</p>
            ) : (
              <div className="mt-4 max-h-96 overflow-auto">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">{t("tableTitle")}</caption>
                  <thead>
                    <tr>
                      {[
                        "name",
                        "sold",
                        "returned",
                        "gross",
                        "refunds",
                        "net",
                        ...(admin ? ["profit"] : []),
                      ].map((k) => (
                        <th className="p-3" scope="col" key={k}>
                          {t(k)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.map((r) => (
                      <tr className="border-t border-border" key={r.key}>
                        <th
                          scope="row"
                          className="min-w-44 max-w-80 break-words p-3"
                        >
                          {r.label}
                        </th>
                        {[
                          r.sold,
                          r.returned,
                          money(r.grossPaise),
                          money(r.refundPaise),
                          money(r.netPaise),
                          ...(admin ? [money(r.profitPaise)] : []),
                        ].map((v, i) => (
                          <td className="whitespace-nowrap p-3" key={i}>
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-3 text-xs text-secondary">{t("legacy")}</p>
          </section>
          <AdminReportsWorkspaceTrend
            days={report.days}
            payments={report.payments}
          />
          <AdminReportsWorkspaceStock from={dates.from} to={dates.to} />
        </>
      )}
    </>
  );
}
