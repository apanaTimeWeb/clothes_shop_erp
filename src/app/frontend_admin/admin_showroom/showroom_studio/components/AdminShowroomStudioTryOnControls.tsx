"use client";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";
import { getGarmentColorPalette } from "@/app/frontend_admin/admin_showroom/showroom_studio/utils/AdminShowroomStudioPhoto";

export interface StudioPose {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface ModelTransform {
  x: number;
  y: number;
  zoom: number;
  width: number;
  height: number;
  rotation: number;
}

export const DEFAULT_MODEL_TRANSFORM: ModelTransform = {
  x: 0,
  y: 0,
  zoom: 100,
  width: 100,
  height: 100,
  rotation: 0,
};

interface AdminShowroomStudioTryOnControlsProps {
  pose: StudioPose;
  setPose: React.Dispatch<React.SetStateAction<StudioPose>>;
  hasCutout: boolean;
  sizeScale: number;
  setSizeScale: (scale: number) => void;
  splitRatio: number;
  setSplitRatio: (ratio: number) => void;
  blendLighting: boolean;
  setBlendLighting: (val: boolean) => void;
  onReset: () => void;
  modelTransform: ModelTransform;
  setModelTransform: React.Dispatch<React.SetStateAction<ModelTransform>>;
  onResetModel: () => void;
  activeTab: "garment" | "model";
  setActiveTab: (tab: "garment" | "model") => void;
  products?: Array<{ id: string; name: string }>;
  productId?: string;
  onSelectProduct?: (id: string) => void;
  colours?: string[];
  selectedColour?: string;
  onSelectColour?: (colour: string) => void;
}

const SIZES = [
  { label: "S", scale: 0.94, desc: "Slim" }, { label: "M", scale: 1.0, desc: "Regular" },
  { label: "L", scale: 1.06, desc: "Comfort" }, { label: "XL", scale: 1.12, desc: "Relaxed" },
  { label: "XXL", scale: 1.18, desc: "Oversized" },
];
const MODEL_FIELDS = [
  { field: "zoom", label: "Photo Zoom / Scale", min: 40, max: 250, unit: "%" },
  { field: "rotation", label: "Straighten / Rotation", min: -90, max: 90, unit: "°" },
  { field: "width", label: "Photo Width (Scale)", min: 50, max: 180, unit: "%" },
  { field: "height", label: "Photo Height (Scale)", min: 50, max: 180, unit: "%" },
  { field: "x", label: "Pan Horizontal (X)", min: -300, max: 300, unit: "px" },
  { field: "y", label: "Pan Vertical (Y)", min: -400, max: 400, unit: "px" },
] as const;

export function AdminShowroomStudioTryOnControls({
  pose,
  setPose,
  hasCutout,
  sizeScale,
  setSizeScale,
  splitRatio,
  setSplitRatio,
  blendLighting,
  setBlendLighting,
  onReset,
  modelTransform,
  setModelTransform,
  onResetModel,
  activeTab,
  setActiveTab,
  products = [],
  productId,
  onSelectProduct,
  colours = [],
  selectedColour = "",
  onSelectColour,
}: AdminShowroomStudioTryOnControlsProps) {
  const t = useTranslations("studio");
  const availableColours = Array.from(new Set([...colours, "Black", "Navy", "Blue", "White", "Olive", "Red"]));

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      {/* Active Layer Tabs */}
      <div className="flex rounded-lg border border-border bg-subtle p-1">
        <button
          type="button"
          onClick={() => setActiveTab("garment")}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
            activeTab === "garment"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          👕 Adjust Garment / Cloth
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("model")}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
            activeTab === "model"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          👤 Adjust User Photo / Model
        </button>
      </div>

