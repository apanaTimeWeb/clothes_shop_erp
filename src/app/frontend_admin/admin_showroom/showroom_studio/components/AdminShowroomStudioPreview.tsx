"use client";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  downloadImage,
  getStudioPreset,
  PHOTO_PRESETS,
  type GarmentCategory,
} from "@/app/frontend_admin/admin_showroom/showroom_studio/utils/AdminShowroomStudioPhoto";
import { useAdminShowroomStudioCanvas } from "@/app/frontend_admin/admin_showroom/showroom_studio/hooks/useAdminShowroomStudioCanvas";
import {
  AdminShowroomStudioTryOnControls,
  DEFAULT_MODEL_TRANSFORM,
  type ModelTransform,
  type StudioPose,
} from "@/app/frontend_admin/admin_showroom/showroom_studio/components/AdminShowroomStudioTryOnControls";
import {
  AdminShowroomStudioModelSelect,
  STUDIO_MODELS,
} from "@/app/frontend_admin/admin_showroom/showroom_studio/components/AdminShowroomStudioModelSelect";

type Point = { x: number; y: number };

interface AdminShowroomStudioPreviewProps {
  src?: string;
  autoCutoutSrc?: string;
  isRealPhoto?: boolean;
  productCategory?: GarmentCategory;
  productName?: string;
  colour?: string;
}

