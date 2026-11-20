"use client";
import { t } from "@/app/frontend_admin/admin_management/management_customers/utils/AdminManagementCustomersMessages";

import { Confirm } from "@/components/ui/Confirm";
import { Button } from "@/components/ui/Button";
import type {
  Customer,
  Operations,
} from "@/app/frontend_admin/admin_management/management_customers/schemas/AdminManagementCustomersOperationsSchema";
export function AdminManagementCustomersPrivacy({
  customer,
  save,
}: {
  customer: Customer;
  save: (change: (o: Operations) => void) => boolean;
}) {
  return (
    <Confirm
      title={t("upgrade1")}
      description={t("upgrade2")}
      confirmLabel={t("upgrade3")}
      cancelLabel={t("upgrade4")}
      trigger={<Button>{t("upgrade5")}</Button>}
      onConfirm={() =>
        save((o) => {
          const c = o.customers.find((x) => x.id === customer.id);
          if (!c) throw Error(t("upgrade6"));
          Object.assign(c, {
            name: "Anonymous customer",
            phone: "",
            email: "",
            preferences: "",
            consent: false,
            active: false,
          });
          o.redemptions
            .filter((x) => x.customerId === c.id)
            .forEach((x) => (x.reason = "Anonymised reward record"));
        })
      }
    />
  );
}
