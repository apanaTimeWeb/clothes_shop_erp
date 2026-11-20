"use client";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import Image from "next/image";
import { readPhoto } from "@/app/frontend_admin/admin_showroom/showroom_studio/utils/AdminShowroomStudioPhoto";
export function AdminShowroomStudioAssets({
  colour,
  src,
  onSave,
}: {
  colour: string;
  src?: string;
  onSave: (src: string) => boolean;
}) {
  const t = useTranslations("studio");
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const ticket = useRef(0);
  return (
    <details>
      <summary>
        {t("message017")}
        {colour || t("message018")}
      </summary>
      <p>{t("message019")}</p>
      {src && (
        <Image
          src={src}
          width={160}
          height={160}
          alt={t("message020", { p0: colour })}
          className="h-40 object-contain bg-subtle"
        />
      )}
      <label>
        {t("message021")}
        <input
          type="file"
          accept="image/png,image/webp"
          disabled={busy || !colour}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            const current = ++ticket.current;
            setBusy(true);
            try {
              const image = await readPhoto(file, true);
              if (current === ticket.current)
                setMessage(onSave(image) ? t("message022") : t("message023"));
            } catch (error) {
              setMessage(
                error instanceof Error ? error.message : t("message024"),
              );
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {src && (
        <Button
          disabled={busy}
          onClick={() =>
            setMessage(onSave("") ? t("message025") : t("message026"))
          }
        >
          {t("message027")}
        </Button>
      )}
      <p role="status">{busy ? t("message028") : message}</p>
    </details>
  );
}
