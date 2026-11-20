"use client";
import { create } from "zustand";
import { ZodError } from "zod";
import {
  readDocument,
  commitDocument,
  subscribeDocument,
  readSessionValue,
  writeSessionValue,
  subscribeSessionValue,
} from "@/lib/browser_document";
import { createPresentationSeed } from "@/app/frontend_admin/admin_management/management_vocabulary/state/AdminManagementVocabularyTransactions";
import { demoSchema } from "@/app/frontend_admin/admin_management/management_vocabulary/schemas/AdminManagementVocabularySnapshotSchema";
import {
  transition,
  STORAGE_KEY,
} from "@/app/frontend_admin/admin_management/management_vocabulary/state/AdminManagementVocabularyTransactions";
import type {
  AdminManagementVocabularyState,
  AdminManagementVocabularyAction,
  AdminManagementVocabularyMode,
} from "@/app/frontend_admin/admin_management/management_vocabulary/types/AdminManagementVocabularyTypes";
const modeKey = "clothes-shop.preview.mode",
  noticeKey = "clothes-shop.preview.notice";
interface Host {
  state: AdminManagementVocabularyState;
  ready: boolean;
  stale: boolean;
  notice: string;
  mode: AdminManagementVocabularyMode;
  hydrate: () => void;
  dispatch: (action: AdminManagementVocabularyAction) => boolean;
  setMode: (mode: AdminManagementVocabularyMode) => void;
  notify: (notice: string) => void;
  markStale: () => void;
}
let expectedRaw: string | null = null;
const errorText = (error: unknown) =>
  error instanceof ZodError
    ? error.issues
        .slice(0, 8)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("\n")
    : error instanceof Error
      ? error.message
      : "The action could not be saved.";
export const useAdminManagementVocabulary = create<Host>((set, get) => ({
  state: createPresentationSeed(),
  ready: false,
  stale: false,
  notice: "",
  mode: "Staff",
  hydrate: () => {
    let state = createPresentationSeed(),
      notice = "";
    try {
      expectedRaw = readDocument(STORAGE_KEY);
      if (expectedRaw) state = demoSchema.parse(JSON.parse(expectedRaw));
    } catch {
      notice =
        "Saved data is unavailable or invalid. A fresh demo is shown; your next successful action replaces it.";
    }
    const mode = readSessionValue(modeKey);
    set({
      state,
      ready: true,
      notice,
      mode:
        mode === "Admin" || mode === "Customer" || mode === "Staff"
          ? mode
          : get().mode,
    });
  },
  dispatch: (action) => {
    try {
      if (!get().ready) throw new Error("The local demo is still loading.");
      if (get().stale || readDocument(STORAGE_KEY) !== expectedRaw) {
        set({ stale: true });
        throw new Error(
          "Another tab changed this demo. Reload before making changes.",
        );
      }
      const next = transition(get().state, action),
        raw = JSON.stringify(next);
      commitDocument(STORAGE_KEY, expectedRaw, raw);
      expectedRaw = raw;
      set({ state: next });
      get().notify(
        action.type === "reset"
          ? "Demo restored to the original fictional catalogue."
          : "Saved to this browser.",
      );
      return true;
    } catch (error) {
      get().notify(errorText(error));
      return false;
    }
  },
  notify: (notice) => {
    set({ notice });
    writeSessionValue(noticeKey, notice);
  },
  setMode: (mode) => {
    set({ mode });
    writeSessionValue(modeKey, mode);
  },
  markStale: () =>
    set({
      stale: true,
      notice:
        "Another tab changed this demo. Reload this tab to continue safely.",
    }),
}));
export function connectAdminManagementVocabulary() {
  useAdminManagementVocabulary.getState().hydrate();
  const off = subscribeDocument(
    STORAGE_KEY,
    () => useAdminManagementVocabulary.getState().hydrate(),
    () => useAdminManagementVocabulary.getState().markStale(),
  );
  const offMode = subscribeSessionValue(modeKey, (value) => {
    if (value === "Admin" || value === "Customer" || value === "Staff")
      useAdminManagementVocabulary.setState({ mode: value });
  });
  const offNotice = subscribeSessionValue(noticeKey, (notice) =>
    useAdminManagementVocabulary.setState({ notice }),
  );
  return () => {
    off();
    offMode();
    offNotice();
    useAdminManagementVocabulary.setState({ ready: false });
  };
}