      {activeTab === "garment" ? (
        <>
          {/* Garment / Shirt / T-Shirt Switcher */}
          {products.length > 0 && onSelectProduct && (
            <div className="space-y-1">
              <label htmlFor="garment-select" className="text-xs font-medium text-foreground">
                Choose Shirt / Garment:
              </label>
              <select
                id="garment-select"
                value={productId}
                onChange={(e) => onSelectProduct(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Colour Swatches */}
          {onSelectColour && (
            <div className="space-y-1.5 border-t border-border pt-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">Garment Colour:</span>
                <span className="rounded bg-subtle px-1.5 py-0.5 font-medium text-foreground">{selectedColour || "Default"}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {availableColours.map((c) => {
                  const p = getGarmentColorPalette(c);
                  const isSel = selectedColour.trim().toLowerCase() === c.trim().toLowerCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onSelectColour(c)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-all ${
                        isSel ? "bg-primary text-primary-foreground shadow-sm" : "border border-border bg-subtle text-foreground hover:bg-muted"
                      }`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full border border-black/20 shrink-0" style={{ backgroundColor: p.primary }} />
                      <span>{c}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fit & Size simulation */}
          <div className="space-y-2 border-t border-border pt-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Garment Fit / Size:</span>
              <span className="text-xs text-muted-foreground">
                {SIZES.find((s) => s.scale === sizeScale)?.desc ?? "Custom"} ({(sizeScale * 100).toFixed(0)}%)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setSizeScale(s.scale)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    sizeScale === s.scale
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-border bg-subtle text-foreground hover:bg-muted"
                  }`}
                >
                  {s.label} <span className="opacity-75">({s.desc})</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2.5D Lighting & Depth Toggle */}
          <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-foreground">
              <input
                type="checkbox"
                checked={blendLighting}
                onChange={(e) => setBlendLighting(e.target.checked)}
                className="rounded border-border accent-primary"
              />
              <span>Realistic 2.5D Lighting & Body Contour</span>
            </label>
            <span className="text-xs text-muted-foreground">Depth Shadow & Highlight</span>
          </div>

          {/* Position & Scale Sliders */}
          <div className="border-t border-border pt-3">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Garment Position & Scale:</span>
              <Button className="min-h-8 px-2.5 py-1 text-xs" onClick={onReset}>
                {t("message077")}
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["x", "y", "width", "height", "rotation"] as const).map((f) => (
                <label key={f} className="flex flex-col text-xs text-foreground">
                  <span className="flex justify-between">
                    <span>{{ x: t("message089"), y: t("message090"), width: t("message091"), height: t("message092"), rotation: t("message093") }[f]}</span>
                    <span className="font-mono text-muted-foreground">{Math.round(pose[f])}{f === "rotation" ? "°" : "px"}</span>
                  </span>
                  <input
                    type="range"
                    min={f === "rotation" ? -180 : f === "width" || f === "height" ? 20 : 0}
                    max={f === "rotation" ? 180 : f === "y" || f === "height" ? 800 : 600}
                    value={pose[f]} disabled={!hasCutout}
                    onChange={(e) => setPose({ ...pose, [f]: Number(e.target.value) })}
                    className="mt-1 w-full cursor-pointer accent-primary"
                  />
                </label>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Model / User Photo Adjustments */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">User Photo / Model Adjustments:</span>
            <Button className="min-h-8 px-2.5 py-1 text-xs" onClick={onResetModel}>
              Reset Photo
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Adjust your photo zoom, position, and proportions so your shoulders and chest align naturally with the canvas. You can also drag the photo directly.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 border-t border-border pt-3">
            {MODEL_FIELDS.map(({ field, label, min, max, unit }) => (
              <label key={field} className="flex flex-col text-xs text-foreground">
                <span className="flex justify-between">
                  <span>{label}</span>
                  <span className="font-mono text-muted-foreground">{Math.round(modelTransform[field])}{unit}</span>
                </span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  value={modelTransform[field]}
                  onChange={(e) => setModelTransform({ ...modelTransform, [field]: Number(e.target.value) })}
                  className="mt-1 w-full cursor-pointer accent-primary"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Before / After Split Slider (Common to both) */}
      <div className="space-y-2 border-t border-border pt-3">
        <div className="flex items-center justify-between text-sm">
          <label htmlFor="split-slider" className="font-medium text-foreground">Before / After Comparison:</label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setSplitRatio(splitRatio < 0.99 ? 1.0 : 0.5)} className="text-xs text-primary underline hover:opacity-80">
              {splitRatio < 0.99 ? "Show Full Try-On" : "Split 50/50"}
            </button>
            <span className="text-xs text-muted-foreground">{Math.round(splitRatio * 100)}%</span>
          </div>
        </div>
        <input
          id="split-slider" type="range" min={0} max={100} value={Math.round(splitRatio * 100)}
          onChange={(e) => setSplitRatio(Number(e.target.value) / 100)} className="w-full cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>Original Model (0%)</span><span>50/50 Split</span><span>Full Garment (100%)</span>
        </div>
      </div>
    </div>
  );
}
