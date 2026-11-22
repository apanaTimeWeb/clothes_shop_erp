"use client";
import { t } from "@/app/frontend_admin/admin_management/management_planning/utils/AdminManagementPlanningMessages";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAdminManagementPlanning } from "@/app/frontend_admin/admin_management/management_planning/hooks/useAdminManagementPlanning";
import {
  planStock,
  exportPlan,
} from "@/app/frontend_admin/admin_management/management_planning/state/AdminManagementPlanningAnalysis";
export function AdminManagementPlanningMain() {
  const { shop, ops, ready, error, canEdit, now } = useAdminManagementPlanning();
  const [days, setDays] = useState(30),
    [lead, setLead] = useState(7),
    [safety, setSafety] = useState(2),
    [query, setQuery] = useState(""),
    [onlyNeeded, setOnlyNeeded] = useState(false),
    [limit, setLimit] = useState(25);
  if (!canEdit) return <p>{t("message1")}</p>;
  const rows = planStock(shop, ops, now, days, lead, safety).filter(
    (r) =>
      (r.sku + " " + r.name + " " + r.colour + " " + r.size)
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (!onlyNeeded || r.reorder > 0),
  );
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">{t("message2")}</h1>
      <p>{t("message3")}</p>
      <p>{t("message4")}</p>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <label>
          {t("message5")}
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[7, 30, 60, 90].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label>
          {t("message6")}
          <input
            type="number"
            min={1}
            max={365}
            value={lead}
            onChange={(e) =>
              setLead(Math.min(365, Math.max(1, Math.floor(Number(e.target.value) || 1))))
            }
          />
        </label>
        <label>
          {t("message7")}
          <input
            type="number"
            min={0}
            max={1000}
            value={safety}
            onChange={(e) =>
              setSafety(Math.min(1000, Math.max(0, Math.floor(Number(e.target.value) || 0))))
            }
          />
        </label>
      </div>
      <div className="flex items-end gap-2">
        <label className="grow">
          {t("message8")}
          <input
            className="w-full"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(25);
            }}
          />
        </label>
        {query && (
          <Button
            type="button"
            className="min-h-11 px-3 text-xs"
            onClick={() => {
              setQuery("");
              setLimit(25);
            }}
          >
            Clear ✕
          </Button>
        )}
      </div>
      <label>
        <input
          type="checkbox"
          checked={onlyNeeded}
          onChange={(e) => setOnlyNeeded(e.target.checked)}
        />{" "}
        {t("message9")}
      </label>
      <Button disabled={!ready} onClick={() => exportPlan(rows)}>
        {t("message10")}
      </Button>
      <div className="overflow-x-auto">
        <table className="w-full text-start">
          <thead>
            <tr>
              {[
                t("message17"),
                t("message18"),
                t("message19"),
                t("message20"),
                t("message21"),
                t("message22"),
                t("message23"),
                t("message24"),
                t("message25"),
                t("message26"),
                t("message27"),
                t("message28"),
              ].map((h) => (
                <th className="p-2" key={h}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, limit).map((r) => (
              <tr key={r.sku}>
                <th className="p-2">
                  {r.sku}
                  <p className="text-xs font-normal">
                    {r.name} · {r.colour} / {r.size}
                  </p>
                </th>
                {[r.sellable, r.onHand, r.sold, r.incoming, r.target, r.reorder, ...r.buckets].map(
                  (v, i) => (
                    <td className="p-2" key={i}>
                      {v}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <p>{t("message11")}</p>}
      {rows.length > limit && (
        <Button onClick={() => setLimit(limit + 25)}>{t("message12")}</Button>
      )}
    </div>
  );
}
