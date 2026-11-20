"use client";
import { t } from "@/app/frontend_admin/admin_management/management_purchases/utils/AdminManagementPurchasesMessages";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Supplier } from "@/app/frontend_admin/admin_management/management_purchases/schemas/AdminManagementPurchasesOperationsSchema";
export function AdminManagementPurchasesSupplier({
  initial,
  onSave,
  onCancel,
}: {
  initial: Partial<Supplier>;
  onSave: (s: Supplier) => boolean;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name || ""),
    [phone, setPhone] = useState(initial.phone || ""),
    [email, setEmail] = useState(initial.email || ""),
    [notes, setNotes] = useState(initial.notes || "");
  return (
    <form
      className="grid gap-3 rounded-xl border border-border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (
          onSave({
            id: initial.id || crypto.randomUUID(),
            name: name.trim(),
            phone,
            email,
            notes,
            active: initial.active ?? true,
          })
        )
          onCancel();
      }}
    >
      <h2>{t("message40")}</h2>
      <label>
        {t("message41")}
        <input required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label>
        {t("message42")}
        <input type="tel" maxLength={30} value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      <label>
        {t("message43")}
        <input
          type="email"
          maxLength={120}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label>
        {t("message44")}
        <textarea maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <div className="flex gap-3">
        <Button type="submit">{t("message45")}</Button>
        <Button onClick={onCancel}>{t("message18")}</Button>
      </div>
    </form>
  );
}
