"use client";
import { studioText as t } from "@/app/frontend_admin/admin_showroom/showroom_studio/utils/AdminShowroomStudioMessages";
import { useEffect, useState, type RefObject } from "react";
import { loadImage } from "@/app/frontend_admin/admin_showroom/showroom_studio/utils/AdminShowroomStudioPhoto";
export function useAdminShowroomStudioCanvas(
  canvas: RefObject<HTMLCanvasElement | null>,
  photo: string,
  src: string | undefined,
  pose: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  },
  show: boolean,
  anchors: { x: number; y: number }[],
  marking: boolean,
) {
  const [bg, setBg] = useState<{
      source: string;
      image: HTMLImageElement;
    } | null>(null),
    [item, setItem] = useState<{
      source: string;
      image: HTMLImageElement;
    } | null>(null),
    [failure, setFailure] = useState<{
      source: string;
      message: string;
    } | null>(null);
  const bgSource = photo || "/images/style-mannequin.svg";
  const background = bg?.source === bgSource ? bg.image : null,
    garment = item && item.source === src ? item.image : null;
  useEffect(() => {
    let active = true;
    loadImage(bgSource)
      .then((image) => {
        if (active) setBg({ source: bgSource, image });
      })
      .catch(() => {
        if (active)
          setFailure({
            source: bgSource,
            message: t("message127"),
          });
      });
    return () => {
      active = false;
    };
  }, [bgSource]);
  useEffect(() => {
    let active = true;
    if (src)
      loadImage(src)
        .then((image) => {
          if (active) setItem({ source: src, image });
        })
        .catch(() => {
          if (active)
            setFailure({
              source: src,
              message: t("message128"),
            });
        });
    return () => {
      active = false;
    };
  }, [src]);
  useEffect(() => {
    const c = canvas.current,
      ctx = c?.getContext("2d");
    if (!ctx || !c) {
      return;
    }
    ctx.clearRect(0, 0, 600, 800);
    if (!background) return;
    const scale = Math.min(600 / background.width, 800 / background.height);
    ctx.drawImage(
      background,
      (600 - background.width * scale) / 2,
      (800 - background.height * scale) / 2,
      background.width * scale,
      background.height * scale,
    );
    if (garment && show) {
      ctx.save();
      ctx.translate(pose.x, pose.y);
      ctx.rotate((pose.rotation * Math.PI) / 180);
      ctx.drawImage(
        garment,
        -pose.width / 2,
        -pose.height / 2,
        pose.width,
        pose.height,
      );
      ctx.restore();
    }
    if (marking) {
      ctx.fillStyle = "navy";
      ctx.font = "20px sans-serif";
      anchors.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(String(i + 1), p.x + 10, p.y);
      });
    }
  }, [canvas, background, garment, pose, show, anchors, marking]);
  return {
    background,
    garment,
    renderError:
      failure && (failure.source === bgSource || failure.source === src)
        ? failure.message
        : "",
  };
}
