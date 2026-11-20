import type { ButtonHTMLAttributes } from "react";
export function Button({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-primary shadow-card motion-safe:transition-colors hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
