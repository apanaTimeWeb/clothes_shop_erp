"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminManagementIntake } from "@/app/frontend_admin/admin_management/management_intake/state/AdminManagementIntakeStore";
import {
  useAdminManagementIntakeUnsaved,
  requestDiscard,
} from "@/app/frontend_admin/admin_management/management_intake/hooks/useAdminManagementIntakeUnsaved";
import { moneyInput } from "@/app/frontend_admin/admin_management/management_intake/utils/AdminManagementIntakeAmounts";
import { productInput } from "@/app/frontend_admin/admin_management/management_intake/schemas/AdminManagementIntakeInputSchema";
import { locationLabel } from "@/app/frontend_admin/admin_management/management_intake/state/AdminManagementIntakeTransactions";
import {
  AdminManagementIntakePhotoPicker,
  type AdminManagementIntakePhoto,
} from "@/app/frontend_admin/admin_management/management_intake/components/AdminManagementIntakePhotoPicker";
import { Button } from "@/components/ui/Button";
import { Confirm } from "@/components/ui/Confirm";
import { AdminManagementIntakeMatrix } from "@/app/frontend_admin/admin_management/management_intake/components/AdminManagementIntakeMatrix";
const split = (text: string) =>
  text
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
import { intakeDefaults as base } from "@/app/frontend_admin/admin_management/management_intake/config/AdminManagementIntakeDefaults";

