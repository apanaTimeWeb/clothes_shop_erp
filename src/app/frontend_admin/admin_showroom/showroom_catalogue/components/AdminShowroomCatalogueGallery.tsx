"use client";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useAdminShowroomCatalogue } from "@/app/frontend_admin/admin_showroom/showroom_catalogue/state/AdminShowroomCatalogueStore";
import { Button } from "@/components/ui/Button";
export function AdminShowroomCatalogueGallery({
  productId,
  colour,
}: {
  productId: string;
  colour: string;
}) {
  const t = useTranslations("showroom"),
    images = useAdminShowroomCatalogue((s) => s.state.images)
      .filter(
        (i) => i.productId === productId && (!i.colour || i.colour === colour),
      )
      .sort(
        (a, b) =>
          Number(b.kind === "actual" && b.colour === colour) * 2 +
          Number(b.kind === "actual") -
          Number(a.kind === "actual" && a.colour === colour) * 2 -
          Number(a.kind === "actual"),
      ),
    [selected, setSelected] = useState(0),
    [fullscreen, setFullscreen] = useState(false),
    [zoom, setZoom] = useState(false),
    [broken, setBroken] = useState(false);
  const im = images[selected] ?? images[0],
    start = useRef<number | null>(null);
  function frame(delta: number) {
    setSelected((selected + delta + images.length) % images.length);
    setBroken(false);
  }
  function picture(large = false) {
    return (
      <Image
        src={
          broken
            ? "/images/shirt-0.svg"
            : (im?.srcOrAssetKey ?? "/images/shirt-0.svg")
        }
        width={1000}
        height={1000}
        alt={im?.label ?? t("illustration")}
        onError={() => setBroken(true)}
        className={
          zoom
            ? "min-w-[800px] max-w-none"
            : large
              ? "mx-auto max-h-[70dvh] w-auto object-contain"
              : "w-full"
        }
      />
    );
  }

  return (
    <div>
      <Button aria-pressed={zoom} onClick={() => setZoom(!zoom)}>
        {t(zoom ? "zoomOut" : "zoom")}
      </Button>
      <Button className="ml-2" onClick={() => setFullscreen(true)}>
        {t("fullscreen")}
      </Button>
      <div
        className="mt-3 max-h-96 overflow-auto rounded-xl bg-subtle"
        onTouchStart={(e) => {
          start.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (
            start.current !== null &&
            images.length > 1 &&
            Math.abs(e.changedTouches[0].clientX - start.current) > 50
          )
            frame(e.changedTouches[0].clientX < start.current ? 1 : -1);
          start.current = null;
        }}
      >
        {picture()}
      </div>
      {images.length > 1 && (
        <div className="my-3 flex gap-2">
          <Button onClick={() => frame(-1)}>{t("previous")}</Button>
          <Button onClick={() => frame(1)}>{t("next")}</Button>
        </div>
      )}
      <Dialog.Root open={fullscreen} onOpenChange={setFullscreen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-backdrop" />
          <Dialog.Content className="fixed inset-2 z-[70] overflow-auto rounded-xl bg-card p-5">
            <Dialog.Title className="text-xl font-semibold">
              {im?.label ?? t("illustration")}
            </Dialog.Title>
            <Dialog.Description className="my-2 text-sm">
              {t("galleryNote")}
            </Dialog.Description>
            <div className="my-3 flex gap-3">
              <Dialog.Close asChild>
                <Button>{t("closeCompare")}</Button>
              </Dialog.Close>
              <Button onClick={() => setZoom(!zoom)}>
                {t(zoom ? "zoomOut" : "zoom")}
              </Button>
              {images.length > 1 && (
                <>
                  <Button onClick={() => frame(-1)}>{t("previous")}</Button>
                  <Button onClick={() => frame(1)}>{t("next")}</Button>
                </>
              )}
            </div>
            {picture(true)}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <div className="my-3 flex flex-wrap gap-2">
        {images.map((i, n) => (
          <Button
            key={n}
            aria-pressed={n === selected}
            onClick={() => {
              setSelected(n);
              setBroken(false);
            }}
          >
            {i.angle} · {i.colour || t("allColours")}
          </Button>
        ))}
      </div>
      <p className="text-xs text-secondary">
        {!broken && im?.kind === "actual" && im.colour === colour
          ? t("actualImage")
          : t("representative")}
      </p>
    </div>
  );
}
