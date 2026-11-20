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
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 10000000
  )
    throw Error(t("message134"));
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    if (!image.width || !image.height || image.width * image.height > 40000000)
      throw Error(t("message135"));
    const scale = Math.min(1, 1000 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw Error(t("message136"));
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    if (cutout) {
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let clear = 0,
        visible = 0;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] < 10) clear++;
        if (pixels[i] > 100) visible++;
      }
      if (
        clear < canvas.width * canvas.height * 0.05 ||
        visible < canvas.width * canvas.height * 0.01
      )
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
};

export function getGarmentColorPalette(colour: string) {
  const key = colour.trim().toLowerCase();
  return COLOR_MAP[key] ?? { primary: "#64748b", secondary: "#475569", stroke: "#334155" };
}

export function generateAutoCutoutSvg(category: GarmentCategory, colour: string): string {
  const { primary, secondary, stroke } = getGarmentColorPalette(colour);
  let mainPath = "";
  let details = "";
  if (category === "bottom") {
    mainPath = "M131 67 L229 67 L236 152 L228 297 L184 297 L178 164 L171 297 L126 297 L122 151Z";
    details = `<g fill="none" stroke="${stroke}" stroke-opacity="0.35" stroke-width="2"><path d="M133 83 H227 M178 86 V155 M130 282 H169 M185 282 H229"/></g>`;
  } else if (category === "dress") {
    mainPath = "M150 67 Q180 83 210 67 L237 113 L213 128 L204 108 L200 153 L249 281 Q180 307 111 281 L160 153 L156 108 L147 128 L123 113Z";
    details = `<g fill="none" stroke="${stroke}" stroke-opacity="0.35" stroke-width="2"><path d="M159 153 Q180 162 201 153 M139 268 Q180 283 222 268"/></g>`;
  } else if (category === "accessory") {
    mainPath = "M131 100 L171 100 L171 209 Q172 226 146 239 L111 250 Q85 258 78 238 Q73 220 95 211 L131 194Z M194 83 L234 83 L234 192 Q235 209 209 222 L174 233 Q148 241 141 221 Q136 203 158 194 L194 177Z";
    details = `<g fill="none" stroke="${stroke}" stroke-opacity="0.35" stroke-width="2"><path d="M131 111 H171 M194 94 H234"/></g>`;
  } else {
    mainPath = "M119 83 L155 63 Q180 82 205 63 L241 83 L278 143 L239 165 L226 140 L230 289 Q180 301 130 289 L134 140 L121 165 L82 143Z";
    details = `<g fill="none" stroke="${stroke}" stroke-opacity="0.35" stroke-width="2"><path d="M155 63 L180 105 L205 63 M180 105 V170 M138 279 Q180 288 222 279"/></g><circle cx="180" cy="115" r="2.5" fill="${stroke}" opacity="0.6"/><circle cx="180" cy="135" r="2.5" fill="${stroke}" opacity="0.6"/><circle cx="180" cy="155" r="2.5" fill="${stroke}" opacity="0.6"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="360" viewBox="0 0 360 360"><defs><linearGradient id="cloth" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${primary}"/><stop offset="100%" stop-color="${secondary}"/></linearGradient><linearGradient id="curv" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#000" stop-opacity="0.18"/><stop offset="25%" stop-color="#fff" stop-opacity="0.14"/><stop offset="50%" stop-color="#fff" stop-opacity="0.22"/><stop offset="75%" stop-color="#fff" stop-opacity="0.12"/><stop offset="100%" stop-color="#000" stop-opacity="0.22"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#0f172a" flood-opacity="0.35"/></filter></defs><path d="${mainPath}" fill="url(#cloth)" stroke="${stroke}" stroke-width="2" filter="url(#shadow)"/><path d="${mainPath}" fill="url(#curv)"/><g>${details}</g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function resolveGarmentCutoutSrc(
  categoryId: string,
  colour: string,
  productName?: string,
  customOverlay?: string,
): { src: string; isRealPhoto: boolean } {
  if (customOverlay) return { src: customOverlay, isRealPhoto: false };
  const normColour = colour.trim().toLowerCase();
  const name = (productName || "").toLowerCase();

  if (
    (name.includes("polo") || name.includes("tee") || name.includes("t-shirt")) &&
    (normColour.includes("black") || normColour.includes("dark") || normColour.includes("charcoal"))
  ) {
    return { src: "/images/real-tshirt-black.png", isRealPhoto: true };
  }
  if (
    (name.includes("shirt") || name.includes("oxford")) &&
    (normColour.includes("blue") || normColour.includes("navy"))
  ) {
    return { src: "/images/real-shirt-blue.png", isRealPhoto: true };
  }

  const category = detectGarmentCategory(categoryId);
  return { src: generateAutoCutoutSvg(category, colour), isRealPhoto: false };
}

export interface StudioPose {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export const PRESETS: Record<GarmentCategory, StudioPose> = {
  top: { x: 300, y: 310, width: 250, height: 280, rotation: 0 },
  bottom: { x: 300, y: 550, width: 220, height: 340, rotation: 0 },
  dress: { x: 300, y: 400, width: 270, height: 460, rotation: 0 },
  accessory: { x: 300, y: 140, width: 160, height: 90, rotation: 0 },
};

export const PHOTO_PRESETS: Record<GarmentCategory, StudioPose> = {
  top: { x: 300, y: 540, width: 330, height: 360, rotation: 0 },
  bottom: { x: 300, y: 680, width: 280, height: 280, rotation: 0 },
  dress: { x: 300, y: 560, width: 340, height: 450, rotation: 0 },
  accessory: { x: 300, y: 220, width: 180, height: 110, rotation: 0 },
};

export function getStudioPreset(cat: GarmentCategory, model: string): StudioPose {
  const isPhoto = model.includes("photo");
  return (isPhoto ? PHOTO_PRESETS[cat] : PRESETS[cat]) ?? (isPhoto ? PHOTO_PRESETS.top : PRESETS.top);
}