type Row = { colour: string; size: string; locationId: string; qty: number };
export function AdminManagementIntakeIntake() {
  const t = useTranslations("management"),
    { state, dispatch, stale } = useAdminManagementIntake();
  const [step, setStep] = useState(0),
    [id, setId] = useState(""),
    [fields, setFields] = useState(base),
    [rows, setRows] = useState<Row[]>([]),
    [photos, setPhotos] = useState<AdminManagementIntakePhoto[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const { setDirty } = useAdminManagementIntakeUnsaved(t("unsaved"));
  const steps = [
    "intakeDetails",
    "intakePhotos",
    "intakeMatrix",
    "intakeReview",
  ];
  function product() {
    return productInput.parse({
      ...fields,
      id: id || undefined,
      colours: split(fields.colours),
      sizes: split(fields.sizes),
      defaultPricePaise: moneyInput(fields.defaultPricePaise),
      costPricePaise: moneyInput(fields.costPricePaise),
    });
  }
  function next() {
    try {
      const data = product();
      if (step === 1) {
        const matrix = data.colours.flatMap((colour) =>
          data.sizes.map((size) => ({
            colour,
            size,
            qty: 0,
            locationId: state.locations.find((l) => l.active)?.id ?? "",
          })),
        );
        setRows(
          matrix.flatMap((r) => {
            const existing = rows.filter(
              (old) => old.colour === r.colour && old.size === r.size,
            );
            return existing.length ? existing : [r];
          }),
        );
      }
      if (
        step === 2 &&
        rows.some(
          (r) =>
            !Number.isSafeInteger(r.qty) ||
            r.qty < 0 ||
            r.qty > 100000 ||
            (r.qty > 0 && !r.locationId),
        )
      )
        throw new Error(t("invalidMatrix"));
      setError("");
      setStep(step + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("invalidMatrix"));
    }
  }
  function choose(value: string) {
    if (!requestDiscard()) return;
    setId(value);
    setRows([]);
    setPhotos([]);
    setError("");
    const p = state.products.find((p) => p.id === value),
      vs = state.variants.filter(
        (v) => v.productId === value && v.status === "active",
      );
    setFields(
      p
        ? {
            ...base,
            ...Object.fromEntries(
              Object.keys(base)
                .filter((k) => k in p)
                .map((k) => [k, String(p[k as keyof typeof p])]),
            ),
            defaultPricePaise: String(p.defaultPricePaise / 100),
            costPricePaise: String((p.costPricePaise ?? 0) / 100),
            colours: [...new Set(vs.map((v) => v.colour))].join(", "),
            sizes: [...new Set(vs.map((v) => v.sizeCode))].join(", "),
            sizeSystem: vs[0]?.sizeSystem ?? "Alpha",
            packUnit: vs[0]?.packUnit ?? "piece",
          }
        : base,
    );
  }
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">{t("intake")}</h2>
      <ol className="flex flex-wrap gap-3">
        {steps.map((s, i) => (
          <li
            key={s}
            aria-current={i === step ? "step" : undefined}
            className={
              i === step ? "font-semibold text-brand" : "text-secondary"
            }
          >
            {i + 1}. {t(s)}
          </li>
        ))}
      </ol>
      <p className="text-sm text-secondary">{t("intakeNote")}</p>
      {error && (
        <p role="alert" className="whitespace-pre-wrap text-danger">
          {error}
        </p>
      )}
      {step === 0 && (
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            next();
          }}
        >
          <label className="grid gap-1 sm:col-span-2">
            {t("selectDesign")}
            <select value={id} onChange={(e) => choose(e.target.value)}>
              <option value="">{t("newDesign")}</option>
              {state.products
                .filter((p) => p.status === "active")
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.designCode} · {p.name}
                  </option>
                ))}
            </select>
          </label>
          {Object.keys(base).map((k) => {
            const key = k as keyof typeof base;
            const options =
              key === "departmentId"
                ? state.departments
                : key === "categoryId"
                  ? state.categories
                  : null;
            return (
              <label className="grid gap-1" key={key}>
                {t(key)}
                {options ? (
                  <select
                    value={fields[key]}
                    onChange={(e) => {
                      setFields({ ...fields, [key]: e.target.value });
                      setDirty(true);
                    }}
                  >
                    {options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    required={key !== "description"}
                    type={key.endsWith("Paise") ? "number" : "text"}
                    min="0"
                    step="0.01"
                    value={fields[key]}
                    onChange={(e) => {
                      setFields({ ...fields, [key]: e.target.value });
                      setDirty(true);
                    }}
                  />
                )}
              </label>
            );
          })}
          <Button type="submit">{t("continue")}</Button>
        </form>
      )}
      {step === 1 && (
        <AdminManagementIntakePhotoPicker
          colours={split(fields.colours)}
          onBusyChange={setBusy}
          photos={photos}
          onChange={(p) => {
            setPhotos(p);
            setDirty(true);
          }}
        />
      )}
      {step === 2 && (
        <AdminManagementIntakeMatrix
          rows={rows}
          setRows={setRows}
          setDirty={setDirty}
        />
      )}
      {step === 3 && (
        <section className="rounded-xl bg-subtle p-5 space-y-3">
          <h3 className="font-semibold">
            {fields.designCode} · {fields.name}
          </h3>
          <p>
            {fields.departmentId} / {fields.categoryId} · {fields.fabric} · ₹
            {fields.defaultPricePaise}
          </p>
          <p>
            {t("reviewTotals", {
              variants:
                split(fields.colours).length * split(fields.sizes).length,
              units: rows.reduce((n, r) => n + r.qty, 0),
              photos: photos.length,
            })}
          </p>
          <div className="max-h-64 overflow-auto">
            {rows
              .filter((r) => r.qty > 0)
              .map((r, i) => (
                <p key={i}>
                  {r.colour} / {r.size} × {r.qty} →{" "}
                  {locationLabel(state, r.locationId)}
                </p>
              ))}
          </div>
          <Confirm
            title={t("confirmIntake")}
            description={t("intakeNote")}
            confirmLabel={t("save")}
            cancelLabel={t("cancel")}
            trigger={<Button disabled={stale}>{t("confirmIntake")}</Button>}
            onConfirm={() => {
              try {
                if (
                  dispatch({
                    type: "manage-intake",
                    data: {
                      operation: { product: product(), rows, images: photos },
                    },
                  })
                ) {
                  setDirty(false);
                  setStep(0);
                  setId("");
                  setFields(base);
                  setRows([]);
                  setPhotos([]);
                  setError("");
                } else setError(useAdminManagementIntake.getState().notice);
              } catch (e) {
                setError(e instanceof Error ? e.message : t("invalidMatrix"));
              }
            }}
          />
        </section>
      )}
      <div className="flex gap-3">
        {step > 0 && (
          <Button disabled={busy} onClick={() => setStep(step - 1)}>
            {t("back")}
          </Button>
        )}
        {step > 0 && step < 3 && (
          <Button disabled={busy} onClick={next}>
            {t("continue")}
          </Button>
        )}
      </div>
    </div>
  );
}
