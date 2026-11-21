"use client";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import {
  downloadImage,
  getStudioPreset,
  resolveGarmentItemCutoutSrc,
  STORE_CATALOG_ITEMS,
  type GarmentCategory,
  type StoreGarmentItem,
  type StudioPose,
  type WornGarmentItem,
} from "@/app/frontend_admin/admin_showroom/showroom_studio/utils/AdminShowroomStudioPhoto";
import { useAdminShowroomStudioCanvas } from "@/app/frontend_admin/admin_showroom/showroom_studio/hooks/useAdminShowroomStudioCanvas";
import {
  AdminShowroomStudioTryOnControls,
  DEFAULT_MODEL_TRANSFORM,
  type ModelTransform,
} from "@/app/frontend_admin/admin_showroom/showroom_studio/components/AdminShowroomStudioTryOnControls";
import {
  AdminShowroomStudioModelSelect,
  STUDIO_MODELS,
} from "@/app/frontend_admin/admin_showroom/showroom_studio/components/AdminShowroomStudioModelSelect";

type Point = { x: number; y: number };
let cachedModel = "male-photo", cachedPhoto = "", cachedModelTransform: ModelTransform = DEFAULT_MODEL_TRANSFORM;

interface AdminShowroomStudioPreviewProps {
  src?: string; autoCutoutSrc?: string; isRealPhoto?: boolean;
  productCategory?: GarmentCategory; productName?: string; colour?: string;
  products?: Array<{ id: string; name: string }>; productId?: string;
  onSelectProduct?: (id: string) => void; colours?: string[]; onSelectColour?: (colour: string) => void;
}

