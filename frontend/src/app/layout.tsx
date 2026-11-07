import { FileSearch, History, LayoutDashboard, Link2, Mail, Menu, ShieldCheck, X, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";

import { HealthIndicator } from "../components/health-indicator";
import { useHealth, type HealthStatus } from "../features/health/use-health";
import { cn } from "../lib/utils";

const NAV: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/scan/url", label: "URL Scanner", icon: Link2 },
  { to: "/scan/email", label: "Email Scanner", icon: Mail },
  { to: "/results", label: "Scan Results", icon: FileSearch },
  { to: "/history", label: "Scan History", icon: History },
];

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const health = useHealth();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-surface px-4 py-2 text-sm font-medium shadow-lift focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-surface lg:flex">
        <Sidebar health={health} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-surface/85 px-4 backdrop-blur-md lg:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex size-9 items-center justify-center rounded-lg text-ink-soft hover:bg-canvas"
          aria-label="Open navigation"
          aria-expanded={menuOpen}
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-[2px] motion-safe:animate-fade" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] bg-surface shadow-lift motion-safe:animate-fade">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-lg text-ink-soft hover:bg-canvas"
              aria-label="Close navigation"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
            <Sidebar health={health} />
          </aside>
        </div>
      )}

      <main id="main" className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-[#13265a] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
        <ShieldCheck className="size-4.5" aria-hidden="true" />
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-ink">
        Veylix <span className="text-accent">AI</span>
      </span>
    </div>
  );
}

function Sidebar({ health }: { health: HealthStatus }) {
  return (
    <div className="flex w-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Brand />
      </div>
      <nav aria-label="Main" className="flex flex-1 flex-col gap-0.5 px-3 py-2">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-accent-soft text-accent-strong" : "text-ink-soft hover:bg-canvas hover:text-ink",
              )
            }
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="m-3 flex flex-col gap-2 rounded-xl border border-line bg-canvas/70 p-3.5">
        <HealthIndicator status={health} />
        <p className="text-xs leading-relaxed text-ink-muted">
          Rule-based analysis · v0.1. Links are never opened and scans are not saved.
        </p>
      </div>
    </div>
  );
}
