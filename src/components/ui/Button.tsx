import type { ButtonHTMLAttributes } from "react";

export function Button({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const hasCustomBg = className.includes("bg-");
  const hasCustomText = className.includes("text-");
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold shadow-card motion-safe:transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        hasCustomBg ? "" : "bg-card hover:bg-subtle"
      } ${hasCustomText ? "" : "text-primary"} ${className}`}
      {...props}
    />
  );
}