export function AdminShowroomStudioPreview({
  src, autoCutoutSrc, productName = "Casual Linen Shirt", colour = "Blue",
}: AdminShowroomStudioPreviewProps) {
  const t = useTranslations("studio");
  const canvas = useRef<HTMLCanvasElement>(null), drag = useRef<Point | null>(null);

  const [selectedModel, setSelectedModel] = useState<string>(() => cachedModel);
  const [photo, setPhoto] = useState<string>(() => cachedPhoto);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [modelTransform, setModelTransform] = useState<ModelTransform>(() => cachedModelTransform);
  const [activeTab, setActiveTab] = useState<"rack" | "garment" | "model">("rack");
  const [splitRatio, setSplitRatio] = useState(1.0), [blendLighting, setBlendLighting] = useState(true);
  const [tuckedIn, setTuckedIn] = useState(false), [show, setShow] = useState(true);

  const [trialRack, setTrialRack] = useState<StoreGarmentItem[]>(() => [
    STORE_CATALOG_ITEMS[0], STORE_CATALOG_ITEMS[1], STORE_CATALOG_ITEMS[4], STORE_CATALOG_ITEMS[9],
  ]);

  const [wornGarments, setWornGarments] = useState<WornGarmentItem[]>(() => [
    {
      instanceId: "worn-init-top", catalogId: STORE_CATALOG_ITEMS[0].id,
      name: productName || STORE_CATALOG_ITEMS[0].name, category: "top",
      colour: colour || "Blue", style: "shirt",
      src: src || autoCutoutSrc || resolveGarmentItemCutoutSrc("top", "shirt", colour || "Blue", productName).src,
      pose: getStudioPreset("top", cachedModel), scale: 1.0,
    },
    {
      instanceId: "worn-init-bot", catalogId: STORE_CATALOG_ITEMS[4].id,
      name: STORE_CATALOG_ITEMS[4].name, category: "bottom",
      colour: "Blue", style: "jeans",
      src: resolveGarmentItemCutoutSrc("bottom", "jeans", "Blue").src,
      pose: getStudioPreset("bottom", cachedModel), scale: 1.0,
    },
  ]);

  const [activeInstanceId, setActiveInstanceId] = useState<string>("worn-init-top");
  const [anchors, setAnchors] = useState<Point[]>([]), [marking, setMarking] = useState(false);

  const currentBg = photo || STUDIO_MODELS.find((m) => m.id === selectedModel)?.path || "/images/style-mannequin.svg";
  const { background, renderError } = useAdminShowroomStudioCanvas(
    canvas, currentBg, wornGarments, show, anchors, marking,
    splitRatio, blendLighting, modelTransform, activeInstanceId, tuckedIn,
  );
  const activeGarment = wornGarments.find((w) => w.instanceId === activeInstanceId) || wornGarments[0];

  function position(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * 600) / r.width, y: ((e.clientY - r.top) * 800) / r.height };
  }

  function equipGarment(item: StoreGarmentItem | { id?: string; name: string; category?: string; style?: string; defaultColour?: string }, chosenColour?: string) {
    const cat = (item.category as "top" | "bottom") || (item.name.toLowerCase().includes("pant") || item.name.toLowerCase().includes("jean") ? "bottom" : "top");
    const style = item.style || (cat === "bottom" ? "jeans" : "shirt");
    const c = chosenColour || item.defaultColour || (cat === "bottom" ? "Blue" : "Black");
    const { src: cutoutSrc } = resolveGarmentItemCutoutSrc(cat, style, c, item.name);
    const newId = `worn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setWornGarments((prev) => [...prev, {
      instanceId: newId, catalogId: item.id || newId, name: item.name, category: cat,
      colour: c, style, src: cutoutSrc, pose: getStudioPreset(cat, selectedModel), scale: 1.0,
    }]);
    setActiveInstanceId(newId);
    setActiveTab("garment");
  }

  function removeWorn(instanceId: string) {
    setWornGarments((prev) => {
      const next = prev.filter((w) => w.instanceId !== instanceId);
      if (activeInstanceId === instanceId) setActiveInstanceId(next[0]?.instanceId || "");
      return next;
    });
  }

  function updateActiveColour(newColour: string) {
    if (!activeGarment) return;
    const { src: newSrc } = resolveGarmentItemCutoutSrc(activeGarment.category, activeGarment.style, newColour, activeGarment.name);
    setWornGarments((prev) => prev.map((w) => (w.instanceId === activeGarment.instanceId ? { ...w, colour: newColour, src: newSrc } : w)));
  }

  function updateActivePose(updater: React.SetStateAction<StudioPose>) {
    if (!activeGarment) return;
    setWornGarments((prev) => prev.map((w) => (w.instanceId === activeGarment.instanceId ? { ...w, pose: typeof updater === "function" ? updater(w.pose) : updater } : w)));
  }

  function mark(p: Point) {
    const next = [...anchors, p]; setAnchors(next);
    if (next.length < 3 || !activeGarment) return;
    const [a, b, end] = next, center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const width = Math.hypot(b.x - a.x, b.y - a.y), height = Math.hypot(end.x - center.x, end.y - center.y);
    if (width < 20 || height < 20) { setError(t("message060")); setAnchors([]); return; }
    updateActivePose({
      x: (center.x + end.x) / 2, y: (center.y + end.y) / 2,
      width: Math.min(600, width * 1.25), height: Math.min(800, height * 1.15),
      rotation: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
    });
    setMarking(false); setAnchors([]); setError("");
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
        onSelectModel={(id) => { cachedModel = id; cachedPhoto = ""; setPhoto(""); setSelectedModel(id); handleModelTransform(DEFAULT_MODEL_TRANSFORM); }}
        photo={photo}
        onPhotoLoaded={(d) => { cachedPhoto = d; setPhoto(d); handleModelTransform(DEFAULT_MODEL_TRANSFORM); setAnchors([]); setMarking(false); }}
        onClearPhoto={() => { cachedPhoto = ""; setPhoto(""); handleModelTransform(DEFAULT_MODEL_TRANSFORM); }}
        busy={busy} setBusy={setBusy} onError={setError}
      />

      {/* Currently Wearing on Body with Clean Highlight (No black background) */}
      <div className="rounded-xl border border-border bg-subtle/70 p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-foreground">Wearing on Body ({wornGarments.length}):</span>
          {wornGarments.length === 0 ? (
            <span className="text-xs text-muted-foreground italic">None (Bare model) - Drag from Trial Rack to try on</span>
          ) : (
            wornGarments.map((w) => (
              <div
                key={w.instanceId} onClick={() => { setActiveInstanceId(w.instanceId); setActiveTab("garment"); }}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-all ${
                  activeInstanceId === w.instanceId
                    ? "border-2 border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200 font-semibold shadow-sm"
                    : "border border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                <span>{w.category === "top" ? "👕" : "👖"}</span>
                <span>{w.name} ({w.colour})</span>
                <button
                  type="button" title={`Remove ${w.name} from body`}
                  onClick={(e) => { e.stopPropagation(); removeWorn(w.instanceId); }}
                  className="ml-1 rounded-full p-0.5 text-danger hover:bg-danger/20 font-bold text-xs"
                >✖</button>
              </div>
            ))
          )}
        </div>
        {wornGarments.length > 0 && (
          <button type="button" onClick={() => setWornGarments([])} className="text-[11px] text-muted-foreground hover:text-danger underline ml-auto">
            Take Off All
          </button>
        )}
      </div>

      {(error || renderError) && (<p role="alert" className="text-sm font-medium text-danger">{error || renderError}</p>)}

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={wornGarments.length === 0 || !background} onClick={() => { setMarking(!marking); setAnchors([]); setShow(true); }}>
          {marking ? t("message075") : t("message076")}
        </Button>
        <Button onClick={() => { if (activeGarment) updateActivePose(getStudioPreset(activeGarment.category, selectedModel)); }}>{t("message077")}</Button>
        <label className="ml-auto flex items-center gap-1.5 text-xs text-foreground">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="rounded border-border accent-blue-600" />
          <span>Show Garments</span>
        </label>
      </div>

      {marking && (
        <p aria-live="polite" className="rounded-lg bg-primary/10 p-2.5 text-xs font-medium text-primary">
          {t("message079")}{anchors.length + 1}{t("message080")}
          {[t("message081"), t("message082"), t("message083")][anchors.length]}
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
              if (raw) { const item = JSON.parse(raw); if (item && item.name) equipGarment(item); }
            } catch { /* ignore */ }
          }}
        >
          <div className="relative w-full max-w-md">
            <canvas
              ref={canvas} width={600} height={800} aria-label={t("message088")}
              className="w-full touch-none rounded-xl border border-border bg-subtle shadow-inner"
              onPointerDown={(e) => {
                if (marking) { mark(position(e)); return; }
                const p = position(e);
                if (activeTab === "model") { if (!background) return; drag.current = p; e.currentTarget.setPointerCapture(e.pointerId); return; }
                if (wornGarments.length > 0) {
                  let closest = wornGarments[0], minD = Math.hypot(p.x - closest.pose.x, p.y - closest.pose.y);
                  wornGarments.forEach((w) => {
                    const d = Math.hypot(p.x - w.pose.x, p.y - w.pose.y);
                    if (d < minD) { minD = d; closest = w; }
                  });
                  setActiveInstanceId(closest.instanceId); drag.current = p; e.currentTarget.setPointerCapture(e.pointerId);
                }
              }}
              onPointerMove={(e) => {
                if (!drag.current) return;
                const p = position(e), old = drag.current, dx = p.x - old.x, dy = p.y - old.y;
                if (activeTab === "model") {
                  handleModelTransform((v) => ({ ...v, x: Math.max(-300, Math.min(300, v.x + dx)), y: Math.max(-400, Math.min(400, v.y + dy)) }));
                } else if (activeGarment) {
                  updateActivePose((v) => ({ ...v, x: Math.max(0, Math.min(600, v.x + dx)), y: Math.max(0, Math.min(800, v.y + dy)) }));
                }
                drag.current = p;
              }}
              onPointerUp={() => { drag.current = null; }}
              onPointerCancel={() => { drag.current = null; }}
            />
          </div>

          <div className="mt-3 flex w-full max-w-md justify-between">
            <Button
              disabled={!background || wornGarments.length === 0 || !show || marking || busy}
              onClick={() => { try { if (canvas.current) downloadImage(canvas.current); } catch { setError(t("message095")); } }}
            >
              {t("message096")}
            </Button>
          </div>
        </div>

        <div className="lg:col-span-5">
          <AdminShowroomStudioTryOnControls
            trialRack={trialRack}
            onAddToTrial={(item) => setTrialRack((prev) => (prev.some((x) => x.id === item.id) ? prev : [...prev, item]))}
            onRemoveFromTrial={(id) => setTrialRack((prev) => prev.filter((x) => x.id !== id))}
            onEquipItem={(item) => equipGarment(item)}
            wornGarments={wornGarments}
            activeInstanceId={activeInstanceId}
            setActiveInstanceId={setActiveInstanceId}
            onRemoveWorn={removeWorn}
            activeGarment={activeGarment}
            onUpdateActivePose={updateActivePose}
            onUpdateActiveScale={(scale) => {
              if (activeGarment) setWornGarments((prev) => prev.map((w) => (w.instanceId === activeGarment.instanceId ? { ...w, scale } : w)));
            }}
            onUpdateActiveColour={updateActiveColour}
            onResetActivePose={() => { if (activeGarment) updateActivePose(getStudioPreset(activeGarment.category, selectedModel)); }}
            tuckedIn={tuckedIn} setTuckedIn={setTuckedIn}
            blendLighting={blendLighting} setBlendLighting={setBlendLighting}
            splitRatio={splitRatio} setSplitRatio={setSplitRatio}
            modelTransform={modelTransform} setModelTransform={handleModelTransform}
            onResetModel={() => handleModelTransform(DEFAULT_MODEL_TRANSFORM)}
            activeTab={activeTab} setActiveTab={setActiveTab}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{t("message097")}</p>
    </section>
  );
}
