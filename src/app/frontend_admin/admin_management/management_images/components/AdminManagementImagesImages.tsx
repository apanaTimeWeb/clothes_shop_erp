"use client";
import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useAdminManagementImages } from "@/app/frontend_admin/admin_management/management_images/state/AdminManagementImagesStore";
import {
  AdminManagementImagesPhotoPicker,
  type AdminManagementImagesPhoto,
} from "@/app/frontend_admin/admin_management/management_images/components/AdminManagementImagesPhotoPicker";
import {
  useAdminManagementImagesUnsaved,
  requestDiscard,
} from "@/app/frontend_admin/admin_management/management_images/hooks/useAdminManagementImagesUnsaved";
import { Button } from "@/components/ui/Button";
import { Confirm } from "@/components/ui/Confirm";
import { resolveCatalogueProductImage } from "@/lib/product_images";
export function AdminManagementImagesImages() {
  const t = useTranslations("management"),
    { state, dispatch, stale } = useAdminManagementImages(),
    [id, setId] = useState(state.products[0]?.id ?? ""),
    [photos, setPhotos] = useState<AdminManagementImagesPhoto[]>([]),
    [busy, setBusy] = useState(false);
  const { setDirty } = useAdminManagementImagesUnsaved(t("unsaved"));
  return (
    <div className="space-y-5">
      <p className="text-sm text-secondary">{t("imagePolicy")}</p>
      <label className="grid gap-2">
        {t("selectDesign")}
        <select
          value={id}
          onChange={(e) => {
            if (requestDiscard()) {
              setId(e.target.value);
              setPhotos([]);
            }
          }}
        >
          {state.products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.designCode} · {p.name}
            </option>
          ))}
        </select>
      </label>
      <AdminManagementImagesPhotoPicker
        colours={[
          ...new Set(
            state.variants
              .filter((v) => v.productId === id)
              .map((v) => v.colour),
          ),
        ]}
        onBusyChange={setBusy}
        photos={photos}
        onChange={(p) => {
          setPhotos(p);
          setDirty(true);
        }}
      />
      <Button
        disabled={busy || stale || !id || !photos.length}
        onClick={() => {
          if (
            dispatch({
              type: "manage-images",
              data: {
                operation: photos.map((photo) => ({ ...photo, productId: id })),
              },
            })
          ) {
            setPhotos([]);
            setDirty(false);
          }
        }}
      >
        {t("upload")}
      </Button>
      <div className="grid gap-4 sm:grid-cols-3">
        {state.images
          .filter((i) => i.productId === id)
          .map((im, index) => (
            <article
              key={index}
              className="rounded-lg border border-border p-3"
            >
              {(() => {
                const prod = state.products.find((p) => p.id === id);
                const imgSrc = resolveCatalogueProductImage(id, prod?.name, prod?.categoryId, im.colour, im.srcOrAssetKey);
                return (
                  <Image
                    src={imgSrc}
                    width={240}
                    height={240}
                    alt={im.label}
                    className="aspect-square w-full object-contain"
                  />
                );
              })()}
              <p className="my-3 text-sm">
                {im.colour || t("allColours")} · {im.angle} · {im.kind}
              </p>
              <Confirm
                title={t("imageRemove")}
                description={t("imageRemoveBody")}
                confirmLabel={t("remove")}
                cancelLabel={t("cancel")}
                trigger={<Button disabled={stale}>{t("remove")}</Button>}
                onConfirm={() =>
                  dispatch({
                    type: "manage-image",
                    data: {
                      operation: {
                        productId: id,
                        colour: im.colour ?? "",
                        angle: im.angle,
                        label: im.label,
                        remove: true,
                      },
                    },
                  })
                }
              />
            </article>
          ))}
      </div>
    </div>
  );
}
