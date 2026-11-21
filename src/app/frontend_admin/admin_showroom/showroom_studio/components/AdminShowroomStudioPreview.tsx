"use client";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  downloadImage,
  getStudioPreset,
  PHOTO_PRESETS,
  resolveBottomCutoutSrc,
  STORE_BOTTOMS,
  type GarmentCategory,
  type StoreBottomItem,
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

let cachedModel = "male-photo";
let cachedPhoto = "";
let cachedModelTransform: ModelTransform = DEFAULT_MODEL_TRANSFORM;

interface AdminShowroomStudioPreviewProps {
  src?: string; autoCutoutSrc?: string; isRealPhoto?: boolean;
  productCategory?: GarmentCategory; productName?: string; colour?: string;
  products?: Array<{ id: string; name: string }>; productId?: string;
  onSelectProduct?: (id: string) => void; colours?: string[]; onSelectColour?: (colour: string) => void;
}

export function AdminShowroomStudioPreview({
  src, autoCutoutSrc, isRealPhoto = false, productCategory = "top",
  productName = "", colour = "", products = [], productId,
  onSelectProduct, colours = [], onSelectColour,
}: AdminShowroomStudioPreviewProps) {
  const t = useTranslations("studio");
  const canvas = useRef<HTMLCanvasElement>(null);
  const drag = useRef<Point | null>(null);

  const [selectedModel, setSelectedModel] = useState<string>(() => cachedModel);
  const [photo, setPhoto] = useState<string>(() => cachedPhoto);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [category, setCategory] = useState<GarmentCategory>(productCategory);
  const [pose, setPose] = useState<StudioPose>(() =>
    cachedPhoto ? (PHOTO_PRESETS[productCategory] ?? PHOTO_PRESETS.top) : getStudioPreset(productCategory, cachedModel)
  );
  const [modelTransform, setModelTransform] = useState<ModelTransform>(() => cachedModelTransform);
  const [activeTab, setActiveTab] = useState<"top" | "bottom" | "model">("top");
  const [sizeScale, setSizeScale] = useState(1.0);
  const [splitRatio, setSplitRatio] = useState(1.0);
  const [blendLighting, setBlendLighting] = useState(true);

  const [bottomPose, setBottomPose] = useState<StudioPose>(() => getStudioPreset("bottom", cachedModel));
  const [selectedBottom, setSelectedBottom] = useState<StoreBottomItem>(STORE_BOTTOMS[0]);
  const [bottomColour, setBottomColour] = useState<string>("Blue");
  const [showBottom, setShowBottom] = useState<boolean>(true);
  const [bottomScale, setBottomScale] = useState<number>(1.0);

  const [anchors, setAnchors] = useState<Point[]>([]);
  const [marking, setMarking] = useState(false);
  const [show, setShow] = useState(true);

  useEffect(() => {
    setCategory(productCategory);
    setPose(photo ? (PHOTO_PRESETS[productCategory] ?? PHOTO_PRESETS.top) : getStudioPreset(productCategory, selectedModel));
    setAnchors([]); setMarking(false);
  }, [productCategory]);

  const effectiveSrc = src || autoCutoutSrc;
  const bottomCutout = resolveBottomCutoutSrc(selectedBottom.style, bottomColour);
  const currentBg = photo || STUDIO_MODELS.find((m) => m.id === selectedModel)?.path || "/images/style-mannequin.svg";

  const { background, garment, bottomGarment, renderError } = useAdminShowroomStudioCanvas(
    canvas, currentBg, effectiveSrc, pose, show, anchors, marking,
    splitRatio, blendLighting, sizeScale, modelTransform,
    bottomCutout.src, bottomPose, showBottom, bottomScale, activeTab,
  );

  function position(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * 600) / r.width, y: ((e.clientY - r.top) * 800) / r.height };
  }

  function mark(p: Point) {
    const next = [...anchors, p]; setAnchors(next);
    if (next.length < 3) return;
    const [a, b, end] = next;
    const width = Math.hypot(b.x - a.x, b.y - a.y), center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const height = Math.hypot(end.x - center.x, end.y - center.y);
    if (width < 20 || height < 20) { setError(t("message060")); setAnchors([]); return; }
    const newPose: StudioPose = {
      x: (center.x + end.x) / 2, y: (center.y + end.y) / 2,
      width: Math.min(600, width * 1.25), height: Math.min(800, height * 1.15),
      rotation: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
    };
    if (activeTab === "bottom") setBottomPose(newPose); else setPose(newPose);
    setMarking(false); setAnchors([]); setError("");
  }

  function applyPreset(cat: GarmentCategory, modelId = selectedModel) {
    setCategory(cat);
    if (cat === "bottom") setBottomPose(getStudioPreset("bottom", modelId));
    else setPose(getStudioPreset(cat, modelId));
    setMarking(false); setAnchors([]);
  }

  const handleModelTransform: React.Dispatch<React.SetStateAction<ModelTransform>> = (val) => {
    setModelTransform((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      cachedModelTransform = next;
      return next;
    });
  };

  return (
    <section className="space-y-5 rounded-2xl border border-border bg-card/60 p-6 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground">{t("message061")}</h2>
        <p className="text-sm text-muted-foreground">{t("message062")}</p>
      </div>

      <AdminShowroomStudioModelSelect
        selectedModel={selectedModel}
        onSelectModel={(id) => {
          cachedModel = id; cachedPhoto = ""; setPhoto(""); setSelectedModel(id);
          applyPreset(category, id); setBottomPose(getStudioPreset("bottom", id));
          handleModelTransform(DEFAULT_MODEL_TRANSFORM);
        }}
        photo={photo}
        onPhotoLoaded={(d) => {
          cachedPhoto = d; setPhoto(d);
          setPose(PHOTO_PRESETS[category] ?? PHOTO_PRESETS.top);
          setBottomPose(PHOTO_PRESETS.bottom);
          handleModelTransform(DEFAULT_MODEL_TRANSFORM);
          setAnchors([]); setMarking(false);
        }}
        onClearPhoto={() => {
          cachedPhoto = ""; setPhoto("");
          applyPreset(category, selectedModel); setBottomPose(getStudioPreset("bottom", selectedModel));
          handleModelTransform(DEFAULT_MODEL_TRANSFORM);
        }}
        busy={busy} setBusy={setBusy} onError={setError}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">Top Garment:</span>
          <span className="rounded bg-subtle px-2 py-0.5 text-foreground">{productName} ({colour})</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${src ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : isRealPhoto ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"}`}>
            {src ? "Staff Cutout" : isRealPhoto ? "Real Photo" : "Auto Cutout"}
          </span>
          {showBottom && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              👖 {selectedBottom.name} ({bottomColour})
            </span>
          )}
        </div>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="rounded border-border accent-primary" />
          <span className="text-foreground">{t("message078")}</span>
        </label>
      </div>

      {(error || renderError) && (<p role="alert" className="text-sm font-medium text-danger">{error || renderError}</p>)}

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-foreground">
          <span>{t("message071")}:</span>
          <select value={category} onChange={(e) => applyPreset(e.target.value as GarmentCategory)} className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground">
            <option value="top">{t("message072")}</option>
            <option value="bottom">{t("message073")}</option>
            <option value="dress">Full dress / Gown</option>
            <option value="accessory">{t("message074")}</option>
          </select>
        </label>
        <Button disabled={!effectiveSrc || !background} onClick={() => { setMarking(!marking); setAnchors([]); setShow(true); }}>
          {marking ? t("message075") : t("message076")}
        </Button>
        <Button onClick={() => { applyPreset(category); setBottomPose(getStudioPreset("bottom", selectedModel)); }}>{t("message077")}</Button>
      </div>

      {marking && (
        <p aria-live="polite" className="rounded-lg bg-primary/10 p-2.5 text-xs font-medium text-primary">
          {t("message079")}{anchors.length + 1}{t("message080")}
          {activeTab === "bottom" || category === "bottom"
            ? [t("message084"), t("message085"), t("message086")][anchors.length]
            : [t("message081"), t("message082"), t("message083")][anchors.length]}
          {t("message087")}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div
          className="flex flex-col items-center lg:col-span-7"
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
          onDrop={(e) => {
            e.preventDefault();
            try {
              const raw = e.dataTransfer.getData("application/json") || e.dataTransfer.getData("text/plain");
              if (raw) {
                const b = JSON.parse(raw) as StoreBottomItem;
                if (b && b.id) { setSelectedBottom(b); setShowBottom(true); setActiveTab("bottom"); }
              }
            } catch { /* ignore invalid drops */ }
          }}
        >
          <div className="relative w-full max-w-md">
            <canvas
              ref={canvas} width={600} height={800} aria-label={t("message088")}
              className="w-full touch-none rounded-xl border border-border bg-subtle shadow-inner"
              onPointerDown={(e) => {
                if (marking) { mark(position(e)); return; }
                const p = position(e);
                if (activeTab === "model") {
                  if (!background) return;
                  drag.current = p; e.currentTarget.setPointerCapture(e.pointerId); return;
                }
                if (showBottom && bottomGarment && (!garment || Math.hypot(p.x - bottomPose.x, p.y - bottomPose.y) < Math.hypot(p.x - pose.x, p.y - pose.y))) {
                  setActiveTab("bottom"); drag.current = p; e.currentTarget.setPointerCapture(e.pointerId); return;
                }
                if (garment) {
                  setActiveTab("top"); drag.current = p; e.currentTarget.setPointerCapture(e.pointerId);
                }
              }}
              onPointerMove={(e) => {
                if (!drag.current) return;
                const p = position(e), old = drag.current;
                const dx = p.x - old.x, dy = p.y - old.y;
                if (activeTab === "model") {
                  handleModelTransform((v) => ({ ...v, x: Math.max(-300, Math.min(300, v.x + dx)), y: Math.max(-400, Math.min(400, v.y + dy)) }));
                } else if (activeTab === "bottom") {
                  setBottomPose((v) => ({ ...v, x: Math.max(0, Math.min(600, v.x + dx)), y: Math.max(0, Math.min(800, v.y + dy)) }));
                } else {
                  setPose((v) => ({ ...v, x: Math.max(0, Math.min(600, v.x + dx)), y: Math.max(0, Math.min(800, v.y + dy)) }));
                }
                drag.current = p;
              }}
              onPointerUp={() => { drag.current = null; }}
              onPointerCancel={() => { drag.current = null; }}
            />
          </div>

          <div className="mt-3 flex w-full max-w-md justify-between">
            <Button
              disabled={!background || (!garment && !bottomGarment) || !show || marking || busy}
              onClick={() => { try { if (canvas.current) downloadImage(canvas.current); } catch { setError(t("message095")); } }}
            >
              {t("message096")}
            </Button>
          </div>
        </div>

        <div className="lg:col-span-5">
          <AdminShowroomStudioTryOnControls
            pose={pose} setPose={setPose} hasCutout={Boolean(effectiveSrc)}
            sizeScale={sizeScale} setSizeScale={setSizeScale}
            splitRatio={splitRatio} setSplitRatio={setSplitRatio}
            blendLighting={blendLighting} setBlendLighting={setBlendLighting}
            onReset={() => applyPreset(category)}
            modelTransform={modelTransform} setModelTransform={handleModelTransform}
            onResetModel={() => handleModelTransform(DEFAULT_MODEL_TRANSFORM)}
            activeTab={activeTab} setActiveTab={setActiveTab}
            products={products} productId={productId} onSelectProduct={onSelectProduct}
            colours={colours} selectedColour={colour} onSelectColour={onSelectColour}
            bottomPose={bottomPose} setBottomPose={setBottomPose}
            selectedBottom={selectedBottom} onSelectBottom={setSelectedBottom}
            bottomColour={bottomColour} onSelectBottomColour={setBottomColour}
            bottomScale={bottomScale} setBottomScale={setBottomScale}
            onResetBottom={() => setBottomPose(getStudioPreset("bottom", selectedModel))}
            showBottom={showBottom} setShowBottom={setShowBottom}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{t("message097")}</p>
    </section>
  );
}
