"use client";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import {
  readPhoto,
  downloadImage,
} from "@/app/frontend_admin/admin_showroom/showroom_studio/utils/AdminShowroomStudioPhoto";
import { useAdminShowroomStudioCanvas } from "@/app/frontend_admin/admin_showroom/showroom_studio/hooks/useAdminShowroomStudioCanvas";
type Point = { x: number; y: number };
const initial = { x: 300, y: 310, width: 250, height: 280, rotation: 0 };
export function AdminShowroomStudioPreview({ src }: { src?: string }) {
  const t = useTranslations("studio");
  const canvas = useRef<HTMLCanvasElement>(null),
    drag = useRef<Point | null>(null),
    upload = useRef(0);
  const [photo, setPhoto] = useState(""),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [pose, setPose] = useState(initial),
    [category, setCategory] = useState("top"),
    [anchors, setAnchors] = useState<Point[]>([]),
    [marking, setMarking] = useState(false),
    [show, setShow] = useState(true);
  const { background, garment, renderError } = useAdminShowroomStudioCanvas(
    canvas,
    photo,
    src,
    pose,
    show,
    anchors,
    marking,
  );
  function position(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) * 600) / r.width,
      y: ((e.clientY - r.top) * 800) / r.height,
    };
  }
  function mark(p: Point) {
    const next = [...anchors, p];
    setAnchors(next);
    if (next.length < 3) return;
    const [a, b, end] = next;
    const width = Math.hypot(b.x - a.x, b.y - a.y);
    const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const height = Math.hypot(end.x - center.x, end.y - center.y);
    if (width < 20 || height < 20) {
      setError(t("message060"));
      setAnchors([]);
      return;
    }
    setPose({
      x: (center.x + end.x) / 2,
      y: (center.y + end.y) / 2,
      width: Math.min(600, width * 1.25),
      height: Math.min(800, height * 1.15),
      rotation: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
    });
    setMarking(false);
    setAnchors([]);
    setError("");
  }
  function preset(value: string) {
    setCategory(value);
    setPose(
      value === "bottom"
        ? { x: 300, y: 570, width: 220, height: 320, rotation: 0 }
        : value === "accessory"
          ? { x: 300, y: 125, width: 150, height: 70, rotation: 0 }
          : initial,
    );
    setMarking(false);
    setAnchors([]);
  }
  function clear() {
    upload.current++;
    setPhoto("");
    setConsent(false);
    setBusy(false);
    setError("");
    setMarking(false);
    setAnchors([]);
    setPose(initial);
    setCategory("top");
  }
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{t("message061")}</h2>
      <p>{t("message062")}</p>
      <label>
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => {
            if (!e.target.checked) clear();
            else setConsent(true);
          }}
        />
        {t("message005")}
        {t("message063")}
      </label>
      <label>
        {t("message064")}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={!consent || busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            const id = ++upload.current;
            setBusy(true);
            setError("");
            try {
              const result = await readPhoto(file);
              if (id === upload.current) {
                setPhoto(result);
                setPose(initial);
                setCategory("top");
                setAnchors([]);
                setMarking(false);
              }
            } catch (error) {
              if (id === upload.current)
                setError(
                  error instanceof Error ? error.message : t("message065"),
                );
            } finally {
              if (id === upload.current) setBusy(false);
            }
          }}
        />
      </label>
      <Button onClick={clear}>{t("message066")}</Button>
      <p role="status">
        {busy ? t("message067") : photo ? t("message068") : t("message069")}
      </p>
      {!src && <p className="text-warning">{t("message070")}</p>}
      {(error || renderError) && (
        <p role="alert" className="text-danger">
          {error || renderError}
        </p>
      )}
      <label>
        {t("message071")}
        <select value={category} onChange={(e) => preset(e.target.value)}>
          <option value="top">{t("message072")}</option>
          <option value="bottom">{t("message073")}</option>
          <option value="accessory">{t("message074")}</option>
        </select>
      </label>
      <div className="flex flex-wrap gap-3">
        <Button
          disabled={!src || !background}
          onClick={() => {
            setMarking(!marking);
            setAnchors([]);
            setShow(true);
          }}
        >
          {marking ? t("message075") : t("message076")}
        </Button>
        <Button onClick={() => preset(category)}>{t("message077")}</Button>
        <label>
          <input
            type="checkbox"
            checked={show}
            onChange={(e) => setShow(e.target.checked)}
          />
          {t("message005")}
          {t("message078")}
        </label>
      </div>
      {marking && (
        <p aria-live="polite">
          {t("message079")}
          {anchors.length + 1}
          {t("message080")}
          {t("message005")}
          {category === "top"
            ? [t("message081"), t("message082"), t("message083")][
                anchors.length
              ]
            : [t("message084"), t("message085"), t("message086")][
                anchors.length
              ]}
          {t("message087")}
        </p>
      )}
      <canvas
        ref={canvas}
        width={600}
        height={800}
        aria-label={t("message088")}
        className="w-full max-w-lg touch-none rounded-xl border border-border bg-subtle"
        onPointerDown={(e) => {
          if (marking) {
            mark(position(e));
            return;
          }
          if (!garment) return;
          drag.current = position(e);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const p = position(e),
            old = drag.current;
          setPose((v) => ({
            ...v,
            x: Math.max(0, Math.min(600, v.x + p.x - old.x)),
            y: Math.max(0, Math.min(800, v.y + p.y - old.y)),
          }));
          drag.current = p;
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {(["x", "y", "width", "height", "rotation"] as const).map((field) => (
          <label key={field}>
            {
              {
                x: t("message089"),
                y: t("message090"),
                width: t("message091"),
                height: t("message092"),
                rotation: t("message093"),
              }[field]
            }
            {t("message094")}
            {Math.round(pose[field])}
            <input
              type="range"
              min={
                field === "rotation"
                  ? -180
                  : field === "width" || field === "height"
                    ? 20
                    : 0
              }
              max={
                field === "rotation"
                  ? 180
                  : field === "y" || field === "height"
                    ? 800
                    : 600
              }
              value={pose[field]}
              disabled={!src}
              onChange={(e) =>
                setPose({ ...pose, [field]: Number(e.target.value) })
              }
            />
          </label>
        ))}
      </div>
      <Button
        disabled={!background || !garment || !show || marking || busy}
        onClick={() => {
          try {
            if (canvas.current) downloadImage(canvas.current);
          } catch {
            setError(t("message095"));
          }
        }}
      >
        {t("message096")}
      </Button>
      <p>{t("message097")}</p>
    </section>
  );
}
