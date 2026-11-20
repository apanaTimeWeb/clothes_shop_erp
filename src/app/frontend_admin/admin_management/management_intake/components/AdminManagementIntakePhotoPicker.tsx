"use client";
import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { prepareImage } from "@/app/frontend_admin/admin_management/management_intake/utils/AdminManagementIntakeImageUpload";
import { Button } from "@/components/ui/Button";
export interface AdminManagementIntakePhoto {
  src: string;
  colour: string;
  angle: string;
  label: string;
}
export function AdminManagementIntakePhotoPicker({
  colours,
  photos,
  onChange,
  onBusyChange,
}: {
  colours: string[];
  photos: AdminManagementIntakePhoto[];
  onChange: (photos: AdminManagementIntakePhoto[]) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const t = useTranslations("management"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function choose(files: File[]) {
    setError("");
    setBusy(true);
    onBusyChange?.(true);
    try {
      if (files.length + photos.length > 4) throw new Error(t("fourPhotos"));
      const prepared = await Promise.all(
        files.map(async (f, i) => ({
          src: await prepareImage(f),
          colour: "",
          angle: ["Front", "Back", "Side", "Detail"][photos.length + i],
          label: f.name.replace(/\.[^.]+$/, "").slice(0, 120),
        })),
      );
      onChange([...photos, ...prepared]);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("invalidImage"));
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  }
  return (
    <section className="space-y-3" aria-busy={busy}>
      <label
        className="grid gap-3 rounded-xl border border-dashed border-border p-6"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!busy) void choose(Array.from(e.dataTransfer.files));
        }}
      >
        {t("photoDrop")}
        <input
          type="file"
          multiple
          disabled={busy || photos.length === 4}
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            void choose(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <span className="text-xs text-secondary">{t("imagePolicy")}</span>
      </label>
      {busy && <p role="status">{t("uploading")}</p>}
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {photos.map((photo, i) => (
          <div
            key={i}
            className="space-y-3 rounded-xl border border-border p-3"
          >
            <Image
              src={photo.src}
              width={160}
              height={160}
              alt={photo.label}
              className="h-36 w-full object-contain"
            />
            {(["colour", "angle", "label"] as const).map((key) => (
              <label key={key} className="grid gap-1">
                {t(key)}
                {key === "label" ? (
                  <input
                    required
                    maxLength={120}
                    value={photo.label}
                    onChange={(e) =>
                      onChange(
                        photos.map((x, n) =>
                          n === i ? { ...x, label: e.target.value } : x,
                        ),
                      )
                    }
                  />
                ) : (
                  <select
                    value={photo[key]}
                    onChange={(e) =>
                      onChange(
                        photos.map((x, n) =>
                          n === i ? { ...x, [key]: e.target.value } : x,
                        ),
                      )
                    }
                  >
                    {(key === "colour"
                      ? ["", ...colours]
                      : ["Front", "Back", "Side", "Detail"]
                    ).map((v) => (
                      <option key={v} value={v}>
                        {v || t("allColours")}
                      </option>
                    ))}
                  </select>
                )}
              </label>
            ))}
            <Button onClick={() => onChange(photos.filter((_, n) => i !== n))}>
              {t("remove")}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
