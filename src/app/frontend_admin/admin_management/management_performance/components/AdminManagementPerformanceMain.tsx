"use client";
import { t } from "@/app/frontend_admin/admin_management/management_performance/utils/AdminManagementPerformanceMessages";

import { AdminManagementPerformanceUsage } from "@/app/frontend_admin/admin_management/management_performance/components/AdminManagementPerformanceUsage";
import { useEffect, useState } from "react";
import { readDocument, subscribeDocument } from "@/lib/browser_document";
import { useAdminManagementPerformance } from "@/app/frontend_admin/admin_management/management_performance/hooks/useAdminManagementPerformance";
import {
  offersSchema,
  type Offer,
} from "@/app/frontend_admin/admin_management/management_performance/schemas/AdminManagementPerformanceOffersSchema";
import { campaignPerformance } from "@/app/frontend_admin/admin_management/management_performance/state/AdminManagementPerformanceAnalysis";
import { money } from "@/app/frontend_admin/admin_management/management_performance/utils/AdminManagementPerformanceAmounts";
export function AdminManagementPerformanceMain() {
  const { shop, ops, error, canEdit, now } = useAdminManagementPerformance();
  const [offers, setOffers] = useState<Offer[]>([]),
    [failed, setFailed] = useState(false),
    [id, setId] = useState("");
  useEffect(() => {
    function load() {
      try {
        setOffers(
          offersSchema.parse(
            JSON.parse(readDocument("clothes-shop.offers.v1") || '{"version":1,"offers":[]}'),
          ).offers,
        );
        setFailed(false);
      } catch {
        setFailed(true);
        setOffers([]);
      }
    }
    load();
    return subscribeDocument("clothes-shop.offers.v1", load, load);
  }, []);
  if (!canEdit) return <p>{t("message1")}</p>;
  const offer = offers.find((o) => o.id === id) || offers[0];
  const report = offer ? campaignPerformance(shop, offer, now) : null;
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">{t("message2")}</h1>
      <AdminManagementPerformanceUsage shop={shop} ops={ops} />
      <p>{t("message3")}</p>
      <p>{t("message4")}</p>
      {(error || failed) && (
        <p role="alert" className="text-danger">
          {t("message5")}
        </p>
      )}
      {!offers.length ? (
        <p>{t("message6")}</p>
      ) : (
        <label>
          {t("message7")}
          <select value={offer?.id} onChange={(e) => setId(e.target.value)}>
            {offers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {offer && report && (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2>{shop.products.find((p) => p.id === offer.productId)?.name || offer.productId}</h2>
          <p>
            {new Date(offer.startsAt).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            })}{" "}
            –{" "}
            {new Date(offer.endsAt).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            })}{" "}
            {t("message8")}
          </p>
          {report.duration === 0 ? (
            <p>{t("message9")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start">
                <thead>
                  <tr>
                    <th>{t("message10")}</th>
                    <th>{t("message11")}</th>
                    <th>{t("message12")}</th>
                    <th>{t("message13")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(["units", "bills", "paid", "refunds", "net", "lineDiscounts"] as const).map(
                    (key) => (
                      <tr key={key}>
                        <th>
                          {
                            {
                              units: t("message18"),
                              bills: t("message19"),
                              paid: t("message20"),
                              refunds: t("message21"),
                              net: t("message22"),
                              lineDiscounts: t("message23"),
                            }[key]
                          }
                        </th>
                        <td>
                          {["units", "bills"].includes(key)
                            ? report.prior[key]
                            : money(report.prior[key])}
                        </td>
                        <td>
                          {["units", "bills"].includes(key)
                            ? report.during[key]
                            : money(report.during[key])}
                        </td>
                        <td>
                          {["units", "bills"].includes(key)
                            ? report.during[key] - report.prior[key]
                            : money(report.during[key] - report.prior[key])}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
