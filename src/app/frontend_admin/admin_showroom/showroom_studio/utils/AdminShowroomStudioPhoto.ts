import { studioText as t } from "@/app/frontend_admin/admin_showroom/showroom_studio/utils/AdminShowroomStudioMessages";

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(t("message133")));
    image.src = src;
  });
}

export async function readPhoto(file: File, cutout = false): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10000000)
    throw Error(t("message134"));
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    if (!image.width || !image.height || image.width * image.height > 40000000) throw Error(t("message135"));
    const scale = Math.min(1, 1000 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw Error(t("message136"));
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    if (cutout) {
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let clear = 0, visible = 0;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] < 10) clear++;
        if (pixels[i] > 100) visible++;
      }
      if (clear < canvas.width * canvas.height * 0.05 || visible < canvas.width * canvas.height * 0.01)
        throw Error(t("message137"));
    }
    const data = canvas.toDataURL(cutout ? "image/png" : "image/jpeg", 0.88);
    if (cutout && data.length > 1200000) throw Error(t("message138"));
    return data;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadImage(canvas: HTMLCanvasElement) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "style-preview.png";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}

export type GarmentCategory = "top" | "bottom" | "dress" | "accessory";

export function detectGarmentCategory(categoryId?: string): GarmentCategory {
  if (!categoryId) return "top";
  const c = categoryId.toLowerCase();
  if (c.includes("jean") || c.includes("pant") || c.includes("trouser") || c.includes("short")) return "bottom";
  if (c.includes("dress") || c.includes("kurti") || c.includes("saree") || c.includes("set") || c.includes("gown")) return "dress";
  if (c.includes("belt") || c.includes("cap") || c.includes("sock") || c.includes("handkerchief") || c.includes("accessory") || c.includes("bag")) return "accessory";
  return "top";
}

const COLOR_MAP: Record<string, { primary: string; secondary: string; stroke: string }> = {
  black: { primary: "#18181b", secondary: "#09090b", stroke: "#27272a" },
  navy: { primary: "#1e3a8a", secondary: "#172554", stroke: "#1d4ed8" },
  olive: { primary: "#4d7c0f", secondary: "#365314", stroke: "#65a30d" },
  white: { primary: "#f8fafc", secondary: "#e2e8f0", stroke: "#cbd5e1" },
  blue: { primary: "#2563eb", secondary: "#1d4ed8", stroke: "#3b82f6" },
  pink: { primary: "#ec4899", secondary: "#be185d", stroke: "#f472b6" },
  "dark blue": { primary: "#1e293b", secondary: "#0f172a", stroke: "#334155" },
  sage: { primary: "#84a98c", secondary: "#52796f", stroke: "#a3b18a" },
  red: { primary: "#dc2626", secondary: "#991b1b", stroke: "#ef4444" },
  cream: { primary: "#fef3c7", secondary: "#fde68a", stroke: "#f59e0b" },
  beige: { primary: "#d4b996", secondary: "#b59a78", stroke: "#a3876a" },
  grey: { primary: "#64748b", secondary: "#475569", stroke: "#94a3b8" },
  brown: { primary: "#78350f", secondary: "#451a03", stroke: "#92400e" },
  charcoal: { primary: "#27272a", secondary: "#18181b", stroke: "#3f3f46" },
  green: { primary: "#15803d", secondary: "#14532d", stroke: "#16a34a" },
  yellow: { primary: "#eab308", secondary: "#ca8a04", stroke: "#facc15" },
  orange: { primary: "#ea580c", secondary: "#c2410c", stroke: "#f97316" },
  purple: { primary: "#7e22ce", secondary: "#581c87", stroke: "#9333ea" },
  maroon: { primary: "#831843", secondary: "#500724", stroke: "#9d174d" },
  khaki: { primary: "#c3b091", secondary: "#a8977b", stroke: "#8d7e67" },
};

export function getGarmentColorPalette(colour: string) {
  const key = colour.trim().toLowerCase();
  return COLOR_MAP[key] ?? { primary: "#64748b", secondary: "#475569", stroke: "#334155" };
}

export type BottomStyle = "jeans" | "trouser" | "cargo" | "shorts";

export interface StoreBottomItem {
  id: string;
  name: string;
  style: BottomStyle;
  defaultColour: string;
  colours: string[];
}

export interface StoreGarmentItem {
  id: string;
  name: string;
  category: "top" | "bottom";
  style: string;
  defaultColour: string;
  colours: string[];
}

