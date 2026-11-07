import { ArrowRight, EyeOff, Link2, ListChecks, Mail, ScanSearch, ShieldAlert, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { Link } from "react-router";

import { HealthIndicator } from "../components/health-indicator";
import { ScanList } from "../components/scan-list";
import { buttonVariants } from "../components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useHealth } from "../features/health/use-health";
import { useHistory } from "../features/history/history-context";
import { CATEGORY_ORDER, CATEGORY_STYLES } from "../lib/display/categories";
import { cn, formatNumber } from "../lib/utils";

export function DashboardPage() {
  const { entries } = useHistory();
  const health = useHealth();

  const total = entries.length;
  const urlCount = entries.filter((e) => e.result.input_type === "url").length;
  const emailCount = total - urlCount;
  const byCategory = Object.fromEntries(
    CATEGORY_ORDER.map((c) => [c, entries.filter((e) => e.result.category === c).length]),
  ) as Record<(typeof CATEGORY_ORDER)[number], number>;

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <Card className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_100%_0%,#e8efff_0%,rgba(232,239,255,0)_60%)]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10">
          <div className="flex max-w-xl flex-col gap-4">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-accent/15 bg-surface/80 px-2.5 py-1 text-xs font-medium text-accent-strong">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Explainable phishing analysis
            </span>
            <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              Intelligence That Sees <span className="text-accent">Beyond Threats.</span>
            </h1>
            <p className="text-[15px] leading-relaxed text-ink-soft">
              Check suspicious links and emails in seconds. Every result explains the rule-based indicators behind it —
              signals to help you decide, not a guaranteed verdict.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              <Link to="/scan/url" className={buttonVariants({ size: "lg" })}>
                <Link2 aria-hidden="true" /> Scan a URL
              </Link>
              <Link to="/scan/email" className={buttonVariants({ variant: "secondary", size: "lg" })}>
                <Mail aria-hidden="true" /> Analyse an email
              </Link>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 rounded-2xl border border-line bg-surface/90 p-5 shadow-card backdrop-blur lg:max-w-xs">
            <HealthIndicator status={health} />
            <ul className="flex flex-col gap-2.5 text-sm text-ink-soft">
              <Assurance icon={ShieldCheck} text="Links are read as text — never opened" />
              <Assurance icon={EyeOff} text="Email text is never stored or logged" />
              <Assurance icon={ListChecks} text="Documented, testable rules (v0.1)" />
            </ul>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <section aria-label="Session statistics" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Scans this session" value={total} icon={ScanSearch} />
        <Stat label="URL scans" value={urlCount} icon={Link2} />
        <Stat label="Email scans" value={emailCount} icon={Mail} />
        <Stat label="High risk found" value={byCategory.high} icon={ShieldAlert} tone="text-red-600" />
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Risk distribution</CardTitle>
            <CardDescription>Categories of this session's scans.</CardDescription>
          </CardHeader>
          <div className="flex flex-col gap-5 p-5 sm:p-6">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-canvas ring-1 ring-inset ring-line" aria-hidden="true">
              {total > 0 &&
                CATEGORY_ORDER.map((c) =>
                  byCategory[c] ? (
                    <div
                      key={c}
                      className={cn("h-full transition-[width] duration-500", CATEGORY_STYLES[c].bar)}
                      style={{ width: `${(byCategory[c] / total) * 100}%` }}
                    />
                  ) : null,
                )}
            </div>
            <ul className="flex flex-col gap-2.5">
              {CATEGORY_ORDER.map((c) => {
                const { icon: Icon, label, bar } = CATEGORY_STYLES[c];
                return (
                  <li key={c} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2.5 text-ink-soft">
                      <span className={cn("size-2 rounded-full", bar)} aria-hidden="true" />
                      <Icon className="size-4 text-ink-muted" aria-hidden="true" />
                      {label}
                    </span>
                    <span className="font-medium tabular-nums text-ink">{formatNumber(byCategory[c])}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </Card>

        {/* Recent */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle>Recent scans</CardTitle>
              <CardDescription>Kept in this tab only — never saved.</CardDescription>
            </div>
            {total > 0 && (
              <Link to="/history" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                View all <ArrowRight aria-hidden="true" />
              </Link>
            )}
          </CardHeader>
          <div className="pb-2 pt-3">
            {total === 0 ? (
              <div className="mx-5 mb-4 flex flex-col items-center gap-2 rounded-xl border border-dashed border-line-strong px-6 py-10 text-center sm:mx-6">
                <ScanSearch className="size-6 text-ink-muted" aria-hidden="true" />
                <p className="text-sm font-medium text-ink">No scans yet</p>
                <p className="max-w-xs text-sm text-ink-muted">Run a URL or email scan and the results will appear here.</p>
              </div>
            ) : (
              <ScanList entries={entries.slice(0, 5)} />
            )}
          </div>
        </Card>
      </div>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="flex flex-col gap-4">
        <h2 id="how-heading" className="text-sm font-medium uppercase tracking-wider text-ink-muted">
          How Veylix analyses
        </h2>
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          <Step n={1} title="Validate safely" text="Input is checked and parsed as text. Links are never opened, fetched or resolved." />
          <Step n={2} title="Match indicators" text="Documented rules look for known phishing signals in the address or wording." />
          <Step n={3} title="Explain the result" text="You get a category, the indicators behind it and its limitations." />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, icon: Icon, tone }: { label: string; value: number; icon: LucideIcon; tone?: string }) {
  return (
    <Card className="p-4 transition-shadow duration-200 hover:shadow-lift sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-ink-muted sm:text-sm">{label}</p>
        <Icon className={cn("size-4 text-ink-muted", tone)} aria-hidden="true" />
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-ink sm:text-3xl">{formatNumber(value)}</p>
    </Card>
  );
}

function Assurance({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <Icon className="size-4 shrink-0 text-accent" aria-hidden="true" />
      {text}
    </li>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <Card className="p-5">
      <span className="flex size-7 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-strong">
        {n}
      </span>
      <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">{text}</p>
    </Card>
  );
}
