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