export interface GarmentDeform {
  leftArmAngle: number;
  rightArmAngle: number;
  sleeveLength: number;
  chestStretch: number;
  legFlare: number;
  legLength: number;
  waistStretch: number;
}

export const DEFAULT_DEFORM: GarmentDeform = {
  leftArmAngle: 0,
  rightArmAngle: 0,
  sleeveLength: 100,
  chestStretch: 100,
  legFlare: 0,
  legLength: 100,
  waistStretch: 100,
};

export interface StudioPose {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  deform?: GarmentDeform;
}

export interface WornGarmentItem {
  instanceId: string;
  catalogId: string;
  name: string;
  category: "top" | "bottom";
  colour: string;
  style: string;
  src: string;
  pose: StudioPose;
  scale: number;
  deform?: GarmentDeform;
}

export const STORE_CATALOG_ITEMS: StoreGarmentItem[] = [
  { id: "top-linen-shirt", name: "Casual Linen Shirt", category: "top", style: "shirt", defaultColour: "Blue", colours: ["Blue", "Navy", "White", "Olive"] },
  { id: "top-crew-tshirt", name: "Cotton Crewneck T-Shirt", category: "top", style: "tshirt", defaultColour: "Black", colours: ["Black", "White", "Charcoal", "Red"] },
  { id: "top-oxford-shirt", name: "Classic Oxford Shirt", category: "top", style: "shirt", defaultColour: "White", colours: ["White", "Blue", "Pink", "Cream"] },
  { id: "top-polo-tshirt", name: "Slim Fit Polo T-Shirt", category: "top", style: "tshirt", defaultColour: "Navy", colours: ["Navy", "Olive", "Black", "Red"] },
  { id: "bot-straight-denim", name: "Straight Denim Jeans", category: "bottom", style: "jeans", defaultColour: "Blue", colours: ["Blue", "Dark Blue", "Black", "Grey"] },
  { id: "bot-relaxed-chinos", name: "Relaxed Chinos Pant", category: "bottom", style: "trouser", defaultColour: "Beige", colours: ["Beige", "Khaki", "Navy", "Olive", "Black"] },
  { id: "bot-urban-cargo", name: "Urban Utility Cargo", category: "bottom", style: "cargo", defaultColour: "Olive", colours: ["Olive", "Black", "Khaki", "Grey"] },
  { id: "bot-daily-denim", name: "Daily Stretch Denim", category: "bottom", style: "jeans", defaultColour: "Dark Blue", colours: ["Dark Blue", "Blue", "Black"] },
  { id: "bot-formal-trouser", name: "Studio Formal Trouser", category: "bottom", style: "trouser", defaultColour: "Black", colours: ["Black", "Charcoal", "Navy", "Grey"] },
  { id: "bot-casual-shorts", name: "Casual Half Pant / Shorts", category: "bottom", style: "shorts", defaultColour: "Khaki", colours: ["Khaki", "Navy", "Grey", "Blue", "Olive"] },
];

export const STORE_BOTTOMS: StoreBottomItem[] = STORE_CATALOG_ITEMS
  .filter((i) => i.category === "bottom")
  .map((i) => ({ id: i.id, name: i.name, style: i.style as BottomStyle, defaultColour: i.defaultColour, colours: i.colours }));

