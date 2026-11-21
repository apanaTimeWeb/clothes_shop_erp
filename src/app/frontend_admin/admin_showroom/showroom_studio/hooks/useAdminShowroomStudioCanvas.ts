"use client";
import { studioText as t } from "@/app/frontend_admin/admin_showroom/showroom_studio/utils/AdminShowroomStudioMessages";
import { useEffect, useState, type RefObject } from "react";
import { loadImage } from "@/app/frontend_admin/admin_showroom/showroom_studio/utils/AdminShowroomStudioPhoto";
import {
  DEFAULT_MODEL_TRANSFORM,
  type ModelTransform,
} from "@/app/frontend_admin/admin_showroom/showroom_studio/components/AdminShowroomStudioTryOnControls";

type Pose = { x: number; y: number; width: number; height: number; rotation: number };

function drawGarment(ctx: CanvasRenderingContext2D, img: HTMLImageElement, pose: Pose, scale: number, splitX: number, splitRatio: number, blend: boolean) {
  const w = pose.width * scale, h = pose.height * scale;
  ctx.save();
  if (splitRatio < 0.999) { ctx.beginPath(); ctx.rect(splitX, 0, 600 - splitX, 800); ctx.clip(); }
  ctx.save();
  ctx.translate(pose.x, pose.y);
  ctx.rotate((pose.rotation * Math.PI) / 180);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  if (blend) {
    const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    grad.addColorStop(0, "rgba(0,0,0,0.16)"); grad.addColorStop(0.3, "rgba(255,255,255,0.14)");
    grad.addColorStop(0.5, "rgba(255,255,255,0.20)"); grad.addColorStop(0.7, "rgba(255,255,255,0.10)");
    grad.addColorStop(1, "rgba(0,0,0,0.22)");
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = grad;
    ctx.fillRect(-w / 2, -h / 2, w, h);
  }
  ctx.restore();
  ctx.restore();
}

function drawActiveBox(ctx: CanvasRenderingContext2D, pose: Pose, scale: number) {
  const w = pose.width * scale, h = pose.height * scale;
  ctx.save(); ctx.translate(pose.x, pose.y); ctx.rotate((pose.rotation * Math.PI) / 180);
  ctx.strokeStyle = "rgba(59, 130, 246, 0.75)"; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
  ctx.strokeRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6); ctx.restore();
}

function drawSplitLine(ctx: CanvasRenderingContext2D, splitX: number) {
  ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.95)"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(splitX, 0); ctx.lineTo(splitX, 800); ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(splitX, 400, 14, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.font = "bold 11px system-ui, sans-serif"; ctx.fillStyle = "#334155";
  ctx.textAlign = "right"; ctx.fillText("BEFORE", Math.max(50, splitX - 10), 28);
  ctx.textAlign = "left"; ctx.fillText("AFTER", Math.min(550, splitX + 10), 28);
  ctx.restore();
}

export function useAdminShowroomStudioCanvas(
  canvas: RefObject<HTMLCanvasElement | null>,
  photo: string,
  src: string | undefined,
  pose: Pose,
  show: boolean,
  anchors: { x: number; y: number }[],
  marking: boolean,
  splitRatio = 1,
  blendLighting = true,
  sizeScale = 1,
  modelTransform: ModelTransform = DEFAULT_MODEL_TRANSFORM,
  bottomSrc?: string,
  bottomPose?: Pose,
  showBottom = true,
  bottomScale = 1,
  activeLayer: "top" | "bottom" | "model" = "top",
) {
  const [bg, setBg] = useState<{ source: string; image: HTMLImageElement } | null>(null);
  const [item, setItem] = useState<{ source: string; image: HTMLImageElement } | null>(null);
  const [bottomItem, setBottomItem] = useState<{ source: string; image: HTMLImageElement } | null>(null);
  const [failure, setFailure] = useState<{ source: string; message: string } | null>(null);

  const bgSource = photo || "/images/style-mannequin.svg";
  const background = bg?.source === bgSource ? bg.image : null;
  const garment = item && item.source === src ? item.image : null;
  const bottomGarment = bottomItem && bottomItem.source === bottomSrc ? bottomItem.image : null;

  useEffect(() => {
    let a = true;
    loadImage(bgSource).then((img) => { if (a) setBg({ source: bgSource, image: img }); }).catch(() => { if (a) setFailure({ source: bgSource, message: t("message127") }); });
    return () => { a = false; };
  }, [bgSource]);

  useEffect(() => {
    let a = true;
    if (src) {
      loadImage(src).then((img) => { if (a) setItem({ source: src, image: img }); }).catch(() => { if (a) setFailure({ source: src, message: t("message128") }); });
    } else { setItem(null); }
    return () => { a = false; };
  }, [src]);

  useEffect(() => {
    let a = true;
    if (bottomSrc) {
      loadImage(bottomSrc).then((img) => { if (a) setBottomItem({ source: bottomSrc, image: img }); }).catch(() => { if (a) setFailure({ source: bottomSrc, message: t("message128") }); });
    } else { setBottomItem(null); }
    return () => { a = false; };
  }, [bottomSrc]);

  useEffect(() => {
    const c = canvas.current, ctx = c?.getContext("2d");
    if (!ctx || !c) return;
    ctx.clearRect(0, 0, 600, 800);
    if (!background) return;

    const scale = Math.min(600 / background.width, 800 / background.height);
    const effZoom = (modelTransform.zoom || 100) / 100;
    const effW = background.width * scale * effZoom * ((modelTransform.width || 100) / 100);
    const effH = background.height * scale * effZoom * ((modelTransform.height || 100) / 100);

    ctx.save();
    ctx.translate(300 + (modelTransform.x || 0), 400 + (modelTransform.y || 0));
    if (modelTransform.rotation) ctx.rotate((modelTransform.rotation * Math.PI) / 180);
    ctx.drawImage(background, -effW / 2, -effH / 2, effW, effH);
    ctx.restore();

    const splitX = 600 * splitRatio;

    if (bottomGarment && showBottom && bottomPose) {
      drawGarment(ctx, bottomGarment, bottomPose, bottomScale, splitX, splitRatio, blendLighting);
      if (activeLayer === "bottom") drawActiveBox(ctx, bottomPose, bottomScale);
    }

    if (garment && show) {
      drawGarment(ctx, garment, pose, sizeScale, splitX, splitRatio, blendLighting);
      if (activeLayer === "top") drawActiveBox(ctx, pose, sizeScale);
    }

    if (splitRatio < 0.999 && splitRatio > 0.001) drawSplitLine(ctx, splitX);

    if (marking) {
      ctx.fillStyle = "#1e3a8a"; ctx.font = "bold 18px system-ui, sans-serif";
      anchors.forEach((p, i) => {
        ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.fillText(String(i + 1), p.x - 5, p.y + 6); ctx.fillStyle = "#1e3a8a";
      });
    }
  }, [canvas, background, garment, bottomGarment, pose, bottomPose, show, showBottom, anchors, marking, splitRatio, blendLighting, sizeScale, bottomScale, modelTransform, activeLayer]);

  return {
    background,
    garment,
    bottomGarment,
    renderError: failure && (failure.source === bgSource || failure.source === src || failure.source === bottomSrc) ? failure.message : "",
  };
}
