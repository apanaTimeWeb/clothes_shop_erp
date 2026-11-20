"use client";
import { t } from "@/app/frontend_admin/admin_management/management_barcodes/utils/AdminManagementBarcodesMessages";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
type Detector = {
  detect: (video: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
};
type NativeDetector = {
  new (options: { formats: string[] }): Detector;
  getSupportedFormats: () => Promise<string[]>;
};
export function AdminManagementBarcodesCamera({ onScan }: { onScan: (code: string) => void }) {
  const video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null),
    active = useRef(false),
    generation = useRef(0);
  const [running, setRunning] = useState(false),
    [message, setMessage] = useState("");
  function stop() {
    active.current = false;
    generation.current++;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    setRunning(false);
  }
  useEffect(
    () => () => {
      active.current = false;
      generation.current++;
      stream.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );
  async function start() {
    stop();
    const ticket = generation.current;
    try {
      const Native = (window as unknown as { BarcodeDetector?: NativeDetector }).BarcodeDetector;
      if (!window.isSecureContext || !navigator.mediaDevices || !Native) throw Error(t("message1"));
      const supported = await Native.getSupportedFormats();
      const formats = ["code_39", "code_128", "ean_13", "ean_8"].filter((x) =>
        supported.includes(x),
      );
      if (!formats.length) throw Error(t("message2"));
      setRunning(true);
      setMessage(t("message3"));
      const camera = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      if (ticket !== generation.current) {
        camera.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = camera;
      if (!video.current) throw Error(t("message4"));
      video.current.srcObject = camera;
      await video.current.play();
      if (ticket !== generation.current) return;
      active.current = true;
      setMessage(t("message5"));
      const detector = new Native({ formats });
      async function scan() {
        if (!active.current || ticket !== generation.current || !video.current) return;
        try {
          const found = await detector.detect(video.current);
          if (!active.current || ticket !== generation.current) return;
          if (found[0]?.rawValue) {
            onScan(found[0].rawValue);
            stop();
            setMessage(t("message6"));
            return;
          }
        } catch {
          setMessage(t("message7"));
        }
        if (active.current) setTimeout(scan, 300);
      }
      void scan();
    } catch (e) {
      if (ticket === generation.current) {
        stop();
        setMessage(e instanceof Error ? e.message : t("message8"));
      }
    }
  }
  return (
    <details
      onToggle={(e) => {
        if (!e.currentTarget.open) stop();
      }}
    >
      <summary>{t("message9")}</summary>
      <p>{t("message10")}</p>
      <video ref={video} playsInline muted className="max-h-72 w-full rounded bg-subtle" />
      <div className="flex gap-3">
        <Button disabled={running} onClick={start}>
          {t("message11")}
        </Button>
        <Button disabled={!running} onClick={stop}>
          {t("message12")}
        </Button>
      </div>
      <p role="status">{message}</p>
    </details>
  );
}