export function generateBottomCutoutSvg(style: BottomStyle, colour: string, deform?: GarmentDeform): string {
  const { primary, secondary, stroke } = getGarmentColorPalette(colour);
  const isShorts = style === "shorts", def = deform ?? DEFAULT_DEFORM;
  const legLen = (def.legLength || 100) / 100, waistOff = ((def.waistStretch || 100) - 100) * 0.35, flare = (def.legFlare || 0) * 0.5;
  const bottomY = Math.round((isShorts ? 200 : 297) * legLen), crotchY = isShorts ? 148 : 164;
  const wL = 131 - waistOff, wR = 229 + waistOff, rOut = 228 + flare, rIn = 184 + flare * 0.25, lIn = 171 - flare * 0.25, lOut = 126 - flare;
  const mainPath = `M${wL} 67 L${wR} 67 L236 150 L${rOut} ${bottomY} L${rIn} ${bottomY} L178 ${crotchY} L${lIn} ${bottomY} L${lOut} ${bottomY} L122 150Z`;
  let details = `<g fill="none" stroke="${stroke}" stroke-opacity="0.38" stroke-width="2"><path d="M${wL + 2} 83 H${wR - 2} M178 86 V150 M${lOut + 2} ${bottomY - 12} H${lIn - 2} M${rIn + 2} ${bottomY - 12} H${rOut - 2}"/></g>`;
  if (style === "cargo") {
    details += `<rect x="114" y="145" width="16" height="34" rx="3" fill="url(#cloth)" stroke="${stroke}" stroke-width="1.5"/><rect x="230" y="145" width="16" height="34" rx="3" fill="url(#cloth)" stroke="${stroke}" stroke-width="1.5"/><path d="M114 153 H130 M230 153 H246" stroke="${stroke}" stroke-width="1.5"/>`;
  } else if (style === "trouser") {
    details += `<line x1="152" y1="88" x2="${(lOut + lIn) / 2}" y2="${bottomY - 2}" stroke="${stroke}" stroke-width="1.5" stroke-opacity="0.4"/><line x1="208" y1="88" x2="${(rOut + rIn) / 2}" y2="${bottomY - 2}" stroke="${stroke}" stroke-width="1.5" stroke-opacity="0.4"/>`;
  } else if (style === "jeans") {
    details += `<path d="M132 108 Q150 118 168 83 M228 108 Q210 118 192 83" fill="none" stroke="#eab308" stroke-width="1.5" stroke-opacity="0.65"/><circle cx="134" cy="106" r="2" fill="#ca8a04"/><circle cx="226" cy="106" r="2" fill="#ca8a04"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="360" viewBox="0 0 360 360"><defs><linearGradient id="cloth" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${primary}"/><stop offset="100%" stop-color="${secondary}"/></linearGradient><linearGradient id="curv" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#000" stop-opacity="0.18"/><stop offset="25%" stop-color="#fff" stop-opacity="0.14"/><stop offset="50%" stop-color="#fff" stop-opacity="0.22"/><stop offset="75%" stop-color="#fff" stop-opacity="0.12"/><stop offset="100%" stop-color="#000" stop-opacity="0.22"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#0f172a" flood-opacity="0.35"/></filter></defs><path d="${mainPath}" fill="url(#cloth)" stroke="${stroke}" stroke-width="2" filter="url(#shadow)"/><path d="${mainPath}" fill="url(#curv)"/><g>${details}</g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function resolveBottomCutoutSrc(style: BottomStyle | string, colour: string, customOverlay?: string, deform?: GarmentDeform): { src: string; isRealPhoto: boolean } {
  if (customOverlay) return { src: customOverlay, isRealPhoto: false };
  const normColour = colour.trim().toLowerCase(), normStyle = (style || "jeans").toLowerCase();
  const hasManualDeform = deform && (
    Math.abs(deform.legFlare) > 15 ||
    Math.abs(deform.legLength - 100) > 15 ||
    Math.abs(deform.waistStretch - 100) > 15
  );
  if (!hasManualDeform && (normStyle.includes("jean") || normStyle.includes("denim")) && (normColour.includes("blue") || normColour.includes("navy") || normColour.includes("dark"))) {
    return { src: "/images/real-jeans-blue.png", isRealPhoto: true };
  }
  const s: BottomStyle = normStyle.includes("short") || normStyle.includes("half") ? "shorts" : normStyle.includes("cargo") ? "cargo" : normStyle.includes("trouser") || normStyle.includes("chino") ? "trouser" : "jeans";
  return { src: generateBottomCutoutSvg(s, colour, deform), isRealPhoto: false };
}

export function generateAutoCutoutSvg(category: GarmentCategory, colour: string, deform?: GarmentDeform, style?: string): string {
  if (category === "bottom") return generateBottomCutoutSvg("trouser", colour, deform);
  const { primary, secondary, stroke } = getGarmentColorPalette(colour);
  const def = deform ?? DEFAULT_DEFORM, cOff = ((def.chestStretch || 100) - 100) * 0.4, sLen = (def.sleeveLength || 100) / 100;
  const isTshirt = (style || "").toLowerCase().includes("tshirt") || (style || "").toLowerCase().includes("polo");
  const lDeg = ((def.leftArmAngle || 0) * Math.PI) / 180, rDeg = ((def.rightArmAngle || 0) * Math.PI) / 180;

  let mainPath = "", details = "";
  if (category === "dress") {
    mainPath = `M${150 - cOff} 67 Q180 83 ${210 + cOff} 67 L237 113 L213 128 L204 108 L200 153 L${249 + cOff} 281 Q180 307 ${111 - cOff} 281 L160 153 L156 108 L147 128 L123 113Z`;
    details = `<g fill="none" stroke="${stroke}" stroke-opacity="0.35" stroke-width="2"><path d="M159 153 Q180 162 201 153 M139 268 Q180 283 222 268"/></g>`;
  } else if (category === "accessory") {
    mainPath = "M131 100 L171 100 L171 209 Q172 226 146 239 L111 250 Q85 258 78 238 Q73 220 95 211 L131 194Z M194 83 L234 83 L234 192 Q235 209 209 222 L174 233 Q148 241 141 221 Q136 203 158 194 L194 177Z";
    details = `<g fill="none" stroke="${stroke}" stroke-opacity="0.35" stroke-width="2"><path d="M131 111 H171 M194 94 H234"/></g>`;
  } else if (isTshirt) {
    const armLen = 54 * sLen;
    const lOutX = Math.round(116 - Math.cos(lDeg) * 36 - Math.sin(lDeg) * armLen), lOutY = Math.round(88 - Math.sin(lDeg) * 36 + Math.cos(lDeg) * armLen);
    const lInX = Math.round(lOutX + Math.cos(lDeg) * 26), lInY = Math.round(lOutY + Math.sin(lDeg) * 26);
    const rOutX = Math.round(244 + Math.cos(rDeg) * 36 + Math.sin(rDeg) * armLen), rOutY = Math.round(88 - Math.sin(rDeg) * 36 + Math.cos(rDeg) * armLen);
    const rInX = Math.round(rOutX - Math.cos(rDeg) * 26), rInY = Math.round(rOutY + Math.sin(rDeg) * 26);
    const bY = 278;
    mainPath = `M154 68 Q180 88 206 68 L244 88 L${rOutX} ${rOutY} L${rInX} ${rInY} L234 148 L${228 + cOff} ${bY} Q180 ${bY + 10} ${132 - cOff} ${bY} L126 148 L${lInX} ${lInY} L${lOutX} ${lOutY}Z`;
    details = `<path d="M154 68 Q180 92 206 68" fill="none" stroke="${stroke}" stroke-width="3" stroke-opacity="0.4"/><path d="M${lOutX} ${lOutY} L${lInX} ${lInY} M${rInX} ${rInY} L${rOutX} ${rOutY}" fill="none" stroke="${stroke}" stroke-width="2" stroke-opacity="0.35"/><path d="M${136 - cOff} ${bY - 6} Q180 ${bY + 4} ${224 + cOff} ${bY - 6}" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-opacity="0.3"/>`;
  } else {
    const armLen = 108 * sLen;
    const lOutX = Math.round(116 - Math.cos(lDeg) * 34 - Math.sin(lDeg) * armLen), lOutY = Math.round(88 - Math.sin(lDeg) * 34 + Math.cos(lDeg) * armLen);
    const lInX = Math.round(lOutX + Math.cos(lDeg) * 24), lInY = Math.round(lOutY + Math.sin(lDeg) * 24);
    const rOutX = Math.round(244 + Math.cos(rDeg) * 34 + Math.sin(rDeg) * armLen), rOutY = Math.round(88 - Math.sin(rDeg) * 34 + Math.cos(rDeg) * armLen);
    const rInX = Math.round(rOutX - Math.cos(rDeg) * 24), rInY = Math.round(rOutY + Math.sin(rDeg) * 24);
    const bY = 295;
    mainPath = `M152 64 L172 100 L180 92 L188 100 L208 64 L244 86 L${rOutX} ${rOutY} L${rInX} ${rInY} L235 152 L${228 + cOff} ${bY} Q180 ${bY + 12} ${132 - cOff} ${bY} L125 152 L${lInX} ${lInY} L${lOutX} ${lOutY}Z`;
    details = `<path d="M152 64 L180 106 L208 64" fill="none" stroke="${stroke}" stroke-width="2.5" stroke-opacity="0.5"/><line x1="180" y1="106" x2="180" y2="${bY - 4}" stroke="${stroke}" stroke-width="2" stroke-opacity="0.4"/><circle cx="180" cy="125" r="2.5" fill="#f8fafc" stroke="${stroke}" stroke-width="1"/><circle cx="180" cy="155" r="2.5" fill="#f8fafc" stroke="${stroke}" stroke-width="1"/><circle cx="180" cy="185" r="2.5" fill="#f8fafc" stroke="${stroke}" stroke-width="1"/><circle cx="180" cy="215" r="2.5" fill="#f8fafc" stroke="${stroke}" stroke-width="1"/><line x1="${lOutX}" y1="${lOutY}" x2="${lInX}" y2="${lInY}" stroke="${stroke}" stroke-width="3" stroke-opacity="0.45"/><line x1="${rInX}" y1="${rInY}" x2="${rOutX}" y2="${rOutY}" stroke="${stroke}" stroke-width="3" stroke-opacity="0.45"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="360" viewBox="0 0 360 360"><defs><linearGradient id="cloth" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${primary}"/><stop offset="100%" stop-color="${secondary}"/></linearGradient><linearGradient id="curv" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#000" stop-opacity="0.18"/><stop offset="25%" stop-color="#fff" stop-opacity="0.14"/><stop offset="50%" stop-color="#fff" stop-opacity="0.22"/><stop offset="75%" stop-color="#fff" stop-opacity="0.12"/><stop offset="100%" stop-color="#000" stop-opacity="0.22"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#0f172a" flood-opacity="0.35"/></filter></defs><path d="${mainPath}" fill="url(#cloth)" stroke="${stroke}" stroke-width="2" filter="url(#shadow)"/><path d="${mainPath}" fill="url(#curv)"/><g>${details}</g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function resolveGarmentCutoutSrc(
  categoryId: string, colour: string, productName?: string, customOverlay?: string, deform?: GarmentDeform, style?: string,
): { src: string; isRealPhoto: boolean } {
  if (customOverlay) return { src: customOverlay, isRealPhoto: false };
  const normColour = colour.trim().toLowerCase(), category = detectGarmentCategory(categoryId);
  const st = (style || productName || "").toLowerCase();
  const isTshirt = st.includes("tshirt") || st.includes("polo") || st.includes("t-shirt") || st.includes("crewneck");
  const hasManualDeform = deform && (
    Math.abs(deform.leftArmAngle) > 22 ||
    Math.abs(deform.rightArmAngle) > 22 ||
    Math.abs(deform.sleeveLength - 100) > 18 ||
    Math.abs(deform.chestStretch - 100) > 18
  );
  if (!hasManualDeform && category === "top") {
    if (isTshirt && (normColour.includes("black") || normColour.includes("dark") || normColour.includes("charcoal"))) {
      return { src: "/images/real-tshirt-black.png", isRealPhoto: true };
    }
    if (!isTshirt && (normColour.includes("blue") || normColour.includes("navy"))) {
      return { src: "/images/real-shirt-blue.png", isRealPhoto: true };
    }
  }
  return { src: generateAutoCutoutSvg(category, colour, deform, isTshirt ? "tshirt" : "shirt"), isRealPhoto: false };
}

export function resolveGarmentItemCutoutSrc(
  category: "top" | "bottom", style: string, colour: string, name?: string, customOverlay?: string, deform?: GarmentDeform,
): { src: string; isRealPhoto: boolean } {
  if (category === "bottom") return resolveBottomCutoutSrc(style, colour, customOverlay, deform);
  return resolveGarmentCutoutSrc("top", colour, name, customOverlay, deform, style);
}

export const PRESETS: Record<GarmentCategory, StudioPose> = {
  top: { x: 300, y: 310, width: 250, height: 280, rotation: 0, deform: DEFAULT_DEFORM },
  bottom: { x: 300, y: 550, width: 220, height: 340, rotation: 0, deform: DEFAULT_DEFORM },
  dress: { x: 300, y: 400, width: 270, height: 460, rotation: 0, deform: DEFAULT_DEFORM },
  accessory: { x: 300, y: 140, width: 160, height: 90, rotation: 0, deform: DEFAULT_DEFORM },
};

export const PHOTO_PRESETS: Record<GarmentCategory, StudioPose> = {
  top: { x: 300, y: 310, width: 240, height: 270, rotation: 0, deform: DEFAULT_DEFORM },
  bottom: { x: 300, y: 550, width: 210, height: 340, rotation: 0, deform: DEFAULT_DEFORM },
  dress: { x: 300, y: 410, width: 260, height: 450, rotation: 0, deform: DEFAULT_DEFORM },
  accessory: { x: 300, y: 140, width: 160, height: 90, rotation: 0, deform: DEFAULT_DEFORM },
};

export function getStudioPreset(cat: GarmentCategory, model: string): StudioPose {
  const isPhoto = model.includes("photo");
  return (isPhoto ? PHOTO_PRESETS[cat] : PRESETS[cat]) ?? (isPhoto ? PHOTO_PRESETS.top : PRESETS.top);
}
