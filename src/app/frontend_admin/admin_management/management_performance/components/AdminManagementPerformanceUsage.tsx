import { t } from "@/app/frontend_admin/admin_management/management_performance/utils/AdminManagementPerformanceMessages";
import type { AdminManagementPerformanceState } from "@/app/frontend_admin/admin_management/management_performance/types/AdminManagementPerformanceTypes";
import type { Operations } from "@/app/frontend_admin/admin_management/management_performance/schemas/AdminManagementPerformanceOperationsSchema";
import { money } from "@/app/frontend_admin/admin_management/management_performance/utils/AdminManagementPerformanceAmounts";
export function AdminManagementPerformanceUsage({
  shop,
  ops,
}: {
  shop: AdminManagementPerformanceState;
  ops: Operations;
}) {
  const groups = new Map<
    string,
    {
      name: string;
      units: number;
      returns: number;
      discount: number;
      netDiscount: number;
      sales: Set<string>;
    }
  >();
  for (const u of ops.offerUses) {
    const row = groups.get(u.offerId) || {
      name: u.name,
      units: 0,
      returns: 0,
      discount: 0,
      netDiscount: 0,
      sales: new Set<string>(),
    };
    const returned = shop.saleReturns
      .filter((r) => r.saleId === u.saleId && r.lineIndex === u.lineIndex)
      .reduce((n, r) => n + r.qty, 0);
    row.units += u.qty;
    row.returns += returned;
    row.discount += u.discountPaise;
    row.netDiscount +=
      u.discountPaise - Math.round((u.discountPaise * Math.min(returned, u.qty)) / u.qty);
    row.sales.add(u.saleId!);
    groups.set(u.offerId, row);
  }
  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h2 className="text-xl font-semibold">{t("upgrade1")}</h2>
      <p>{t("upgrade2")}</p>
      {!groups.size && <p>{t("upgrade3")}</p>}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th>{t("upgrade4")}</th>
              <th>{t("message19")}</th>
              <th>{t("upgrade5")}</th>
              <th>{t("upgrade6")}</th>
              <th>{t("upgrade7")}</th>
              <th>{t("upgrade8")}</th>
            </tr>
          </thead>
          <tbody>
            {[...groups].map(([id, r]) => (
              <tr key={id}>
                <th>
                  {r.name}
                  <small className="block">{id}</small>
                </th>
                <td>{r.sales.size}</td>
                <td>{r.units}</td>
                <td>{r.returns}</td>
                <td>{money(r.discount)}</td>
                <td>{money(r.netDiscount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>{t("upgrade9")}</p>
    </section>
  );
}