export function AdminShowroomStudioPreview({
  src,
  autoCutoutSrc,
  isRealPhoto = false,
  productCategory = "top",
  productName = "",
  colour = "",
}: AdminShowroomStudioPreviewProps) {
  const t = useTranslations("studio");
  const canvas = useRef<HTMLCanvasElement>(null);
  const drag = useRef<Point | null>(null);

  const [selectedModel, setSelectedModel] = useState<string>("mannequin");
  const [photo, setPhoto] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [category, setCategory] = useState<GarmentCategory>(productCategory);
  const [pose, setPose] = useState<StudioPose>(getStudioPreset(productCategory, "mannequin"));
  const [modelTransform, setModelTransform] = useState<ModelTransform>(DEFAULT_MODEL_TRANSFORM);
  const [activeTab, setActiveTab] = useState<"garment" | "model">("garment");
  const [sizeScale, setSizeScale] = useState(1.0);
  const [splitRatio, setSplitRatio] = useState(1.0);
  const [blendLighting, setBlendLighting] = useState(true);

  const [anchors, setAnchors] = useState<Point[]>([]);
  const [marking, setMarking] = useState(false);
  const [show, setShow] = useState(true);

  useEffect(() => {
    setCategory(productCategory);
    setPose(getStudioPreset(productCategory, selectedModel));
    setAnchors([]);
    setMarking(false);
  }, [productCategory, selectedModel]);

  const effectiveSrc = src || autoCutoutSrc;
  const currentBg = photo || STUDIO_MODELS.find((m) => m.id === selectedModel)?.path || "/images/style-mannequin.svg";

  const { background, garment, renderError } = useAdminShowroomStudioCanvas(
    canvas,
    currentBg,
    effectiveSrc,
    pose,
    show,
    anchors,
    marking,
    splitRatio,
    blendLighting,
    sizeScale,
    modelTransform,
  );

  function position(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * 600) / r.width, y: ((e.clientY - r.top) * 800) / r.height };
  }

  function mark(p: Point) {
    const next = [...anchors, p];
    setAnchors(next);
    if (next.length < 3) return;
    const [a, b, end] = next;
    const width = Math.hypot(b.x - a.x, b.y - a.y);
    const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const height = Math.hypot(end.x - center.x, end.y - center.y);
    if (width < 20 || height < 20) { setError(t("message060")); setAnchors([]); return; }
    setPose({
      x: (center.x + end.x) / 2, y: (center.y + end.y) / 2,
      width: Math.min(600, width * 1.25), height: Math.min(800, height * 1.15),
      rotation: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
    });
    setMarking(false); setAnchors([]); setError("");
  }

  function applyPreset(cat: GarmentCategory, modelId = selectedModel) {
    setCategory(cat);
    setPose(getStudioPreset(cat, modelId));
    setMarking(false);
    setAnchors([]);
  }

  return (
    <section className="space-y-5 rounded-2xl border border-border bg-card/60 p-6 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground">{t("message061")}</h2>
        <p className="text-sm text-muted-foreground">{t("message062")}</p>
      </div>

      <AdminShowroomStudioModelSelect
        selectedModel={selectedModel}
        onSelectModel={(id) => { setSelectedModel(id); applyPreset(category, id); setModelTransform(DEFAULT_MODEL_TRANSFORM); }}
        photo={photo}
        onPhotoLoaded={(d) => { setPhoto(d); setPose(PHOTO_PRESETS[category] ?? PHOTO_PRESETS.top); setModelTransform(DEFAULT_MODEL_TRANSFORM); setAnchors([]); setMarking(false); }}
        onClearPhoto={() => { setPhoto(""); applyPreset(category, selectedModel); setModelTransform(DEFAULT_MODEL_TRANSFORM); }}
        busy={busy}
        setBusy={setBusy}
        onError={setError}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">Selected Garment:</span>
          <span className="rounded bg-subtle px-2 py-0.5 text-foreground">
            {productName} ({colour})
          </span>
          {src ? (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-600 dark:text-emerald-400">
              Staff Cutout Active
            </span>
          ) : isRealPhoto ? (
            <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 font-medium text-indigo-600 dark:text-indigo-400">
              Real Photo Cutout Active
            </span>
          ) : (
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-blue-600 dark:text-blue-400">
              Auto Transparent Cutout Active
            </span>
          )}
        </div>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={show}
            onChange={(e) => setShow(e.target.checked)}
            className="rounded border-border accent-primary"
          />
          <span className="text-foreground">{t("message078")}</span>
        </label>
      </div>

      {(error || renderError) && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error || renderError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-foreground">
          <span>{t("message071")}:</span>
          <select
            value={category}
            onChange={(e) => applyPreset(e.target.value as GarmentCategory)}
            className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground"
          >
            <option value="top">{t("message072")}</option>
            <option value="bottom">{t("message073")}</option>
            <option value="dress">Full dress / Gown</option>
            <option value="accessory">{t("message074")}</option>
          </select>
        </label>
        <Button
          disabled={!effectiveSrc || !background}
          onClick={() => {
            setMarking(!marking);
            setAnchors([]);
            setShow(true);
          }}
        >
          {marking ? t("message075") : t("message076")}
        </Button>
        <Button onClick={() => applyPreset(category)}>
          {t("message077")}
        </Button>
      </div>

      {marking && (
        <p aria-live="polite" className="rounded-lg bg-primary/10 p-2.5 text-xs font-medium text-primary">
          {t("message079")}{anchors.length + 1}{t("message080")}
          {category === "bottom"
            ? [t("message084"), t("message085"), t("message086")][anchors.length]
            : [t("message081"), t("message082"), t("message083")][anchors.length]}
          {t("message087")}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="flex flex-col items-center lg:col-span-7">
          <canvas
            ref={canvas}
            width={600}
            height={800}
            aria-label={t("message088")}
            className="w-full max-w-md touch-none rounded-xl border border-border bg-subtle shadow-inner"
            onPointerDown={(e) => {
              if (marking) { mark(position(e)); return; }
              if (activeTab === "model") {
                if (!background) return;
                drag.current = position(e);
                e.currentTarget.setPointerCapture(e.pointerId);
                return;
              }
              if (!garment) return;
              drag.current = position(e);
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              const p = position(e), old = drag.current;
              if (activeTab === "model") {
                setModelTransform((v) => ({
                  ...v,
                  x: Math.max(-300, Math.min(300, v.x + p.x - old.x)),
                  y: Math.max(-400, Math.min(400, v.y + p.y - old.y)),
                }));
              } else {
                setPose((v) => ({
                  ...v,
                  x: Math.max(0, Math.min(600, v.x + p.x - old.x)),
                  y: Math.max(0, Math.min(800, v.y + p.y - old.y)),
                }));
              }
              drag.current = p;
            }}
            onPointerUp={() => { drag.current = null; }}
            onPointerCancel={() => { drag.current = null; }}
          />
          <div className="mt-3 flex w-full max-w-md justify-between">
            <Button
              disabled={!background || !garment || !show || marking || busy}
              onClick={() => {
                try {
                  if (canvas.current) downloadImage(canvas.current);
                } catch {
                  setError(t("message095"));
                }
              }}
            >
              {t("message096")}
            </Button>
          </div>
        </div>

        <div className="lg:col-span-5">
          <AdminShowroomStudioTryOnControls
            pose={pose}
            setPose={setPose}
            hasCutout={Boolean(effectiveSrc)}
            sizeScale={sizeScale}
            setSizeScale={setSizeScale}
            splitRatio={splitRatio}
            setSplitRatio={setSplitRatio}
            blendLighting={blendLighting}
            setBlendLighting={setBlendLighting}
            onReset={() => applyPreset(category)}
            modelTransform={modelTransform}
            setModelTransform={setModelTransform}
            onResetModel={() => setModelTransform(DEFAULT_MODEL_TRANSFORM)}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{t("message097")}</p>
    </section>
  );
}
