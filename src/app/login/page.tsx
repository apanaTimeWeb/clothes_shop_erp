"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shirt,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import {
  DEMO_ACCOUNTS,
  DEFAULT_DEMO_CREDENTIALS,
  loginUser,
  isAuthenticated,
} from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default function LoginPage() {
  const router = useRouter();

  const [selectedAccId, setSelectedAccId] = useState<string>(DEFAULT_DEMO_CREDENTIALS.id);
  const [email, setEmail] = useState<string>(DEFAULT_DEMO_CREDENTIALS.email);
  const [password, setPassword] = useState<string>(DEFAULT_DEMO_CREDENTIALS.password);
  const [store, setStore] = useState<string>(DEFAULT_DEMO_CREDENTIALS.store);
  const [role, setRole] = useState<string>(DEFAULT_DEMO_CREDENTIALS.role);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [justLoggedOut, setJustLoggedOut] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("logged_out") === "1") {
        setJustLoggedOut(true);
      } else if (isAuthenticated()) {
        router.replace(ROUTES.overview);
      }
    }
  }, [router]);

  function handleSelectDemoAccount(id: string) {
    const acc = DEMO_ACCOUNTS.find((a) => a.id === id) || DEFAULT_DEMO_CREDENTIALS;
    setSelectedAccId(acc.id);
    setEmail(acc.email);
    setPassword(acc.password);
    setStore(acc.store);
    setRole(acc.role);
    setErrorMsg("");
  }

  function handleResetDefaults() {
    handleSelectDemoAccount(DEFAULT_DEMO_CREDENTIALS.id);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.");
      return;
    }
    setErrorMsg("");
    setLoading(true);

    setTimeout(() => {
      loginUser({ email: email.trim(), role, store });
      router.push(ROUTES.overview);
    }, 350);
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <header className="mx-auto w-full max-w-5xl flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Shirt size={22} />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
              Thread & Form
            </h1>
            <p className="text-[10px] tracking-widest text-muted-foreground uppercase font-semibold">
              The Digital Showroom ERP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-subtle px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" />
            MVP Demo Active
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Login Card */}
      <main className="mx-auto w-full max-w-md my-auto py-8">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card space-y-6">
          <div className="space-y-1.5 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
              <Sparkles size={13} />
              <span>Showroom Staff & Admin Sign In</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Welcome to Showroom
            </h2>
            <p className="text-xs text-muted-foreground">
              All credentials are prefilled below for instant testing.
            </p>
          </div>

          {justLoggedOut && (
            <div className="flex items-start gap-2.5 rounded-xl border border-success/30 bg-success-bg p-3 text-xs text-success">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Logged out successfully</span>
                <span>You can click Sign In below to re-enter with demo access.</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-xs text-danger font-medium">
              {errorMsg}
            </div>
          )}

          {/* Quick Demo Account Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground">Select Demo Persona:</span>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                Reset Defaults
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleSelectDemoAccount(acc.id)}
                  className={`rounded-lg border p-2 text-center text-xs font-medium transition-all ${
                    selectedAccId === acc.id
                      ? "border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200 shadow-sm"
                      : "border-border bg-subtle text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="block truncate font-semibold">{acc.label}</span>
                  <span className="text-[10px] text-muted-foreground block truncate">{acc.role}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Email / Username</span>
                <span className="text-[10px] text-muted-foreground font-normal">Prefilled</span>
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-blue-600 focus:outline-none"
                  placeholder="admin@threadandform.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Password</span>
                <span className="text-[10px] text-muted-foreground font-normal">Prefilled</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-9 text-xs text-foreground placeholder:text-muted-foreground focus:border-blue-600 focus:outline-none"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Store & Role Selectors */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  <Building2 size={12} />
                  <span>Branch / Store</span>
                </label>
                <select
                  value={store}
                  onChange={(e) => setStore(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-1.5 text-xs text-foreground focus:border-blue-600 focus:outline-none"
                >
                  <option value="Flagship Showroom (Central)">Flagship (Central)</option>
                  <option value="Downtown Studio">Downtown Studio</option>
                  <option value="Regional Warehouse Hub">Warehouse Hub</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  <ShieldCheck size={12} />
                  <span>Access Mode</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-1.5 text-xs text-foreground focus:border-blue-600 focus:outline-none"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Staff (Sales & POS)">Staff (Sales)</option>
                  <option value="Visual Stylist">Stylist</option>
                </select>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-foreground">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-border accent-blue-600"
                />
                <span>Remember this terminal</span>
              </label>
              <span className="text-[11px] text-muted-foreground font-mono">Demo Auto-Fill</span>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white hover:bg-blue-700 min-h-11 shadow-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Entering Showroom...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Showroom</span>
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-5xl text-center pt-4 border-t border-border text-xs text-muted-foreground">
        <p>Thread & Form • Fictional Digital Showroom ERP • Browser-Local Demo Phase 3</p>
      </footer>
    </div>
  );
}
