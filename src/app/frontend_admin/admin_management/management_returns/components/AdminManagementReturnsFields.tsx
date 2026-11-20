"use client";
import { useAdminManagementReturns } from "@/app/frontend_admin/admin_management/management_returns/state/AdminManagementReturnsStore";
import { useTranslations } from "next-intl";
export function AdminManagementReturnsField({
  name,
  value,
  type = "text",
  required = true,
}: {
  name: string;
  value?: string | number;
  type?: string;
  required?: boolean;
}) {
  const t = useTranslations("management");
  const settings = useAdminManagementReturns((s) => s.state.settings);
  const suggestions =
    name === "fabric"
      ? settings.fabricVocabulary
      : name === "sizes"
        ? settings.sizeVocabulary
        : undefined;
  return (
    <label className="grid gap-2 text-sm">
      {t(name)}
      <input
        list={suggestions?.length ? `suggestions-${name}` : undefined}
        name={name}
        defaultValue={value}
        type={type}
        required={required}
        maxLength={type === "text" ? 2000 : undefined}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "0.01" : undefined}
      />
      {suggestions?.length ? (
        <datalist id={`suggestions-${name}`}>
          {suggestions.map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>
      ) : null}
    </label>
  );
}
export function AdminManagementReturnsSelect({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value?: string;
  options: { value: string; label: string }[];
  onChange?: (value: string) => void;
}) {
  const t = useTranslations("management");

  return (
    <label className="grid gap-2 text-sm">
      {t(name)}
      <select
        name={name}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        required
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
export function readFields(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form).entries()) as Record<
    string,
    string
  >;
}
