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
  generateAutoCutoutSvg,
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
  const selected = colours.includes(colour) ? colour : (colours[0] ?? "");
  const images = catalogue.images.filter((i) => i.productId === product.id);
  const settings = preferences[product.id] ?? {
    order: [],
    measurements: [],
    overlays: {},
  };

  const productCategory = detectGarmentCategory(
    (product as { categoryId?: string }).categoryId,
  );
  const autoCutoutSrc = generateAutoCutoutSvg(productCategory, selected);

  return (
    <div className="space-y-8">
      <Link href="/frontend_admin/admin_showroom/showroom_catalogue">
        {t("message055")}
      </Link>
      <h1 className="text-3xl font-semibold">{t("message056")}</h1>
      {canEdit && <AdminShowroomStudioBackup />}
      <p>{t("message057")}</p>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-4">
        <label>
          {t("message058")}
          <select
            value={product.id}
            onChange={(e) => {
              setProductId(e.target.value);
              setColour("");
            }}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("message059")}
          <select value={selected} onChange={(e) => setColour(e.target.value)}>
            {colours.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <AdminShowroomStudioAngles
        canEdit={canEdit}
        key={product.id + selected}
        images={images.filter((i) => i.colour === selected || !i.colour)}
        order={settings.order}
        onOrder={(order) => save(product.id, { ...settings, order })}
      />
      {canEdit && (
        <AdminShowroomStudioAssets
          key={product.id + selected}
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
        key={product.id + selected}
        src={settings.overlays[selected]}
        autoCutoutSrc={autoCutoutSrc}
        productCategory={productCategory}
        productName={product.name}
        colour={selected}
      />
      <AdminShowroomStudioSizeGuide
        canEdit={canEdit}
        key={product.id + JSON.stringify(settings.measurements)}
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
