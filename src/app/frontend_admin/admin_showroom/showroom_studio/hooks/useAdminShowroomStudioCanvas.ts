"use client";
import { studioText as t } from "@/app/frontend_admin/admin_showroom/showroom_studio/utils/AdminShowroomStudioMessages";
import { useEffect, useState, type RefObject } from "react";
import {
  loadImage,
  type StudioPose,
  type WornGarmentItem,
} from "@/app/frontend_admin/admin_showroom/showroom_studio/utils/AdminShowroomStudioPhoto";
import {
  DEFAULT_MODEL_TRANSFORM,
  type ModelTransform,
} from "@/app/frontend_admin/admin_showroom/showroom_studio/components/AdminShowroomStudioTryOnControls";
import {
  drawSkeleton,
  type DetectedSkeleton,
} from "@/app/frontend_admin/admin_showroom/showroom_studio/utils/AdminShowroomStudioPoseDetector";

type Pose = StudioPose;

function drawGarment(ctx: CanvasRenderingContext2D, img: HTMLImageElement, pose: Pose, scale: number, splitX: number, splitRatio: number, blend: boolean) {
  const w = pose.width * scale, h = pose.height * scale;
  ctx.save();
  if (splitRatio < 0.999) { ctx.beginPath(); ctx.rect(splitX, 0, 600 - splitX, 800); ctx.clip(); }
  ctx.save();
  ctx.translate(pose.x, pose.y); ctx.rotate((pose.rotation * Math.PI) / 180);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  if (blend) {
    const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    grad.addColorStop(0, "rgba(0,0,0,0.16)"); grad.addColorStop(0.3, "rgba(255,255,255,0.14)");
    grad.addColorStop(0.5, "rgba(255,255,255,0.20)"); grad.addColorStop(0.7, "rgba(255,255,255,0.10)");
    grad.addColorStop(1, "rgba(0,0,0,0.22)");
    ctx.globalCompositeOperation = "source-atop"; ctx.fillStyle = grad; ctx.fillRect(-w / 2, -h / 2, w, h);
  }
  ctx.restore(); ctx.restore();
}

function drawActiveBox(ctx: CanvasRenderingContext2D, pose: Pose, scale: number, isBottom = false) {
  const w = pose.width * scale, h = pose.height * scale;
  ctx.save(); ctx.translate(pose.x, pose.y); ctx.rotate((pose.rotation * Math.PI) / 180);
  ctx.strokeStyle = "rgba(37, 99, 235, 0.85)"; ctx.lineWidth = 1.75; ctx.setLineDash([5, 4]);
  ctx.strokeRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6);
  // Joint / Stretch Handle Dots
  ctx.setLineDash([]); ctx.fillStyle = "#2563eb"; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
  const handles = isBottom
    ? [{ x: 0, y: -h / 2 }, { x: -w * 0.35, y: h / 2 }, { x: w * 0.35, y: h / 2 }] // Waist, Left Cuff, Right Cuff
    : [{ x: -w * 0.42, y: -h * 0.1 }, { x: w * 0.42, y: -h * 0.1 }, { x: 0, y: -h * 0.4 }]; // Left Arm, Right Arm, Collar
  handles.forEach((p) => { ctx.beginPath(); ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
  ctx.restore();
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
  wornItems: WornGarmentItem[],
  show = true,
  anchors: { x: number; y: number }[] = [],
  marking = false,
  splitRatio = 1,
  blendLighting = true,
  modelTransform: ModelTransform = DEFAULT_MODEL_TRANSFORM,
  activeInstanceId = "",
  tuckedIn = false,
  skeleton: DetectedSkeleton | null = null,
  showSkeleton = false,
) {
  const [bg, setBg] = useState<{ source: string; image: HTMLImageElement } | null>(null);
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});
  const [failure, setFailure] = useState<string>("");

  const bgSource = photo || "/images/style-mannequin.svg";
  const background = bg?.source === bgSource ? bg.image : null;

  useEffect(() => {
    let a = true;
    loadImage(bgSource)
      .then((img) => { if (a) setBg({ source: bgSource, image: img }); })
      .catch(() => { if (a) setFailure(t("message127")); });
    return () => { a = false; };
  }, [bgSource]);

  useEffect(() => {
    let a = true;
    wornItems.forEach((w) => {
      if (w.src && !images[w.src]) {
        loadImage(w.src)
          .then((img) => { if (a) setImages((prev) => ({ ...prev, [w.src]: img })); })
          .catch(() => { if (a) setFailure(t("message128")); });
      }
    });
    return () => { a = false; };
  }, [wornItems]);

  useEffect(() => {
    const c = canvas.current, ctx = c?.getContext("2d");
    if (!ctx || !c || !background) { if (ctx && c) ctx.clearRect(0, 0, 600, 800); return; }
    ctx.clearRect(0, 0, 600, 800);

    const scale = Math.min(600 / background.width, 800 / background.height), effZoom = (modelTransform.zoom || 100) / 100;
    const effW = background.width * scale * effZoom * ((modelTransform.width || 100) / 100);
    const effH = background.height * scale * effZoom * ((modelTransform.height || 100) / 100);

    ctx.save();
    ctx.translate(300 + (modelTransform.x || 0), 400 + (modelTransform.y || 0));
    if (modelTransform.rotation) ctx.rotate((modelTransform.rotation * Math.PI) / 180);
    ctx.drawImage(background, -effW / 2, -effH / 2, effW, effH);
    ctx.restore();

    if (showSkeleton && skeleton) drawSkeleton(ctx, skeleton);

    const splitX = 600 * splitRatio;

    if (show && wornItems.length > 0) {
      const sorted = [...wornItems].sort((a, b) => {
        if (tuckedIn) return a.category === "top" ? -1 : 1;
        return a.category === "bottom" ? -1 : 1;
      });

      sorted.forEach((item) => {
        const img = images[item.src];
        if (img) {
          drawGarment(ctx, img, item.pose, item.scale, splitX, splitRatio, blendLighting);
          if (item.instanceId === activeInstanceId) drawActiveBox(ctx, item.pose, item.scale, item.category === "bottom");
        }
      });
    }

    if (splitRatio < 0.999 && splitRatio > 0.001) drawSplitLine(ctx, splitX);

    if (marking) {
      ctx.fillStyle = "#1e3a8a"; ctx.font = "bold 18px system-ui, sans-serif";
      anchors.forEach((p, i) => {
        ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.fillText(String(i + 1), p.x - 5, p.y + 6); ctx.fillStyle = "#1e3a8a";
      });
    }
  }, [canvas, background, wornItems, images, show, anchors, marking, splitRatio, blendLighting, modelTransform, activeInstanceId, tuckedIn, skeleton, showSkeleton]);

  return { background, renderError: failure };
}
