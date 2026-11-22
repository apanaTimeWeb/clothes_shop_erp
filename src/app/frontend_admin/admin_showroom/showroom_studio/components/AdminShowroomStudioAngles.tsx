"use client";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRef, useState } from "react";
import type { Catalogue } from "@/app/frontend_admin/admin_showroom/showroom_studio/schemas/AdminShowroomStudioSchema";
import { resolveCatalogueProductImage } from "@/lib/product_images";
export function AdminShowroomStudioAngles({
  canEdit,
  images,
  order,
  onOrder,
}: {
  canEdit: boolean;
  images: Catalogue["images"];
  order: string[];
  onOrder: (v: string[]) => void;
}) {
  const t = useTranslations("studio");
  const [index, setIndex] = useState(0);
  const start = useRef<number | null>(null);
  const rows = [...images].sort((a, b) => {
    const x = order.indexOf(a.srcOrAssetKey),
      y = order.indexOf(b.srcOrAssetKey);
    return (x < 0 ? 999 : x) - (y < 0 ? 999 : y);
  });
  const current = rows[index % Math.max(1, rows.length)];
  function step(delta: number) {
    setIndex((i) => (i + delta + rows.length) % Math.max(1, rows.length));
  }
  if (!current) return <p>{t("message002")}</p>;
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{t("message003")}</h2>
      <p>
        {t("message004")}
        {t("message005")}
        {rows.length === 1 ? t("message006") : t("message007")}
      </p>
      <div
        tabIndex={0}
        role="group"
        aria-label={t("message008")}
        className="rounded-xl bg-subtle touch-pan-y"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            step(1);
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            step(-1);
          }
        }}
        onPointerDown={(e) => {
          start.current = e.clientX;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerUp={(e) => {
          if (
            start.current !== null &&
            Math.abs(e.clientX - start.current) > 25
          )
            step(e.clientX < start.current ? 1 : -1);
          start.current = null;
        }}
        onPointerCancel={() => {
          start.current = null;
        }}
      >
        <Image
          draggable={false}
          src={resolveCatalogueProductImage(current.productId || "", undefined, undefined, current.colour, current.srcOrAssetKey)}
          alt={current.label}
          width={600}
          height={600}
          className="h-96 w-full object-contain"
        />
      </div>
      <p aria-live="polite">
        {(index % rows.length) + 1}
        {t("message009")}
        {rows.length}
        {t("message010")}
        {current.angle}
        {t("message010")}
        {t("message005")}
        {current.kind}
      </p>
      <div className="flex gap-3">
        <Button disabled={rows.length < 2} onClick={() => step(-1)}>
          {t("message011")}
        </Button>
        <Button disabled={rows.length < 2} onClick={() => step(1)}>
          {t("message012")}
        </Button>
      </div>
      {canEdit && (
        <details>
          <summary>{t("message013")}</summary>
          <p>{t("message014")}</p>
          {rows.map((r, i) => (
            <div className="flex gap-3 py-2" key={r.srcOrAssetKey}>
              <span>
                {i + 1}
                {t("message015")}
                {r.angle}
              </span>
              <Button
                disabled={i === 0}
                onClick={() => {
                  const next = rows.map((x) => x.srcOrAssetKey);
                  [next[i - 1], next[i]] = [next[i], next[i - 1]];
                  onOrder(next);
                  setIndex(0);
                }}
              >
                {t("message016")}
              </Button>
            </div>
          ))}
        </details>
      )}
    </section>
  );
}
