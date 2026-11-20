"use client";
import { studioText as t } from "@/app/frontend_admin/admin_showroom/showroom_studio/utils/AdminShowroomStudioMessages";
import { useEffect, useState, type RefObject } from "react";
import { loadImage } from "@/app/frontend_admin/admin_showroom/showroom_studio/utils/AdminShowroomStudioPhoto";
import {
  DEFAULT_MODEL_TRANSFORM,
  type ModelTransform,
} from "@/app/frontend_admin/admin_showroom/showroom_studio/components/AdminShowroomStudioTryOnControls";

export function useAdminShowroomStudioCanvas(
  canvas: RefObject<HTMLCanvasElement | null>,
  photo: string,
  src: string | undefined,
  pose: { x: number; y: number; width: number; height: number; rotation: number },
  show: boolean,
  anchors: { x: number; y: number }[],
  marking: boolean,
  splitRatio = 1,
  blendLighting = true,
  sizeScale = 1,
  modelTransform: ModelTransform = DEFAULT_MODEL_TRANSFORM,
) {
  const [bg, setBg] = useState<{ source: string; image: HTMLImageElement } | null>(null);
  const [item, setItem] = useState<{ source: string; image: HTMLImageElement } | null>(null);
  const [failure, setFailure] = useState<{ source: string; message: string } | null>(null);

  const bgSource = photo || "/images/style-mannequin.svg";
  const background = bg?.source === bgSource ? bg.image : null;
  const garment = item && item.source === src ? item.image : null;

  useEffect(() => {
    let active = true;
    loadImage(bgSource)
      .then((image) => { if (active) setBg({ source: bgSource, image }); })
      .catch(() => { if (active) setFailure({ source: bgSource, message: t("message127") }); });
    return () => { active = false; };
  }, [bgSource]);

  useEffect(() => {
    let active = true;
    if (src) {
      loadImage(src)
        .then((image) => { if (active) setItem({ source: src, image }); })
        .catch(() => { if (active) setFailure({ source: src, message: t("message128") }); });
    } else {
      setItem(null);
    }
    return () => { active = false; };
  }, [src]);

  useEffect(() => {
    const c = canvas.current, ctx = c?.getContext("2d");
    if (!ctx || !c) return;

    ctx.clearRect(0, 0, 600, 800);
    if (!background) return;

    const scale = Math.min(600 / background.width, 800 / background.height);
    const baseW = background.width * scale;
    const baseH = background.height * scale;
    const effZoom = (modelTransform.zoom || 100) / 100;
    const effW = baseW * effZoom * ((modelTransform.width || 100) / 100);
    const effH = baseH * effZoom * ((modelTransform.height || 100) / 100);

    ctx.save();
    ctx.translate(300 + (modelTransform.x || 0), 400 + (modelTransform.y || 0));
    if (modelTransform.rotation) {
      ctx.rotate((modelTransform.rotation * Math.PI) / 180);
    }
    ctx.drawImage(background, -effW / 2, -effH / 2, effW, effH);
    ctx.restore();

    if (garment && show) {
      const effW = pose.width * sizeScale, effH = pose.height * sizeScale;
      const splitX = 600 * splitRatio;

      ctx.save();
      if (splitRatio < 0.999) {
        ctx.beginPath();
        ctx.rect(splitX, 0, 600 - splitX, 800);
        ctx.clip();
      }

      ctx.save();
      ctx.translate(pose.x, pose.y);
      ctx.rotate((pose.rotation * Math.PI) / 180);
      ctx.drawImage(garment, -effW / 2, -effH / 2, effW, effH);
      ctx.restore();
      ctx.restore();

      if (splitRatio < 0.999 && splitRatio > 0.001) {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(splitX, 0);
        ctx.lineTo(splitX, 800);
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(splitX, 400, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = "bold 11px system-ui, sans-serif";
        ctx.fillStyle = "#334155";
        ctx.textAlign = "right";
        ctx.fillText("BEFORE", Math.max(50, splitX - 10), 28);
        ctx.textAlign = "left";
        ctx.fillText("AFTER", Math.min(550, splitX + 10), 28);
        ctx.restore();
      }
    }

    if (marking) {
      ctx.fillStyle = "#1e3a8a";
      ctx.font = "bold 18px system-ui, sans-serif";
      anchors.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.fillText(String(i + 1), p.x - 5, p.y + 6);
        ctx.fillStyle = "#1e3a8a";
      });
    }
  }, [canvas, background, garment, pose, show, anchors, marking, splitRatio, blendLighting, sizeScale, modelTransform]);

  return {
    background,
    garment,
    renderError: failure && (failure.source === bgSource || failure.source === src) ? failure.message : "",
  };
}
