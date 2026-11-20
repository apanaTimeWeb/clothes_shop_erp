"use client";
import { useEffect } from "react";
import { LocaleProvider } from "@/components/ui/LocaleProvider";
import {
  useAdminManagementVocabulary,
  connectAdminManagementVocabulary,
} from "@/app/frontend_admin/admin_management/management_vocabulary/state/AdminManagementVocabularyStore";
import messages from "@/app/frontend_admin/admin_management/management_vocabulary/locales/admin_management_vocabulary_en.json";

export default function AdminManagementVocabularyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ready = useAdminManagementVocabulary((s) => s.ready),
    mode = useAdminManagementVocabulary((s) => s.mode);
  useEffect(() => connectAdminManagementVocabulary(), []);
  if (!ready)
    return (
      <div className="min-h-64 p-6" role="status">
        Loading local demo…
      </div>
    );
  return (
    <LocaleProvider messages={{ management: messages }}>
      {mode === "Admin" ? (
        children
      ) : (
        <p className="rounded-xl border border-border bg-card p-6">
          {messages.adminOnly}
        </p>
      )}
    </LocaleProvider>
  );
}
