"use client";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { Preferences } from "@/app/frontend_admin/admin_showroom/showroom_studio/schemas/AdminShowroomStudioSchema";
type Row = Preferences[string]["measurements"][number];
export function AdminShowroomStudioSizeGuide({
  canEdit,
  sizes,
  rows,
  onSave,
}: {
  canEdit: boolean;
  sizes: string[];
  rows: Row[];
  onSave: (rows: Row[]) => boolean;
}) {
  const t = useTranslations("studio");
  const [unit, setUnit] = useState("cm"),
    [body, setBody] = useState({ chest: "", waist: "" }),
    [ease, setEase] = useState("6");
  const [draft, setDraft] = useState<Row[]>(rows),
    [message, setMessage] = useState("");

  useEffect(() => {
    setDraft(rows);
  }, [rows]);
  const factor = unit === "in" ? 2.54 : 1;
  const valid =
    Number(body.chest) > 0 &&
    Number(body.waist) > 0 &&
    Number(ease) >= 0 &&
    ease !== "" &&
    Number(ease) * factor <= 30 &&
    Number(body.chest) * factor <= 300 &&
    Number(body.waist) * factor <= 300;
  const matches = valid
    ? rows
        .filter(
          (r) =>
            sizes.includes(r.size) &&
            r.chest >= Number(body.chest) * factor + Number(ease) * factor &&
            r.waist >= Number(body.waist) * factor + Number(ease) * factor,
        )
        .sort((a, b) => a.chest - b.chest || a.waist - b.waist)
    : [];
  function update(
    size: string,
    field: "chest" | "waist" | "length",
    value: string,
  ) {
    const existing = draft.find((r) => r.size === size) ?? {
      size,
      chest: 0,
      waist: 0,
      length: 0,
    };
    setDraft([
      ...draft.filter((r) => r.size !== size),
      { ...existing, [field]: Number(value) },
    ]);
  }
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{t("message098")}</h2>
      <p>{t("message099")}</p>
      <label>
        {t("message100")}
        {t("message005")}
        <select
          value={unit}
          onChange={(e) => {
            setUnit(e.target.value);
            setBody({ chest: "", waist: "" });
            setEase(e.target.value === "in" ? "2.4" : "6");
          }}
        >
          <option value="cm">{t("message101")}</option>
          <option value="in">{t("message102")}</option>
        </select>
      </label>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <caption>
              {t("message103")}
              {unit}
              {t("message104")}
            </caption>
            <thead>
              <tr>
                <th>{t("message105")}</th>
                <th>{t("message106")}</th>
                <th>{t("message107")}</th>
                <th>{t("message108")}</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((r) => sizes.includes(r.size))
                .map((r) => (
                  <tr key={r.size}>
                    <th>{r.size}</th>
                    <td>{(r.chest / factor).toFixed(1)}</td>
                    <td>{(r.waist / factor).toFixed(1)}</td>
                    <td>{(r.length / factor).toFixed(1)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>{t("message109")}</p>
      )}
      <div className="flex flex-wrap gap-4">
        {(["chest", "waist"] as const).map((field) => (
          <label key={field}>
            {t("message110")}
            {field === "chest" ? t("bodyChest") : t("bodyWaist")}
            {t("message111")}
            {unit}
            {t("message104")}
            <input
              type="number"
              min="1"
              max={300 / factor}
              step="0.1"
              value={body[field]}
              onChange={(e) => setBody({ ...body, [field]: e.target.value })}
            />
          </label>
        ))}
        <label>
          {t("message112")}
          {unit}
          {t("message104")}
          <input
            type="number"
            min="0"
            max={30 / factor}
            step="0.1"
            value={ease}
            onChange={(e) => setEase(e.target.value)}
          />
        </label>
      </div>
      <p aria-live="polite">
        {!valid
          ? t("message113")
          : matches.length
            ? t("message114", { p0: matches[0].size })
            : t("message115")}
      </p>
      {canEdit && (
        <details>
          <summary>{t("message116")}</summary>
          <p>{t("message117")}</p>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>{t("message105")}</th>
                  <th>{t("message118")}</th>
                  <th>{t("message119")}</th>
                  <th>{t("message120")}</th>
                  <th>{t("message121")}</th>
                </tr>
              </thead>
              <tbody>
                {sizes.map((size) => (
                  <tr key={size}>
                    <th>{size}</th>
                    {(["chest", "waist", "length"] as const).map((field) => (
                      <td key={field}>
                        <input
                          aria-label={t("message122", { p0: size, p1: field })}
                          type="number"
                          min="1"
                          max="300"
                          step="0.1"
                          value={
                            draft.find((r) => r.size === size)?.[field] || ""
                          }
                          onChange={(e) => update(size, field, e.target.value)}
                        />
                      </td>
                    ))}
                    <td>
                      <Button
                        onClick={() =>
                          setDraft(draft.filter((r) => r.size !== size))
                        }
                      >
                        {t("message121")}
                        {size}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            onClick={() => {
              const next = draft.filter((r) => sizes.includes(r.size));
              if (
                next.some(
                  (r) =>
                    ![r.chest, r.waist, r.length].every(
                      (v) => Number.isFinite(v) && v > 0 && v <= 300,
                    ),
                )
              ) {
                setMessage(t("message123"));
                return;
              }
              setMessage(onSave(next) ? t("message124") : t("message125"));
            }}
          >
            {t("message126")}
          </Button>
          <p role="status">{message}</p>
        </details>
      )}
    </section>
  );
}
