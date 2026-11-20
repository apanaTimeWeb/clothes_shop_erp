"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  readDocument,
  commitDocument,
  subscribeDocument,
  readSessionValue,
  subscribeSessionValue,
} from "@/lib/browser_document";
import {
  catalogueSchema,
  offersSchema,
  type Catalogue,
  type Offer,
} from "@/app/frontend_admin/admin_management/management_offers/schemas/AdminManagementOffersSchema";
import fixture from "@/app/frontend_admin/admin_management/management_offers/mocks/AdminManagementOffersFixture.json";
const key = "clothes-shop.offers.v1";
const subscribeMode = (notify: () => void) =>
  subscribeSessionValue("clothes-shop.preview.mode", () => notify());
const mode = () => readSessionValue("clothes-shop.preview.mode") || "Staff";
export function useAdminManagementOffers() {
  const [catalogue, setCatalogue] = useState<Catalogue>(
    catalogueSchema.parse(fixture),
  );
  const [offers, setOffers] = useState<Offer[]>([]),
    [error, setError] = useState(false),
    [ready, setReady] = useState(false),
    [now, setNow] = useState(0);
  const canEdit =
    useSyncExternalStore(subscribeMode, mode, () => "Customer") !== "Customer";
  useEffect(() => {
    function refresh() {
      try {
        setCatalogue(
          catalogueSchema.parse(
            JSON.parse(
              readDocument("clothes-shop.demo.next.v1") ||
                JSON.stringify(fixture),
            ),
          ),
        );
        setOffers(
          offersSchema.parse(
            JSON.parse(readDocument(key) || '{"version":1,"offers":[]}'),
          ).offers,
        );
        setError(false);
        setReady(true);
        setNow(Date.now());
      } catch {
        setReady(false);
        setOffers([]);
        setError(true);
      }
    }
    refresh();
    const a = subscribeDocument(key, refresh, refresh),
      c = subscribeDocument("clothes-shop.demo.next.v1", refresh, refresh);
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => {
      a();
      c();
      clearInterval(timer);
    };
  }, []);
  function update(offer: Offer | null, id?: string) {
    try {
      if (!canEdit) return false;
      const raw = readDocument(key);
      const current = offersSchema.parse(
        JSON.parse(raw || '{"version":1,"offers":[]}'),
      );
      const next = offersSchema.parse({
        version: 1,
        offers: [
          ...current.offers.filter((o) => o.id !== (offer?.id || id)),
          ...(offer ? [offer] : []),
        ],
      });
      commitDocument(key, raw, JSON.stringify(next));
      return true;
    } catch {
      setError(true);
      return false;
    }
  }
  return { catalogue, offers, canEdit, ready, error, now, update };
}
