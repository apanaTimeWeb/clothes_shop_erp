"use client";
import { useEffect } from "react";
import { LocaleProvider } from "@/components/ui/LocaleProvider";
import {
  useAdminBillingCheckout,
  connectAdminBillingCheckout,
} from "@/app/frontend_admin/admin_billing/billing_checkout/state/AdminBillingCheckoutStore";
import messages from "@/app/frontend_admin/admin_billing/billing_checkout/locales/admin_billing_checkout_en.json";
export default function AdminBillingCheckoutLayout({ children }: { children: React.ReactNode }) {
  const ready = useAdminBillingCheckout((s) => s.ready);
  useEffect(() => connectAdminBillingCheckout(), []);
  if (!ready)
    return (
      <div className="min-h-64 p-6" role="status">
        Loading local demo…
      </div>
    );
  return (
    <LocaleProvider messages={{ billing: messages, billingPos: messages.pos }}>
      {children}
    </LocaleProvider>
  );
}
