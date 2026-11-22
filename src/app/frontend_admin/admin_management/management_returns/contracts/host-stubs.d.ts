// Ambient infrastructure signatures for compiling this capability in isolation.
// Runtime implementations are provided by the host, not by sibling modules.
declare module "@/lib/browser_document" {
  export function readDocument(key: string): string | null;
  export function commitDocument(
    key: string,
    expected: string | null,
    value: string,
  ): void;
  export function subscribeDocument(
    key: string,
    changed: () => void,
    external: () => void,
  ): () => void;
  export function readSessionValue(key: string): string | null;
  export function writeSessionValue(key: string, value: string): void;
  export function subscribeSessionValue(
    key: string,
    changed: (value: string) => void,
  ): () => void;
}
declare module "@/lib/routes" {
  export const ROUTES: Record<
    | "login"
    | "overview"
    | "showroom"
    | "studio"
    | "sessions"
    | "billing"
    | "inventory"
    | "sales"
    | "management"
    | "reports"
    | "settings",
    string
  >;
}
declare module "@/components/ui/Button" {
  export function Button(
    props: import("react").ButtonHTMLAttributes<HTMLButtonElement>,
  ): import("react").ReactNode;
}
declare module "@/components/ui/Confirm" {
  export function Confirm(props: {
    trigger: import("react").ReactNode;
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: () => void;
  }): import("react").ReactNode;
}
declare module "@/components/ui/LocaleProvider" {
  export function LocaleProvider(props: {
    children: import("react").ReactNode;
    messages: import("next-intl").AbstractIntlMessages;
  }): import("react").ReactNode;
}
