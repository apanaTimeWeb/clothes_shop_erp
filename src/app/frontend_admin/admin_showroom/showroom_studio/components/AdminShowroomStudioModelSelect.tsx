"use client";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { readPhoto } from "@/app/frontend_admin/admin_showroom/showroom_studio/utils/AdminShowroomStudioPhoto";

export const STUDIO_MODELS = [
  { id: "mannequin", label: "Mannequin", path: "/images/style-mannequin.svg" },
  { id: "male-photo", label: "Male (Real Photo)", path: "/images/model-male-photo.jpg" },
  { id: "female-photo", label: "Female (Real Photo)", path: "/images/model-female-photo.jpg" },
  { id: "male", label: "Male (Silhouette)", path: "/images/model-male.svg" },
  { id: "female", label: "Female (Silhouette)", path: "/images/model-female.svg" },
];

interface AdminShowroomStudioModelSelectProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  photo: string;
  onPhotoLoaded: (photoDataUrl: string) => void;
  onClearPhoto: () => void;
  busy: boolean;
  setBusy: (busy: boolean) => void;
  onError: (err: string) => void;
}

export function AdminShowroomStudioModelSelect({
  selectedModel,
  onSelectModel,
  photo,
  onPhotoLoaded,
  onClearPhoto,
  busy,
  setBusy,
  onError,
}: AdminShowroomStudioModelSelectProps) {
  const t = useTranslations("studio");
  const [consent, setConsent] = useState(false);
  const upload = useRef(0);

  function handleClear() {
    upload.current++;
    setConsent(false);
    onClearPhoto();
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-subtle/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">Select Model / Portrait:</span>
        {photo && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {t("message068")}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {STUDIO_MODELS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              onSelectModel(m.id);
              if (photo) onClearPhoto();
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              !photo && selectedModel === m.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border bg-background text-foreground hover:bg-muted"
            }`}
          >
            {m.label}
          </button>
        ))}
        {photo && (
          <Button className="min-h-8 px-2.5 py-1 text-xs" onClick={handleClear}>
            {t("message066")}
          </Button>
        )}
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-foreground">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              if (!e.target.checked) handleClear();
              else setConsent(true);
            }}
            className="rounded border-border accent-primary"
          />
          <span>{t("message063")}</span>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">
            <span>{t("message064")}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={!consent || busy}
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                const id = ++upload.current;
                setBusy(true);
                onError("");
                try {
                  const result = await readPhoto(file);
                  if (id === upload.current) onPhotoLoaded(result);
                } catch (err) {
                  if (id === upload.current) {
                    onError(err instanceof Error ? err.message : t("message065"));
                  }
                } finally {
                  if (id === upload.current) setBusy(false);
                }
              }}
            />
          </label>
          <span className="text-xs text-muted-foreground">
            {busy ? t("message067") : photo ? t("message068") : t("message069")}
          </span>
        </div>
      </div>
    </div>
  );
}
