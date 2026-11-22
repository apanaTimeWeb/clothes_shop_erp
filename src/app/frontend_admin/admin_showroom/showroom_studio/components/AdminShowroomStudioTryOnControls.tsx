"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  getGarmentColorPalette, STORE_CATALOG_ITEMS, DEFAULT_DEFORM, resolveGarmentItemCutoutSrc,
  type StoreGarmentItem, type StudioPose, type WornGarmentItem, type GarmentDeform,
} from "@/app/frontend_admin/admin_showroom/showroom_studio/utils/AdminShowroomStudioPhoto";

export { type StudioPose };
export interface ModelTransform { x: number; y: number; zoom: number; width: number; height: number; rotation: number; }
export const DEFAULT_MODEL_TRANSFORM: ModelTransform = { x: 0, y: 0, zoom: 100, width: 100, height: 100, rotation: 0 };

interface AdminShowroomStudioTryOnControlsProps {
  trialRack: StoreGarmentItem[]; onAddToTrial: (item: StoreGarmentItem) => void;
  onRemoveFromTrial: (id: string) => void; onEquipItem: (item: StoreGarmentItem, colour?: string) => void;
  wornGarments: WornGarmentItem[]; activeInstanceId: string; setActiveInstanceId: (id: string) => void;
  onRemoveWorn: (instanceId: string) => void; activeGarment?: WornGarmentItem;
  onUpdateActivePose: React.Dispatch<React.SetStateAction<StudioPose>>;
  onUpdateActiveScale: (scale: number) => void; onUpdateActiveColour: (colour: string) => void;
  onResetActivePose: () => void; tuckedIn: boolean; setTuckedIn: (val: boolean) => void;
  blendLighting: boolean; setBlendLighting: (val: boolean) => void;
  splitRatio: number; setSplitRatio: (ratio: number) => void;
  modelTransform: ModelTransform; setModelTransform: React.Dispatch<React.SetStateAction<ModelTransform>>;
  onResetModel: () => void; activeTab: "rack" | "garment" | "model"; setActiveTab: (tab: "rack" | "garment" | "model") => void;
  onAutoAlignPose?: () => void; showSkeleton?: boolean; setShowSkeleton?: (v: boolean) => void;
  onUpdateActiveDeform?: (updater: (prev: GarmentDeform) => GarmentDeform) => void;
}

const SIZES = [
  { label: "S", scale: 0.94, desc: "Slim" }, { label: "M", scale: 1.0, desc: "Regular" },
  { label: "L", scale: 1.06, desc: "Comfort" }, { label: "XL", scale: 1.12, desc: "Relaxed" },
  { label: "XXL", scale: 1.18, desc: "Oversized" },
];
const MODEL_FIELDS = [
  { field: "zoom", label: "Zoom", min: 40, max: 250, unit: "%" }, { field: "rotation", label: "Straighten", min: -90, max: 90, unit: "°" },
  { field: "width", label: "Width", min: 50, max: 180, unit: "%" }, { field: "height", label: "Height", min: 50, max: 180, unit: "%" },
  { field: "x", label: "Pan X", min: -300, max: 300, unit: "px" }, { field: "y", label: "Pan Y", min: -400, max: 400, unit: "px" },
] as const;

