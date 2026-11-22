"use client";
import {
  useAdminManagementCatalogueUnsaved,
  requestDiscard,
} from "@/app/frontend_admin/admin_management/management_catalogue/hooks/useAdminManagementCatalogueUnsaved";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminManagementCatalogue } from "@/app/frontend_admin/admin_management/management_catalogue/state/AdminManagementCatalogueStore";
import { moneyInput } from "@/app/frontend_admin/admin_management/management_catalogue/utils/AdminManagementCatalogueAmounts";
import { Button } from "@/components/ui/Button";
import { Confirm } from "@/components/ui/Confirm";
import {
  AdminManagementCatalogueField as Field,
  readFields,
} from "@/app/frontend_admin/admin_management/management_catalogue/components/AdminManagementCatalogueFields";
import { AdminManagementCatalogueVariantPrice } from "@/app/frontend_admin/admin_management/management_catalogue/components/AdminManagementCatalogueVariantPrice";
export function AdminManagementCatalogueCatalogue() {
  const t = useTranslations("management"),
    { state, dispatch, notify, stale } = useAdminManagementCatalogue(),
    [id, setId] = useState(""),
    [query, setQuery] = useState("");
  const { dirty, setDirty } = useAdminManagementCatalogueUnsaved(t("unsaved"));
  const [formError, setFormError] = useState("");
  const product = state.products.find((p) => p.id === id),
    variants = state.variants.filter((v) => v.productId === id);
  return (
    <div className="space-y-5">
      <div className="flex items-end gap-2">
        <label className="grow grid gap-1">
          {t("search")}
          <input className="w-full" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        {query && (
          <Button
            type="button"
            className="min-h-10 px-3 text-xs"
            onClick={() => setQuery("")}
          >
            Clear ✕
          </Button>
        )}
      </div>
      <div className="flex items-end gap-2">
        <label className="grow grid gap-1">
          {t("selectDesign")}
          <select
            value={id}
            onChange={(e) => {
              if (requestDiscard()) {
                setId(e.target.value);
                setFormError("");
              }
            }}
          >
            <option value="">{t("newDesign")}</option>
            {state.products
              .filter(
                (p) =>
                  p.id === id ||
                  ` ${p.name} ${p.designCode}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
              )
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.designCode} · {p.name} ({p.status})
                </option>
              ))}
          </select>
        </label>
        {id && (
          <Button
            type="button"
            className="min-h-10 px-3 text-xs whitespace-nowrap"
            onClick={() => {
              if (requestDiscard()) {
                setId("");
                setFormError("");
              }
            }}
          >
            + {t("newDesign")}
          </Button>
        )}
      </div>
      {formError && (
        <p
          role="alert"
          className="whitespace-pre-wrap rounded bg-warning-bg p-3 text-warning"
        >
          {formError}
        </p>
      )}
      {dirty && <p className="text-sm text-warning">{t("unsavedHint")}</p>}
      <form
        key={id}
        onChange={() => setDirty(true)}
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const f = readFields(e.currentTarget);
          setFormError("");
          try {
            const saved = dispatch({
              type: "manage-product",
              data: {
                operation: {
                  ...f,
                  id: id || undefined,
                  defaultPricePaise: moneyInput(f.defaultPricePaise),
                  costPricePaise: moneyInput(f.costPricePaise),
                  colours: f.colours
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  sizes: f.sizes
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                },
              },
            });
            if (saved) setDirty(false);
            else setFormError(useAdminManagementCatalogue.getState().notice);
            if (saved && !id)
              setId(
                useAdminManagementCatalogue.getState().state.products.at(-1)!
                  .id,
              );
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Invalid values";
            setFormError(message);
            notify(message);
          }
        }}
      >
        {(
          [
            "designCode",
            "name",
            "fabric",
            "sleeve",
            "collar",
            "fit",
            "pattern",
            "description",
          ] as const
        ).map((k) => (
          <Field
            key={k}
            name={k}
            value={
              product?.[k] ?? (k === "sleeve" || k === "collar" ? "N/A" : "")
            }
            required={k !== "description"}
          />
        ))}
        {(["departmentId", "categoryId"] as const).map((k) => (
          <label key={k} className="grid gap-2">
            {t(k)}
            <select name={k} defaultValue={product?.[k]}>
              {state[k === "departmentId" ? "departments" : "categories"].map(
                (v) => (
                  <option key={v}>{v}</option>
                ),
              )}
            </select>
          </label>
        ))}
        <Field
          name="defaultPricePaise"
          value={(product?.defaultPricePaise ?? 0) / 100}
          type="number"
        />
        <Field
          name="costPricePaise"
          value={(product?.costPricePaise ?? 0) / 100}
          type="number"
        />
        <Field
          name="colours"
          value={[...new Set(variants.map((v) => v.colour))].join(", ")}
        />
        <Field
          name="sizes"
          value={[...new Set(variants.map((v) => v.sizeCode))].join(", ")}
        />
        <Field name="sizeSystem" value={variants[0]?.sizeSystem ?? "Alpha"} />
        <Field name="packUnit" value={variants[0]?.packUnit ?? "piece"} />
        <p className="text-xs text-secondary sm:col-span-2">
          {t("matrixNote")}
        </p>
        <Button disabled={stale} type="submit">
          {t(product ? "save" : "create")}
        </Button>
      </form>
      {product && (
        <Confirm
          title={t("confirm")}
          description={t("archiveNote")}
          confirmLabel={t("confirm")}
          cancelLabel={t("cancel")}
          trigger={
            <Button disabled={stale}>
              {t(product.status === "active" ? "archive" : "restore")}
            </Button>
          }
          onConfirm={() =>
            dispatch({
              type: "manage-archive",
              data: {
                operation: {
                  id,
                  kind: "product",
                  archived: product.status === "active",
                },
              },
            })
          }
        />
      )}
      <h2 className="text-xl font-semibold">{t("variants")}</h2>
      <div className="max-h-96 overflow-auto">
        {variants.map((v) => (
          <div
            key={v.id}
            className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-3"
          >
            <span>
              {v.sku} · {v.colour} / {v.sizeCode} · {v.status}
            </span>
            <AdminManagementCatalogueVariantPrice id={v.id} />
            <Confirm
              title={t("confirm")}
              description={t("archiveNote")}
              confirmLabel={t("confirm")}
              cancelLabel={t("cancel")}
              trigger={
                <Button disabled={stale}>
                  {t(v.status === "active" ? "archive" : "restore")}
                </Button>
              }
              onConfirm={() =>
                dispatch({
                  type: "manage-archive",
                  data: {
                    operation: {
                      id: v.id,
                      kind: "variant",
                      archived: v.status === "active",
                    },
                  },
                })
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
