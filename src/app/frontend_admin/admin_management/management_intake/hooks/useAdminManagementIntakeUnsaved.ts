"use client";
import { useEffect, useState } from "react";
const eventName = "demo-request-discard";
export function requestDiscard() {
  return window.dispatchEvent(new Event(eventName, { cancelable: true }));
}
export function useAdminManagementIntakeUnsaved(message: string) {
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) return;
    const unload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    const discard = (e: Event) => {
      if (!window.confirm(message)) e.preventDefault();
      else setDirty(false);
    };
    const click = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("a[href]") && !requestDiscard()) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    window.addEventListener(eventName, discard);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      window.removeEventListener(eventName, discard);
      document.removeEventListener("click", click, true);
    };
  }, [dirty, message]);
  return { dirty, setDirty };
}
