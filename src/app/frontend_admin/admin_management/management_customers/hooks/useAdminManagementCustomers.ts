"use client";
import { t } from "@/app/frontend_admin/admin_management/management_customers/utils/AdminManagementCustomersMessages";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  readDocument,
  commitDocuments,
  subscribeDocument,
  readSessionValue,
  subscribeSessionValue,
} from "@/lib/browser_document";
import { demoSchema } from "@/app/frontend_admin/admin_management/management_customers/schemas/AdminManagementCustomersSnapshotSchema";
import {
  operationsSchema,
  emptyOperations,
  type Operations,
} from "@/app/frontend_admin/admin_management/management_customers/schemas/AdminManagementCustomersOperationsSchema";
import type { AdminManagementCustomersState } from "@/app/frontend_admin/admin_management/management_customers/types/AdminManagementCustomersTypes";
import fixture from "@/app/frontend_admin/admin_management/management_customers/mocks/AdminManagementCustomersFixture.json";
const shopKey = "clothes-shop.demo.next.v1",
  opsKey = "clothes-shop.operations.v1";
const subscribeMode = (changed: () => void) =>
  subscribeSessionValue("clothes-shop.preview.mode", () => changed());
const getMode = () => readSessionValue("clothes-shop.preview.mode") || "Staff";
export function useAdminManagementCustomers() {
  const [now, setNow] = useState(0);
  const [shop, setShop] = useState<AdminManagementCustomersState>(demoSchema.parse(fixture)),
    [ops, setOps] = useState<Operations>(emptyOperations),
    [error, setError] = useState(""),
    [ready, setReady] = useState(false);
  const canEdit = useSyncExternalStore(subscribeMode, getMode, () => "Customer") !== "Customer";
  useEffect(() => {
    function load() {
      try {
        setShop(demoSchema.parse(JSON.parse(readDocument(shopKey) || JSON.stringify(fixture))));
        setOps(
          operationsSchema.parse(
            JSON.parse(readDocument(opsKey) || JSON.stringify(emptyOperations)),
          ),
        );
        setReady(true);
        setNow(Date.now());
        setError("");
      } catch {
        setReady(false);
        setError(t("message43"));
      }
    }
    load();
    const a = subscribeDocument(shopKey, load, load),
      b = subscribeDocument(opsKey, load, load);
    return () => {
      a();
      b();
    };
  }, []);
  function save(change: (shop: AdminManagementCustomersState, ops: Operations) => void) {
    try {
      if (!canEdit) throw Error(t("message39"));
      const rawShop = readDocument(shopKey),
        rawOps = readDocument(opsKey);
      const nextShop = demoSchema.parse(JSON.parse(rawShop || JSON.stringify(fixture)));
      const nextOps = operationsSchema.parse(JSON.parse(rawOps || JSON.stringify(emptyOperations)));
      change(nextShop, nextOps);
      const valid = operationsSchema.parse(nextOps);
      if (
        valid.saleLinks.some((l) => !nextShop.sales.some((s) => s.id === l.saleId)) ||
        valid.purchases.some((p) =>
          p.lines.some(
            (l) =>
              !nextShop.variants.some((v) => v.id === l.variantId) ||
              !nextShop.locations.some((x) => x.id === l.locationId),
          ),
        )
      )
        throw Error(t("message40"));
      commitDocuments([
        {
          key: shopKey,
          expected: rawShop,
          value: JSON.stringify(demoSchema.parse(nextShop)),
        },
        { key: opsKey, expected: rawOps, value: JSON.stringify(valid) },
      ]);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : t("message41"));
      return false;
    }
  }
  return { shop, ops, ready, error, canEdit, save, now };
}
