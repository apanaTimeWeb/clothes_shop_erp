"use client";
import { useTranslations } from "next-intl";
import { useAdminManagementIntake } from "@/app/frontend_admin/admin_management/management_intake/state/AdminManagementIntakeStore";
import { locationLabel } from "@/app/frontend_admin/admin_management/management_intake/state/AdminManagementIntakeTransactions";
import { Button } from "@/components/ui/Button";
export type AdminManagementStockRow = {
  colour: string;
  size: string;
  locationId: string;
  qty: number;
};
export function AdminManagementIntakeMatrix({
  rows,
  setRows,
  setDirty,
}: {
  rows: AdminManagementStockRow[];
  setRows: (rows: AdminManagementStockRow[]) => void;
  setDirty: (dirty: boolean) => void;
}) {
  const t = useTranslations("management"),
    state = useAdminManagementIntake((s) => s.state);
  return (
    <div className="space-y-3">
      <p>{t("matrixInstructions")}</p>
      <label className="grid gap-1">
        {t("allRowsLocation")}
        <select
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) {
              setRows(rows.map((r) => ({ ...r, locationId: e.target.value })));
              setDirty(true);
            }
          }}
        >
          <option value="">{t("selectLocation")}</option>
          {state.locations
            .filter((l) => l.active)
            .map((l) => (
              <option key={l.id} value={l.id}>
                {locationLabel(state, l.id)}
              </option>
            ))}
        </select>
      </label>
      <div className="max-h-96 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th>{t("colour")}</th>
              <th>{t("sizes")}</th>
              <th>{t("quantity")}</th>
              <th>{t("source")}</th>
              <th>{t("splitBox")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.colour}</td>
                <td>{r.size}</td>
                <td>
                  <input
                    aria-label={`${r.colour} ${r.size} ${t("quantity")}`}
                    className="w-24"
                    type="number"
                    min="0"
                    max="100000"
                    step="1"
                    value={Number.isNaN(r.qty) ? "" : r.qty}
                    onChange={(e) => {
                      setRows(
                        rows.map((row, n) =>
                          n === i
                            ? {
                                ...row,
                                qty:
                                  e.target.value === ""
                                    ? NaN
                                    : Number(e.target.value),
                              }
                            : row,
                        ),
                      );
                      setDirty(true);
                    }}
                  />
                </td>
                <td>
                  <select
                    aria-label={`${r.colour} ${r.size} ${t("source")}`}
                    value={r.locationId}
                    onChange={(e) => {
                      setRows(
                        rows.map((row, n) =>
                          n === i
                            ? { ...row, locationId: e.target.value }
                            : row,
                        ),
                      );
                      setDirty(true);
                    }}
                  >
                    <option value="">{t("selectLocation")}</option>
                    {state.locations
                      .filter((l) => l.active)
                      .map((l) => (
                        <option key={l.id} value={l.id}>
                          {locationLabel(state, l.id)}
                        </option>
                      ))}
                  </select>
                </td>
                <td>
                  <Button onClick={() => setRows([...rows, { ...r, qty: 0 }])}>
                    {t("splitBox")}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
