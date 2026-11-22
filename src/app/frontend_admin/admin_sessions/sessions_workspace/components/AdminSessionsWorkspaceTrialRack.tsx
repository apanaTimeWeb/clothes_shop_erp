"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Plus, X, Shirt, ArrowRight } from "lucide-react";
import { useAdminSessionsWorkspace } from "@/app/frontend_admin/admin_sessions/sessions_workspace/state/AdminSessionsWorkspaceStore";
import { getTrialRack, removeFromTrialRack, clearTrialRack, type StoreGarmentItem } from "@/lib/trial_rack";
import { resolveCatalogueProductImage } from "@/lib/product_images";
import { ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/Button";

export function AdminSessionsWorkspaceTrialRack() {
  const { state, dispatch, notify, stale } = useAdminSessionsWorkspace();
  const [items, setItems] = useState<StoreGarmentItem[]>(() => getTrialRack());

  useEffect(() => {
    const handleUpdate = () => setItems(getTrialRack());
    window.addEventListener("trial-rack-changed", handleUpdate);
    return () => window.removeEventListener("trial-rack-changed", handleUpdate);
  }, []);

  const handleImportAll = () => {
    if (!state.activeSessionId) {
      dispatch({ type: "session-new" });
    }
    let addedCount = 0;
    for (const item of items) {
      // Find matching variant
      const matchingVariant =
        state.variants.find((v) => v.productId === item.id && v.colour === item.defaultColour && v.status === "active") ||
        state.variants.find((v) => v.productId === item.id && v.status === "active");

      if (matchingVariant) {
        dispatch({
          type: "shortlist-add",
          data: { variantId: matchingVariant.id, qty: 1 },
        });
        addedCount++;
      }
    }
    notify(`Imported ${addedCount} garments from Trial Rack into Shortlist!`);
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-foreground">🛍️ Customer Trial Rack</span>
          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={ROUTES.studio}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Sparkles size={14} />
            <span>Open Style Studio</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Garments shortlisted from the Digital Showroom catalogue or tried on in the Virtual Studio persist in this rack.
      </p>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-subtle/40 p-6 text-center">
          <Shirt className="mx-auto text-muted-foreground mb-2" size={26} />
          <p className="text-xs text-muted-foreground">The customer trial rack is currently empty.</p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <Link
              href={ROUTES.showroom}
              className="rounded-lg bg-card border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-subtle transition-colors"
            >
              Browse Catalogue →
            </Link>
            <Link
              href={ROUTES.studio}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Try in Studio →
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => {
              const prod = state.products.find((p) => p.id === item.id);
              const imgSrc = resolveCatalogueProductImage(item.id, item.name, prod?.categoryId, item.defaultColour);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-subtle/50 p-2.5"
                >
                  <Image
                    src={imgSrc}
                    alt={item.name}
                    width={48}
                    height={48}
                    className="size-12 shrink-0 rounded-md object-contain bg-card border border-border p-0.5"
                    onError={(e) => { e.currentTarget.src = "/images/real-shirt-white.png"; }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.defaultColour} · {item.category}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromTrialRack(item.id)}
                    className="p-1.5 text-muted-foreground hover:text-danger rounded-md hover:bg-card transition-colors"
                    title="Remove from trial rack"
                    aria-label={`Remove ${item.name}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
            <Button
              disabled={stale || items.length === 0}
              onClick={handleImportAll}
              className="bg-brand text-on-primary hover:bg-brand-hover text-xs flex items-center gap-1.5 min-h-9"
            >
              <Plus size={15} />
              <span>Import All into Shortlist ({items.length})</span>
            </Button>
            <Button
              disabled={stale || items.length === 0}
              onClick={() => clearTrialRack()}
              className="text-xs min-h-9"
            >
              Clear Rack
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}