"use client";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import type { Catalogue } from "@/app/frontend_admin/admin_showroom/showroom_studio/schemas/AdminShowroomStudioSchema";
import { resolveCatalogueProductImage } from "@/lib/product_images";
export function AdminShowroomStudioColours({
  colours,
  images,
}: {
  colours: string[];
  images: Catalogue["images"];
}) {
  const t = useTranslations("studio");
  const [chosen, setChosen] = useState<string[]>(colours.slice(0, 3));
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{t("message050")}</h2>
      <p>{t("message051")}</p>
      <div className="flex flex-wrap gap-4">
        {colours.map((c) => (
          <label key={c}>
            <input
              type="checkbox"
              checked={chosen.includes(c)}
              disabled={!chosen.includes(c) && chosen.length === 3}
              onChange={(e) =>
                setChosen(
                  e.target.checked
                    ? [...chosen, c]
                    : chosen.filter((x) => x !== c),
                )
              }
            />
            {t("message005")}
            {c}
          </label>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {chosen.map((c) => {
          const photo =
            images.find((i) => i.colour === c && i.kind === "actual") ??
            images.find((i) => i.colour === c);
          return (
            <article className="rounded-xl border border-border p-3" key={c}>
              <h3>{c}</h3>
              {photo ? (
                <>
                  <Image
                    src={resolveCatalogueProductImage(photo.productId || "", undefined, undefined, c, photo.srcOrAssetKey)}
                    width={300}
                    height={300}
                    alt={photo.label}
                    className="h-64 w-full object-contain"
                  />
                  <p>{photo.kind}</p>
                </>
              ) : (
                <p>{t("message052")}</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
