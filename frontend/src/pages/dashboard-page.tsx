import { Activity, ArrowRight, EyeOff, Link2, ListChecks, Mail, Radar, ScanSearch, ShieldAlert, ShieldCheck, Workflow, type LucideIcon } from "lucide-react";
import { Link } from "react-router";

import { EmptyState } from "../components/empty-state";
import { HealthIndicator } from "../components/health-indicator";
import { ScanList } from "../components/scan-list";
import { ThreatLens } from "../components/threat-lens";
import { buttonVariants } from "../components/ui/button";
import { Card, SpotlightCard } from "../components/ui/card";
import { useHealth } from "../features/health/use-health";
import { useHistory } from "../features/history/history-context";
import { CATEGORY_ORDER, CATEGORY_STYLES } from "../lib/display/categories";
import { cn, formatNumber } from "../lib/utils";
import type { Category } from "../types/api";

export function DashboardPage() {
  const { entries } = useHistory();
  const health = useHealth();

  const total = entries.length;
  const urlCount = entries.filter((e) => e.result.input_type === "url").length;
  const emailCount = total - urlCount;
  const signals = entries.reduce((n, e) => n + e.result.rule_evidence.length, 0);
  const byCategory = Object.fromEntries(
    CATEGORY_ORDER.map((c) => [c, entries.filter((e) => e.result.category === c).length]),
  ) as Record<Category, number>;

  return (
    <div className="flex flex-col gap-12 lg:gap-16">
      {/* Hero */}
      <section className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col gap-6 motion-safe:animate-rise">
          <div className="flex flex-wrap items-center gap-2">
            <HealthIndicator status={health} />
            <span className="inline-flex h-8 items-center rounded-full border border-line bg-surface px-3 font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted shadow-xs">
              Rule engine v0.1
            </span>
          </div>

          <h1 className="text-[40px] font-semibold leading-[1.02] tracking-[-0.045em] text-fg sm:text-6xl lg:text-[68px]">
            Intelligence That Sees{" "}
            <span className="text-gradient-accent">Beyond Threats.</span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-fg-soft sm:text-[17px]">
            Veylix AI inspects suspicious links and emails and explains every signal it finds — so you can decide with
            evidence, not guesswork. Results are rule-based indicators, never a guarantee.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link to="/scan/url" className={buttonVariants({ size: "lg" })}>
              <Link2 aria-hidden="true" /> Scan a URL
              <ArrowRight className="transition-transform duration-200 group-hover/btn:translate-x-0.5" aria-hidden="true" />
            </Link>
            <Link to="/scan/email" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              <Mail aria-hidden="true" /> Analyse an email
            </Link>
          </div>

          <ul className="mt-2 grid gap-3 border-t border-line pt-6 sm:grid-cols-3">
            <Assurance icon={ShieldCheck} title="Never opened" text="Links are read as text only." />
            <Assurance icon={EyeOff} title="Never stored" text="Email text is not saved or logged." />
            <Assurance icon={ListChecks} title="Explainable" text="Every signal is documented." />
          </ul>
        </div>

        <div className="relative mx-auto flex w-full max-w-[420px] items-center justify-center motion-safe:animate-fade lg:max-w-none">
          <ThreatLens />
          <LensTag className="left-0 top-[14%]" icon={Link2} text="URL engine" />
          <LensTag className="right-0 top-[38%]" icon={Mail} text="Email engine" />
          <LensTag className="bottom-[10%] left-[8%]" icon={Workflow} text="Explained signals" />
        </div>
      </section>

      {/* Scan entry points */}
      <section aria-labelledby="start-heading" className="flex flex-col gap-5">
        <SectionLabel id="start-heading" icon={ScanSearch}>Start an analysis</SectionLabel>
        <div className="grid gap-4 md:grid-cols-2">
          <EntryCard
            to="/scan/url"
            icon={Link2}
            title="URL Scanner"
            text="Check a single link for IP hosts, hidden destinations, shorteners, look-alike domains and suspicious words."
            tags={["Text-only", "Defanged output", "Up to 2,048 chars"]}
            cta="Inspect a link"
          />
          <EntryCard
            to="/scan/email"
            icon={Mail}
            title="Email Scanner"
            text="Paste a message body to detect urgency, credential and payment requests, impersonation and risky links."
            tags={["Pasted text only", "20 links analysed", "Never stored"]}
            cta="Analyse a message"
          />
        </div>
      </section>

      {/* Session overview */}
      <section aria-labelledby="overview-heading" className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionLabel id="overview-heading" icon={Activity}>This session</SectionLabel>
          <p className="text-xs text-fg-muted">Counted from your scans in this tab. Nothing is saved.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Stat label="Scans" value={total} icon={ScanSearch} />
          <Stat label="URL scans" value={urlCount} icon={Link2} />
          <Stat label="Email scans" value={emailCount} icon={Mail} />
          <Stat label="High-risk results" value={byCategory.high} icon={ShieldAlert} accent={byCategory.high > 0 ? "text-risk-high-text" : undefined} />
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <div className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-6">
              <h3 className="text-[15px] font-semibold tracking-tight">Recent activity</h3>
              {total > 0 && (
                <Link to="/history" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  View history <ArrowRight aria-hidden="true" />
                </Link>
              )}
            </div>
            {total === 0 ? (
              <EmptyState
                icon={Radar}
                title="No scans yet"
                actions={
                  <>
                    <Link to="/scan/url" className={buttonVariants({ size: "sm" })}>
                      <Link2 aria-hidden="true" /> Scan a URL
                    </Link>
                    <Link to="/scan/email" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                      <Mail aria-hidden="true" /> Analyse an email
                    </Link>
                  </>
                }
              >
                Your scans from this session will appear here as they complete.
              </EmptyState>
            ) : (
              <div className="p-2 sm:p-3">
                <ScanList entries={entries.slice(0, 6)} />
              </div>
            )}
          </Card>

          <Card className="lg:col-span-2">
            <div className="flex flex-col gap-1 px-5 pt-5 sm:px-6">
              <h3 className="text-[15px] font-semibold tracking-tight">Risk distribution</h3>
              <p className="text-sm text-fg-muted">
                {total > 0 ? `${formatNumber(total)} scan${total === 1 ? "" : "s"} · ${formatNumber(signals)} signal${signals === 1 ? "" : "s"} matched` : "Shown once you have run a scan."}
              </p>
            </div>
            {total === 0 ? (
              <div className="p-5 sm:p-6">
                <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-line-strong bg-surface-2/40 text-sm text-fg-muted">
                  No data yet
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5 p-5 sm:p-6">
                <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
                  {CATEGORY_ORDER.map((c) =>
                    byCategory[c] ? (
                      <div
                        key={c}
                        className={cn("h-full rounded-full transition-[flex-grow] duration-700", CATEGORY_STYLES[c].dot)}
                        style={{ flexGrow: byCategory[c] }}
                      />
                    ) : null,
                  )}
                </div>
                <ul className="flex flex-col gap-1">
                  {CATEGORY_ORDER.map((c) => {
                    const { icon: Icon, label, text, dot } = CATEGORY_STYLES[c];
                    return (
                      <li key={c} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-2">
                        <span className={cn("size-2 rounded-full", dot)} aria-hidden="true" />
                        <Icon className={cn("size-4", text)} aria-hidden="true" />
                        <span className="flex-1 text-sm text-fg-soft">{label}</span>
                        <span className="font-mono text-sm font-medium tabular-nums text-fg">
                          {byCategory[c]}
                          <span className="ml-1 text-xs font-normal text-fg-muted">scan{byCategory[c] === 1 ? "" : "s"}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* Method */}
      <section aria-labelledby="method-heading" className="flex flex-col gap-5">
        <SectionLabel id="method-heading" icon={Workflow}>How Veylix analyses</SectionLabel>
        <ol className="grid gap-4 md:grid-cols-3">
          <Step n="01" title="Validate safely" text="Input is length-checked and parsed as text. Links are never opened, fetched or resolved." />
          <Step n="02" title="Match indicators" text="Documented, tested rules look for known phishing signals in the address or the wording." />
          <Step n="03" title="Explain the verdict" text="You get a category, every indicator behind it, and the limits of the analysis." />
        </ol>
      </section>
    </div>
  );
}

function SectionLabel({ id, icon: Icon, children }: { id: string; icon: LucideIcon; children: string }) {
  return (
    <h2 id={id} className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-fg-muted">
      <Icon className="size-3.5 text-accent" aria-hidden="true" />
      {children}
    </h2>
  );
}

function EntryCard({ to, icon: Icon, title, text, tags, cta }: { to: string; icon: LucideIcon; title: string; text: string; tags: string[]; cta: string }) {
  return (
    <SpotlightCard className="motion-safe:animate-rise">
      <Link to={to} className="flex h-full flex-col gap-5 rounded-2xl p-6 outline-none focus-visible:ring-2 focus-visible:ring-accent sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-navy text-white shadow-[0_10px_24px_-10px_var(--glow),inset_0_1px_0_rgba(255,255,255,0.15)] ring-1 ring-white/10">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <span className="flex size-9 items-center justify-center rounded-full border border-line bg-surface text-fg-muted transition-all duration-300 group-hover/spot:border-accent-line group-hover/spot:bg-accent group-hover/spot:text-accent-fg">
            <ArrowRight className="size-4 transition-transform duration-300 group-hover/spot:-rotate-45" aria-hidden="true" />
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold tracking-[-0.02em] text-fg">{title}</h3>
          <p className="text-sm leading-relaxed text-fg-muted">{text}</p>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <ul className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <li key={t} className="rounded-md border border-line bg-surface-2 px-2 py-1 font-mono text-[10.5px] text-fg-muted">
                {t}
              </li>
            ))}
          </ul>
          <span className="text-sm font-medium text-accent">{cta}</span>
        </div>
      </Link>
    </SpotlightCard>
  );
}

function Stat({ label, value, icon: Icon, accent }: { label: string; value: number; icon: LucideIcon; accent?: string }) {
  return (
    <Card className="group overflow-hidden p-4 transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-fg-muted sm:text-sm">{label}</p>
        <span className="flex size-7 items-center justify-center rounded-lg border border-line bg-surface-2 text-fg-muted transition-colors group-hover:text-accent">
          <Icon className="size-3.5" aria-hidden="true" />
        </span>
      </div>
      <p className={cn("mt-3 font-mono text-3xl font-semibold tabular-nums tracking-tight text-fg sm:text-4xl", accent)}>
        {formatNumber(value)}
      </p>
    </Card>
  );
}

function Assurance({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <li className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
      <span>
        <span className="block text-sm font-medium text-fg">{title}</span>
        <span className="block text-[13px] text-fg-muted">{text}</span>
      </span>
    </li>
  );
}

function LensTag({ className, icon: Icon, text }: { className: string; icon: LucideIcon; text: string }) {
  return (
    <span
      className={cn(
        "absolute hidden items-center gap-2 rounded-full border border-line bg-surface/90 px-3 py-1.5 text-xs font-medium text-fg-soft shadow-card backdrop-blur sm:inline-flex",
        className,
      )}
      aria-hidden="true"
    >
      <Icon className="size-3.5 text-accent" />
      {text}
    </span>
  );
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <li>
      <Card className="h-full p-6 transition-shadow duration-300 hover:shadow-lift">
        <span className="font-mono text-xs font-medium text-accent">{n}</span>
        <p className="mt-4 text-[15px] font-semibold tracking-tight text-fg">{title}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{text}</p>
      </Card>
    </li>
  );
}
