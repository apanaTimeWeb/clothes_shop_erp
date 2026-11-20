"use client";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";

export interface StudioPose {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

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
}

const SIZES = [
  { label: "S", scale: 0.94, desc: "Slim" },
  { label: "M", scale: 1.0, desc: "Regular" },
  { label: "L", scale: 1.06, desc: "Comfort" },
  { label: "XL", scale: 1.12, desc: "Relaxed" },
  { label: "XXL", scale: 1.18, desc: "Oversized" },
];

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
}: AdminShowroomStudioTryOnControlsProps) {
  const t = useTranslations("studio");

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      {/* Fit & Size simulation */}
      <div className="space-y-2">
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

      {/* Before / After Split Slider */}
      <div className="space-y-2 border-t border-border pt-3">
        <div className="flex items-center justify-between text-sm">
          <label htmlFor="split-slider" className="font-medium text-foreground">
            Before / After Comparison:
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSplitRatio(splitRatio < 0.99 ? 1.0 : 0.5)}
              className="text-xs text-primary underline hover:opacity-80"
            >
              {splitRatio < 0.99 ? "Show Full Try-On" : "Split 50/50"}
            </button>
            <span className="text-xs text-muted-foreground">{Math.round(splitRatio * 100)}%</span>
          </div>
        </div>
        <input
          id="split-slider"
          type="range"
          min={0}
          max={100}
          value={Math.round(splitRatio * 100)}
          onChange={(e) => setSplitRatio(Number(e.target.value) / 100)}
          className="w-full cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>Original Model (0%)</span>
          <span>50/50 Split</span>
          <span>Full Garment (100%)</span>
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
          <span className="font-medium text-foreground">Position & Orientation:</span>
          <Button className="min-h-8 px-2.5 py-1 text-xs" onClick={onReset}>
            {t("message077")}
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["x", "y", "width", "height", "rotation"] as const).map((field) => (
            <label key={field} className="flex flex-col text-xs text-foreground">
              <span className="flex justify-between">
                <span>
                  {{
                    x: t("message089"),
                    y: t("message090"),
                    width: t("message091"),
                    height: t("message092"),
                    rotation: t("message093"),
                  }[field]}
                </span>
                <span className="font-mono text-muted-foreground">
                  {Math.round(pose[field])}
                  {field === "rotation" ? "°" : "px"}
                </span>
              </span>
              <input
                type="range"
                min={field === "rotation" ? -180 : field === "width" || field === "height" ? 20 : 0}
                max={field === "rotation" ? 180 : field === "y" || field === "height" ? 800 : 600}
                value={pose[field]}
                disabled={!hasCutout}
                onChange={(e) => setPose({ ...pose, [field]: Number(e.target.value) })}
                className="mt-1 w-full cursor-pointer accent-primary"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
