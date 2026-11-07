import { FileSearch, History, LayoutGrid, Link2, Mail, Menu, X, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";

import { HealthIndicator } from "../components/health-indicator";
import { ThemeToggle } from "../components/theme-toggle";
import { useHealth } from "../features/health/use-health";
import { useHistory } from "../features/history/history-context";
import { cn } from "../lib/utils";

const NAV: { to: string; label: string; short: string; icon: LucideIcon; end?: boolean }[] = [
  { to: "/", label: "Dashboard", short: "Overview", icon: LayoutGrid, end: true },
  { to: "/scan/url", label: "URL Scanner", short: "URL", icon: Link2 },
  { to: "/scan/email", label: "Email Scanner", short: "Email", icon: Mail },
  { to: "/results", label: "Scan Results", short: "Results", icon: FileSearch },
  { to: "/history", label: "Scan History", short: "History", icon: History },
];

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const health = useHealth();
  const { entries } = useHistory();

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      {/* Ambient backdrop: engineering grid + soft accent aura */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px]" aria-hidden="true">
        <div className="bg-grid mask-fade-b absolute inset-0" />
        <div className="absolute left-1/2 top-[-240px] h-[480px] w-[900px] max-w-[160vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,var(--glow),transparent)] opacity-60 blur-3xl" />
      </div>

      <a
        href="#main"
        className="sr-only z-[60] rounded-xl bg-surface px-4 py-2 text-sm font-medium shadow-lift focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-line bg-canvas/75 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Brand />

          {/* Desktop navigation */}
          <nav aria-label="Main" className="mx-auto hidden items-center gap-1 rounded-2xl border border-line bg-surface/70 p-1 shadow-xs md:flex">
            {NAV.map(({ to, label, short, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "relative flex h-9 items-center gap-2 rounded-xl px-3 text-[13px] font-medium outline-none transition-colors duration-200",
                    "focus-visible:ring-2 focus-visible:ring-accent",
                    isActive
                      ? "bg-surface text-fg shadow-[0_1px_2px_rgba(10,18,38,0.08),0_0_0_1px_var(--line-strong)] dark:bg-surface-3"
                      : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn("size-4", isActive && "text-accent")} aria-hidden="true" />
                    <span className="hidden lg:inline">{label}</span>
                    <span className="lg:hidden">{short}</span>
                    {to === "/history" && entries.length > 0 && (
                      <span className="rounded-md bg-accent-soft px-1.5 py-0.5 font-mono text-[10px] leading-none text-accent-strong">
                        {entries.length}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <HealthIndicator status={health} className="hidden sm:inline-flex" />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex size-9 cursor-pointer items-center justify-center rounded-xl border border-line-strong bg-surface text-fg-soft shadow-xs transition-colors hover:bg-surface-2 hover:text-fg md:hidden"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
            >
              {menuOpen ? <X className="size-4.5" aria-hidden="true" /> : <Menu className="size-4.5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile navigation panel */}
        {menuOpen && (
          <nav
            id="mobile-nav"
            aria-label="Main"
            className="border-t border-line bg-canvas/95 px-4 pb-4 pt-2 backdrop-blur-xl motion-safe:animate-fade md:hidden"
          >
            <ul className="grid gap-1">
              {NAV.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                        isActive ? "bg-surface text-fg shadow-xs ring-1 ring-line" : "text-fg-soft hover:bg-surface-2",
                      )
                    }
                  >
                    <Icon className="size-4 text-fg-muted" aria-hidden="true" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <HealthIndicator status={health} className="mt-3 sm:hidden" />
          </nav>
        )}
      </header>

      <main id="main" className="relative">
        <div key={location.pathname} className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-8 lg:pt-12">
          <Outlet />
        </div>
      </main>

      <footer className="relative border-t border-line">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-fg-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            <span className="font-medium text-fg-soft">Veylix AI</span> · Intelligence That Sees Beyond Threats.
          </p>
          <p>Rule-based indicators, not guaranteed verdicts. Links are never opened; scans are not saved.</p>
        </div>
      </footer>
    </div>
  );
}

function Brand() {
  return (
    <Link to="/" className="group flex shrink-0 items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label="Veylix AI home">
      <span className="relative flex size-9 items-center justify-center overflow-hidden rounded-xl bg-navy text-white shadow-[0_6px_16px_-6px_var(--glow),inset_0_1px_0_rgba(255,255,255,0.18)] ring-1 ring-white/10">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(110,140,255,0.55),transparent_60%)]" aria-hidden="true" />
        <svg viewBox="0 0 24 24" className="relative size-5" aria-hidden="true">
          <path d="M12 2.8 19.5 5.6v5.6c0 4.6-3.1 8.6-7.5 10-4.4-1.4-7.5-5.4-7.5-10V5.6z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M8.2 9.2 12 15.6l3.8-6.4" fill="none" stroke="#9fb4ff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-[-0.02em] text-fg">
          Veylix<span className="text-accent"> AI</span>
        </span>
        <span className="mt-1 hidden font-mono text-[9.5px] uppercase tracking-[0.18em] text-fg-muted sm:block">Threat analysis</span>
      </span>
    </Link>
  );
}
