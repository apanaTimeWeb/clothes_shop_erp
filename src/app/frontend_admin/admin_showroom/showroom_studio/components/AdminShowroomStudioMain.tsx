"use client";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAdminShowroomStudioData } from "@/app/frontend_admin/admin_showroom/showroom_studio/hooks/useAdminShowroomStudioData";
import { AdminShowroomStudioAngles } from "@/app/frontend_admin/admin_showroom/showroom_studio/components/AdminShowroomStudioAngles";
import { AdminShowroomStudioColours } from "@/app/frontend_admin/admin_showroom/showroom_studio/components/AdminShowroomStudioColours";
import { AdminShowroomStudioSizeGuide } from "@/app/frontend_admin/admin_showroom/showroom_studio/components/AdminShowroomStudioSizeGuide";
import { AdminShowroomStudioAssets } from "@/app/frontend_admin/admin_showroom/showroom_studio/components/AdminShowroomStudioAssets";
import { AdminShowroomStudioPreview } from "@/app/frontend_admin/admin_showroom/showroom_studio/components/AdminShowroomStudioPreview";
import { AdminShowroomStudioBackup } from "@/app/frontend_admin/admin_showroom/showroom_studio/components/AdminShowroomStudioBackup";
import {
  detectGarmentCategory,
  resolveGarmentCutoutSrc,
} from "@/app/frontend_admin/admin_showroom/showroom_studio/utils/AdminShowroomStudioPhoto";

export function AdminShowroomStudioMain() {
  const t = useTranslations("studio");
  const { catalogue, preferences, save, error, ready, canEdit } =
    useAdminShowroomStudioData();
  const searchParams = useSearchParams();
  const paramProduct = searchParams.get("product") || "";
  const paramColour = searchParams.get("colour") || "";
  const [productId, setProductId] = useState(paramProduct);
  const [colour, setColour] = useState(paramColour);

  useEffect(() => {
    if (paramProduct) setProductId(paramProduct);
    if (paramColour) setColour(paramColour);
  }, [paramProduct, paramColour]);
  const products = catalogue.products.filter((p) => p.status === "active");
  const product = products.find((p) => p.id === productId) ?? products[0];

  if (!ready)
    return (
      <div>
        <p role="status">{error || t("message053")}</p>
        {canEdit && <AdminShowroomStudioBackup />}
      </div>
    );
  if (!product) return <p>{t("message054")}</p>;

  const variants = catalogue.variants.filter(
    (v) => v.productId === product.id && v.status === "active",
  );
  const colours = [...new Set(variants.map((v) => v.colour))];
  const selected = colour || (colours[0] ?? "Black");
  const images = catalogue.images.filter((i) => i.productId === product.id);
  const settings = preferences[product.id] ?? {
    order: [],
    measurements: [],
    overlays: {},
  };

  const productCategory = detectGarmentCategory(
    (product as { categoryId?: string }).categoryId,
  );
  const { src: cutoutSrc, isRealPhoto } = resolveGarmentCutoutSrc(
    (product as { categoryId?: string }).categoryId || "",
    selected,
    product.name,
    settings.overlays[selected],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/frontend_admin/admin_showroom/showroom_catalogue"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-subtle transition-all shadow-sm active:scale-95"
          >
            <span>←</span>
            <span>{t("message055")}</span>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{t("message056")}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("message057")}</p>
          </div>
        </div>
        {canEdit && <AdminShowroomStudioBackup />}
      </div>
      {error && (
        <p role="alert" className="text-danger text-sm font-medium">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-subtle/50 p-4">
        <label className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs font-medium text-foreground">
          <span>{t("message058")}</span>
          <select
            value={product.id}
            onChange={(e) => {
              setProductId(e.target.value);
              setColour("");
            }}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs font-medium text-foreground">
          <span>{t("message059")}</span>
          <select
            value={selected}
            onChange={(e) => setColour(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from(new Set([...colours, selected])).filter(Boolean).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <AdminShowroomStudioAngles
        canEdit={canEdit}
        key={"angles-" + product.id}
        images={images.filter((i) => i.colour === selected || !i.colour)}
        order={settings.order}
        onOrder={(order) => save(product.id, { ...settings, order })}
      />
      {canEdit && (
        <AdminShowroomStudioAssets
          key={"assets-" + product.id}
          colour={selected}
          src={settings.overlays[selected]}
          onSave={(src) =>
            save(product.id, {
              ...settings,
              overlays: { ...settings.overlays, [selected]: src },
            })
          }
        />
      )}
      <AdminShowroomStudioPreview
        key="showroom-studio-preview"
        src={settings.overlays[selected]}
        autoCutoutSrc={cutoutSrc}
        isRealPhoto={isRealPhoto}
        productCategory={productCategory}
        productName={product.name}
        colour={selected}
        products={products.map((p) => ({ id: p.id, name: p.name }))}
        productId={product.id}
        onSelectProduct={(id) => {
          setProductId(id);
          setColour("");
        }}
        colours={colours}
        onSelectColour={(c) => setColour(c)}
      />
      <AdminShowroomStudioSizeGuide
        canEdit={canEdit}
        key={"sizeguide-" + product.id}
        sizes={[...new Set(variants.map((v) => v.sizeCode))]}
        rows={settings.measurements}
        onSave={(measurements) =>
          save(product.id, { ...settings, measurements })
        }
      />
      <AdminShowroomStudioColours
        key={product.id}
        colours={colours}
        images={images}
      />
    </div>
  );
}
