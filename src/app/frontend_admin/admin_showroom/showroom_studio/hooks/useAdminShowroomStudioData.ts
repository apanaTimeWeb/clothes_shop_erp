"use client";
import { studioText as t } from "@/app/frontend_admin/admin_showroom/showroom_studio/utils/AdminShowroomStudioMessages";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  readSessionValue,
  subscribeSessionValue,
  readDocument,
  commitDocument,
  subscribeDocument,
} from "@/lib/browser_document";
import {
  catalogueSchema,
  preferencesSchema,
  type Catalogue,
  type Preferences,
} from "@/app/frontend_admin/admin_showroom/showroom_studio/schemas/AdminShowroomStudioSchema";
import fixture from "@/app/frontend_admin/admin_showroom/showroom_studio/mocks/AdminShowroomStudioFixture.json";
const key = "clothes-shop.style-studio.v1";
const subscribeMode = (changed: () => void) =>
  subscribeSessionValue("clothes-shop.preview.mode", () => changed());
const getMode = () => readSessionValue("clothes-shop.preview.mode") || "Staff";
export function useAdminShowroomStudioData() {
  const [catalogue, setCatalogue] = useState<Catalogue>(
    catalogueSchema.parse(fixture),
  );
  const [preferences, setPreferences] = useState<Preferences>({});
  const mode = useSyncExternalStore(subscribeMode, getMode, () => "Customer");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    function refresh() {
      try {
        const raw = readDocument("clothes-shop.demo.next.v1");
        setCatalogue(catalogueSchema.parse(raw ? JSON.parse(raw) : fixture));
        const saved = readDocument(key);
        setPreferences(preferencesSchema.parse(saved ? JSON.parse(saved) : {}));
        setError("");
        setReady(true);
      } catch {
        setError(t("message129"));
        setReady(false);
      }
    }
    refresh();
    const a = subscribeDocument("clothes-shop.demo.next.v1", refresh, refresh);
    const c = subscribeDocument(key, refresh, refresh);
    return () => {
      a();
      c();
    };
  }, []);
  function save(productId: string, value: Preferences[string]) {
    try {
      if (mode === "Customer") throw Error(t("message130"));
      const raw = readDocument(key);
      const current = preferencesSchema.parse(raw ? JSON.parse(raw) : {});
      const next = preferencesSchema.parse({ ...current, [productId]: value });
      const encoded = JSON.stringify(next);
      if (encoded.length > 3500000) throw Error(t("message131"));
      commitDocument(key, raw, encoded);
      setPreferences(next);
      setError("");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : t("message132"));
      return false;
    }
  }
  return {
    catalogue,
    preferences,
    save,
    error,
    ready,
    canEdit: mode !== "Customer",
  };
}
