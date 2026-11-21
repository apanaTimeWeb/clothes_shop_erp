"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
      try { localStorage.setItem("theme", "dark"); } catch {}
    } else {
      document.documentElement.classList.remove("dark");
      try { localStorage.setItem("theme", "light"); } catch {}
    }
  }

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className={`inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-primary shadow-card ${className}`}
      >
        <Moon size={16} className="text-secondary" />
        <span className="hidden sm:inline">Theme</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className={`inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-primary shadow-card motion-safe:transition-all hover:bg-subtle active:scale-95 ${className}`}
    >
      {theme === "dark" ? (
        <>
          <Sun size={16} className="text-amber-400" />
          <span className="hidden sm:inline font-medium text-foreground">Light Mode</span>
        </>
      ) : (
        <>
          <Moon size={16} className="text-blue-600" />
          <span className="hidden sm:inline font-medium text-foreground">Dark Mode</span>
        </>
      )}
    </button>
  );
}
