"use client";
import { t } from "@/app/frontend_admin/admin_management/management_customers/utils/AdminManagementCustomersMessages";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Customer } from "@/app/frontend_admin/admin_management/management_customers/schemas/AdminManagementCustomersOperationsSchema";
export function AdminManagementCustomersEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: Partial<Customer>;
  onSave: (c: Customer) => boolean;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name || ""),
    [phone, setPhone] = useState(initial.phone || ""),
    [email, setEmail] = useState(initial.email || ""),
    [preferences, setPreferences] = useState(initial.preferences || ""),
    [consent, setConsent] = useState(initial.consent ?? false);
  return (
    <form
      className="grid gap-3 rounded-xl border border-border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (
          onSave({
            id: initial.id || crypto.randomUUID(),
            name: name.trim(),
            phone,
            email,
            preferences,
            consent,
            active: initial.active ?? true,
          })
        )
          onCancel();
      }}
    >
      <h2>{t("message1")}</h2>
      <label>
        {t("message2")}
        <input required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label>
        {t("message3")}
        <input type="tel" maxLength={30} value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      <label>
        {t("message4")}
        <input
          type="email"
          maxLength={120}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label>
        {t("message5")}
        <textarea
          maxLength={500}
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
        />
      </label>
      <label>
        <input
          required
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />{" "}
        {t("message6")}
      </label>
      <div className="flex gap-3">
        <Button type="submit">{t("message7")}</Button>
        <Button onClick={onCancel}>{t("message8")}</Button>
      </div>
    </form>
  );
}