export function AdminShowroomStudioTryOnControls({
  trialRack, onAddToTrial, onRemoveFromTrial, onEquipItem,
  wornGarments, activeInstanceId, setActiveInstanceId, onRemoveWorn,
  activeGarment, onUpdateActivePose, onUpdateActiveScale, onUpdateActiveColour, onResetActivePose,
  tuckedIn, setTuckedIn, blendLighting, setBlendLighting, splitRatio, setSplitRatio,
  modelTransform, setModelTransform, onResetModel, activeTab, setActiveTab,
  onAutoAlignPose, showSkeleton = false, setShowSkeleton, onUpdateActiveDeform,
}: AdminShowroomStudioTryOnControlsProps) {
  const [subTab, setSubTab] = useState<"position" | "stretch">("stretch");
  const storeNotTrial = STORE_CATALOG_ITEMS.filter((s) => !trialRack.some((t) => t.id === s.id));
  const curDeform = activeGarment?.pose.deform ?? DEFAULT_DEFORM;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex rounded-lg border border-border bg-subtle p-1 gap-1">
        {(["rack", "garment", "model"] as const).map((tab) => (
          <button
            key={tab} type="button" onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
              activeTab === tab ? "bg-card text-blue-600 shadow-sm border border-border/80" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "rack" ? `🛍️ Trial Rack (${trialRack.length})` : tab === "garment" ? `👗 Active Fit (${wornGarments.length})` : "👤 Model / Photo"}
          </button>
        ))}
      </div>

      {activeTab === "rack" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Trial Room Rack (Shortlist):</span>
            <span className="text-[11px] text-muted-foreground">Drag to body or click Try On</span>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {trialRack.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">Your Trial Rack is empty.</p>
            ) : (
              trialRack.map((item) => {
                const isWorn = wornGarments.some((w) => w.catalogId === item.id);
                const cutout = resolveGarmentItemCutoutSrc(item.category, item.style, item.defaultColour, item.name);
                return (
                  <div
                    key={item.id} draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/json", JSON.stringify(item));
                      e.dataTransfer.setData("text/plain", JSON.stringify(item));
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    className={`flex items-center justify-between rounded-lg border p-1.5 text-xs transition-all ${isWorn ? "border-blue-400/50 bg-blue-50/50" : "border-border bg-subtle hover:bg-muted"}`}
                  >
                    <div className="flex items-center gap-2 truncate cursor-grab active:cursor-grabbing">
                      <img src={cutout.src} alt={item.name} className="size-8 object-contain rounded bg-white/70 border border-border p-0.5 shrink-0" />
                      <div className="truncate"><span className="font-medium text-foreground block truncate">{item.name}</span><span className="text-[10px] text-muted-foreground">{item.style} • {item.defaultColour}</span></div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button" onClick={() => onEquipItem(item)}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${isWorn ? "border border-blue-500/40 bg-blue-100/70 text-blue-700" : "bg-blue-600 text-white shadow-sm hover:bg-blue-700"}`}
                      >{isWorn ? "✓ Wearing" : "+ Try On"}</button>
                      <button type="button" title="Remove" onClick={() => onRemoveFromTrial(item.id)} className="rounded p-1 text-muted-foreground hover:text-danger">✕</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {storeNotTrial.length > 0 && (
            <div className="border-t border-border pt-2.5 space-y-1.5">
              <span className="text-xs font-medium text-foreground">Add to Trial Rack from Store:</span>
              <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                {storeNotTrial.map((s) => {
                  const sCutout = resolveGarmentItemCutoutSrc(s.category, s.style, s.defaultColour, s.name);
                  return (
                    <button
                      key={s.id} type="button" onClick={() => onAddToTrial(s)}
                      className="flex items-center justify-between rounded-lg border border-border bg-subtle p-1.5 text-left text-xs hover:border-blue-500 hover:bg-blue-50/40"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <img src={sCutout.src} alt={s.name} className="size-6 object-contain rounded bg-white/60 shrink-0" />
                        <span className="truncate">{s.name}</span>
                      </div>
                      <span className="text-blue-600 font-bold ml-1 shrink-0">+</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "garment" && (
        <div className="space-y-3">
          {wornGarments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-5 text-center space-y-2">
              <p className="text-xs text-muted-foreground">No garments are currently worn on the model body.</p>
              <button type="button" onClick={() => setActiveTab("rack")} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">Go to Trial Rack</button>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <span className="text-xs font-medium text-foreground">Select Garment to Adjust:</span>
                <div className="flex flex-wrap gap-1.5">
                  {wornGarments.map((w) => (
                    <button
                      key={w.instanceId} type="button" onClick={() => setActiveInstanceId(w.instanceId)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                        activeInstanceId === w.instanceId ? "border-2 border-blue-600 bg-blue-50 text-blue-700 font-semibold shadow-sm" : "border border-border bg-subtle text-foreground hover:bg-muted"
                      }`}
                    ><span>{w.category === "top" ? "👕" : "👖"} {w.name}</span></button>
                  ))}
                </div>
              </div>

              {activeGarment && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-blue-50/70 p-2 border border-blue-200 dark:border-blue-900/40 dark:bg-blue-950/20">
                    <button type="button" onClick={onAutoAlignPose} className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95">
                      <span>🤖 Auto-Align to Model Pose</span>
                    </button>
                    {setShowSkeleton && (
                      <label className="flex items-center gap-1.5 text-xs text-foreground font-medium cursor-pointer">
                        <input type="checkbox" checked={showSkeleton} onChange={(e) => setShowSkeleton(e.target.checked)} className="rounded accent-blue-600" />
                        <span>Show Skeleton 🦴</span>
                      </label>
                    )}
                  </div>

                  <div className="flex rounded-md border border-border bg-subtle p-0.5 text-xs">
                    <button type="button" onClick={() => setSubTab("stretch")} className={`flex-1 rounded py-1 font-semibold transition-all ${subTab === "stretch" ? "bg-card text-blue-600 shadow-sm" : "text-muted-foreground"}`}>🦵 Joints & Stretch</button>
                    <button type="button" onClick={() => setSubTab("position")} className={`flex-1 rounded py-1 font-semibold transition-all ${subTab === "position" ? "bg-card text-blue-600 shadow-sm" : "text-muted-foreground"}`}>📐 Transform</button>
                  </div>

                  {subTab === "stretch" ? (
                    <div className="space-y-2 border-t border-border pt-2">
                      {activeGarment.category === "bottom" ? (
                        <>
                          <label className="flex flex-col text-[11px] text-foreground">
                            <span className="flex justify-between"><span>Leg Flare / Width:</span><span className="font-mono text-muted-foreground">{curDeform.legFlare > 0 ? `+${curDeform.legFlare}%` : curDeform.legFlare < 0 ? `${curDeform.legFlare}%` : "Regular"}</span></span>
                            <input type="range" min={-30} max={40} value={curDeform.legFlare} onChange={(e) => onUpdateActiveDeform?.((p) => ({ ...p, legFlare: Number(e.target.value) }))} className="mt-1 w-full cursor-pointer accent-blue-600" />
                          </label>
                          <label className="flex flex-col text-[11px] text-foreground">
                            <span className="flex justify-between"><span>Leg Length:</span><span className="font-mono text-muted-foreground">{curDeform.legLength}%</span></span>
                            <input type="range" min={75} max={135} value={curDeform.legLength} onChange={(e) => onUpdateActiveDeform?.((p) => ({ ...p, legLength: Number(e.target.value) }))} className="mt-1 w-full cursor-pointer accent-blue-600" />
                          </label>
                          <label className="flex flex-col text-[11px] text-foreground">
                            <span className="flex justify-between"><span>Waist & Hip Fit:</span><span className="font-mono text-muted-foreground">{curDeform.waistStretch}%</span></span>
                            <input type="range" min={80} max={130} value={curDeform.waistStretch} onChange={(e) => onUpdateActiveDeform?.((p) => ({ ...p, waistStretch: Number(e.target.value) }))} className="mt-1 w-full cursor-pointer accent-blue-600" />
                          </label>
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <label className="flex flex-col text-[11px] text-foreground">
                              <span className="flex justify-between"><span>L-Arm:</span><span className="font-mono text-muted-foreground">{curDeform.leftArmAngle}°</span></span>
                              <input type="range" min={-45} max={45} value={curDeform.leftArmAngle} onChange={(e) => onUpdateActiveDeform?.((p) => ({ ...p, leftArmAngle: Number(e.target.value) }))} className="mt-1 w-full cursor-pointer accent-blue-600" />
                            </label>
                            <label className="flex flex-col text-[11px] text-foreground">
                              <span className="flex justify-between"><span>R-Arm:</span><span className="font-mono text-muted-foreground">{curDeform.rightArmAngle}°</span></span>
                              <input type="range" min={-45} max={45} value={curDeform.rightArmAngle} onChange={(e) => onUpdateActiveDeform?.((p) => ({ ...p, rightArmAngle: Number(e.target.value) }))} className="mt-1 w-full cursor-pointer accent-blue-600" />
                            </label>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <label className="flex flex-col text-[11px] text-foreground">
                              <span className="flex justify-between"><span>Sleeve:</span><span className="font-mono text-muted-foreground">{curDeform.sleeveLength}%</span></span>
                              <input type="range" min={70} max={140} value={curDeform.sleeveLength} onChange={(e) => onUpdateActiveDeform?.((p) => ({ ...p, sleeveLength: Number(e.target.value) }))} className="mt-1 w-full cursor-pointer accent-blue-600" />
                            </label>
                            <label className="flex flex-col text-[11px] text-foreground">
                              <span className="flex justify-between"><span>Chest:</span><span className="font-mono text-muted-foreground">{curDeform.chestStretch}%</span></span>
                              <input type="range" min={80} max={130} value={curDeform.chestStretch} onChange={(e) => onUpdateActiveDeform?.((p) => ({ ...p, chestStretch: Number(e.target.value) }))} className="mt-1 w-full cursor-pointer accent-blue-600" />
                            </label>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="border-t border-border pt-2 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">Position & Size:</span>
                        <Button className="min-h-6 px-2 py-0 text-[10px]" onClick={onResetActivePose}>Reset</Button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {(["x", "y", "width", "height", "rotation"] as const).map((f) => (
                          <label key={f} className="flex flex-col text-[11px] text-foreground">
                            <span className="flex justify-between"><span className="capitalize">{f}</span><span className="font-mono text-muted-foreground">{Math.round(activeGarment.pose[f])}{f === "rotation" ? "°" : "px"}</span></span>
                            <input
                              type="range" min={f === "rotation" ? -180 : f === "width" || f === "height" ? 20 : 0}
                              max={f === "rotation" ? 180 : f === "y" || f === "height" ? 800 : 600}
                              value={activeGarment.pose[f]} onChange={(e) => onUpdateActivePose((p) => ({ ...p, [f]: Number(e.target.value) }))}
                              className="mt-1 w-full cursor-pointer accent-blue-600"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 border-t border-border pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">Colour & Size:</span>
                      <span className="text-muted-foreground">{activeGarment.colour} • {SIZES.find((s) => s.scale === activeGarment.scale)?.desc ?? "Custom"}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {["Blue", "Black", "Dark Blue", "Navy", "Beige", "Olive", "Grey", "White", "Red"].map((c) => {
                        const p = getGarmentColorPalette(c), isSel = activeGarment.colour.toLowerCase() === c.toLowerCase();
                        return (
                          <button
                            key={c} type="button" onClick={() => onUpdateActiveColour(c)}
                            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] ${isSel ? "border-2 border-blue-600 bg-blue-50 font-bold" : "border border-border bg-subtle"}`}
                          ><span className="h-2 w-2 rounded-full border border-black/20" style={{ backgroundColor: p.primary }} /><span>{c}</span></button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button" onClick={() => onRemoveWorn(activeGarment.instanceId)}
                    className="mt-2 w-full rounded-lg border border-danger/40 bg-danger/10 py-1.5 text-xs font-medium text-danger hover:bg-danger/20 transition-all"
                  >✖ Take Off {activeGarment.name} from Body</button>
                </>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "model" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Model & Photo:</span>
            <Button className="min-h-8 px-2.5 py-1 text-xs" onClick={onResetModel}>Reset Photo</Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 border-t border-border pt-3">
            {MODEL_FIELDS.map(({ field, label, min, max, unit }) => (
              <label key={field} className="flex flex-col text-xs text-foreground">
                <span className="flex justify-between"><span>{label}</span><span className="font-mono text-muted-foreground">{Math.round(modelTransform[field])}{unit}</span></span>
                <input
                  type="range" min={min} max={max} value={modelTransform[field]}
                  onChange={(e) => setModelTransform({ ...modelTransform, [field]: Number(e.target.value) })}
                  className="mt-1 w-full cursor-pointer accent-blue-600"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="font-medium text-foreground">Tuck Style:</span>
        <div className="flex rounded-lg border border-border bg-subtle p-0.5 text-xs">
          <button type="button" onClick={() => setTuckedIn(false)} className={`rounded px-2.5 py-1 font-semibold ${!tuckedIn ? "bg-card text-blue-600 shadow-sm border border-border/80" : "text-muted-foreground"}`}>Untucked</button>
          <button type="button" onClick={() => setTuckedIn(true)} className={`rounded px-2.5 py-1 font-semibold ${tuckedIn ? "bg-card text-blue-600 shadow-sm border border-border/80" : "text-muted-foreground"}`}>Tucked In</button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
        <label className="flex cursor-pointer items-center gap-2 text-foreground">
          <input type="checkbox" checked={blendLighting} onChange={(e) => setBlendLighting(e.target.checked)} className="rounded accent-blue-600" />
          <span>Realistic 2.5D Lighting & Body Contour</span>
        </label>
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <div className="flex items-center justify-between text-sm">
          <label htmlFor="split-slider" className="font-medium text-foreground">Before / After:</label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setSplitRatio(splitRatio < 0.99 ? 1.0 : 0.5)} className="text-xs text-blue-600 font-semibold hover:underline">{splitRatio < 0.99 ? "Full" : "50/50"}</button>
            <span className="text-xs text-muted-foreground">{Math.round(splitRatio * 100)}%</span>
          </div>
        </div>
        <input id="split-slider" type="range" min={0} max={100} value={Math.round(splitRatio * 100)} onChange={(e) => setSplitRatio(Number(e.target.value) / 100)} className="w-full cursor-pointer accent-blue-600" />
      </div>
    </div>
  );
}
