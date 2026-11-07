import { ArrowRight, BrainCircuit, Clock, EyeOff, FileText, Info, Link2, Mail, ScrollText, ShieldQuestion, Waypoints } from "lucide-react";
import type { ReactNode } from "react";

import { CategoryBadge } from "../../components/category-badge";
import { DefangedUrl } from "../../components/defanged-url";
import { RiskEmblem } from "../../components/risk-emblem";
import { StrengthMeter } from "../../components/strength-meter";
import { Card } from "../../components/ui/card";
import {
  CATEGORY_STYLES,
  NORMALIZATION_TEXT,
  NOTICE_TEXT,
  STRENGTH_LEVEL,
  STRENGTH_ORDER,
} from "../../lib/display/categories";
import { cn, formatDateTime, formatNumber } from "../../lib/utils";
import { isEmailResult, type AnyScanResult, type EmailScanResult, type Strength } from "../../types/api";

// Layout follows SRS UI-009: category, mode, rule evidence, model contributions,
// embedded-URL findings (email), limitations. Every value shown comes from the
// backend response; nothing is rendered as HTML.

const STRENGTH_RAIL: Record<Strength, string> = {
  strong: "bg-risk-high",
  moderate: "bg-risk-medium",
  weak: "bg-fg-muted/50",
};

export function ResultView({ result, headingId, animate = true }: { result: AnyScanResult; headingId?: string; animate?: boolean }) {
  const style = CATEGORY_STYLES[result.category];
  const notes = [
    ...result.normalizations.map((n) => NORMALIZATION_TEXT[n]),
    ...result.notices.map((n) => NOTICE_TEXT[n]),
  ].filter(Boolean);

  const signals = [...result.rule_evidence].sort((a, b) => STRENGTH_LEVEL[b.strength] - STRENGTH_LEVEL[a.strength]);
  const counts = Object.fromEntries(
    STRENGTH_ORDER.map((s) => [s, result.rule_evidence.filter((e) => e.strength === s).length]),
  ) as Record<Strength, number>;

  return (
    <div className="flex flex-col gap-5">
      {/* Verdict */}
      <Card className={cn("overflow-hidden", animate && "motion-safe:animate-rise")}>
        <div className={cn("absolute inset-x-0 top-0 h-px", style.dot)} aria-hidden="true" />
        <div
          className={cn("pointer-events-none absolute inset-0 opacity-80", style.soft)}
          style={{ maskImage: "linear-gradient(115deg, #000 0%, transparent 55%)" }}
          aria-hidden="true"
        />
        <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:gap-10">
          <div className="flex min-w-0 flex-col gap-5">
            <div className="flex items-start gap-4 sm:gap-5">
              <RiskEmblem category={result.category} animate={animate} />
              <div className="flex min-w-0 flex-col gap-1.5 pt-1">
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-fg-muted">
                  Verdict · {result.analysis_mode === "rules_only" ? "Rule-based analysis" : "Rules + machine learning"}
                </span>
                <h2
                  id={headingId}
                  tabIndex={-1}
                  className={cn("text-[28px] font-semibold leading-none tracking-[-0.03em] outline-none sm:text-4xl", style.text)}
                >
                  {style.headline}
                </h2>
                <p className="mt-1 text-[15px] font-medium text-fg">{result.category_meaning}</p>
              </div>
            </div>

            <p className="flex items-start gap-2.5 rounded-xl border border-line bg-surface/80 px-4 py-3 text-sm leading-relaxed text-fg-soft backdrop-blur">
              <ArrowRight className={cn("mt-0.5 size-4 shrink-0", style.text)} aria-hidden="true" />
              <span>
                <span className="font-medium text-fg">Suggested action: </span>
                {result.suggested_action}
              </span>
            </p>

            <div className="flex min-w-0 items-center gap-3 rounded-xl border border-line bg-surface-2/80 px-3.5 py-2.5">
              {result.input_type === "url" ? (
                <Link2 className="size-4 shrink-0 text-fg-muted" aria-hidden="true" />
              ) : (
                <Mail className="size-4 shrink-0 text-fg-muted" aria-hidden="true" />
              )}
              <span className="min-w-0 flex-1">
                {result.input_type === "url" ? (
                  <DefangedUrl value={result.display_value} className="text-fg" />
                ) : (
                  <span className="text-sm text-fg-soft">{result.display_value}</span>
                )}
              </span>
              <span className="hidden shrink-0 rounded-md border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-fg-muted sm:inline">
                {result.input_type === "url" ? "Defanged" : "Private"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Chip icon={<ScrollText />}>Rules v{result.versions.rule_version}</Chip>
              {!result.saved && <Chip icon={<EyeOff />}>Not saved</Chip>}
              <Chip icon={<Clock />}>{formatDateTime(result.analysed_at)}</Chip>
            </div>
          </div>

          {/* Signal summary (counts of the indicators returned by the backend) */}
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface/85 p-4 backdrop-blur lg:w-64">
            <p className="text-xs font-medium text-fg-muted">Signals detected</p>
            <p className="text-4xl font-semibold tabular-nums tracking-tight text-fg">{formatNumber(result.rule_evidence.length)}</p>
            <ul className="flex flex-col gap-2 border-t border-line pt-3">
              {STRENGTH_ORDER.map((s) => (
                <li key={s} className="flex items-center justify-between gap-3">
                  <StrengthMeter strength={s} compact />
                  <span className="font-mono text-sm tabular-nums text-fg">{counts[s]}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs leading-relaxed text-fg-muted">Indicators are signals, not proof of phishing.</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="flex flex-col gap-5 lg:col-span-3">
          <Section
            icon={<Waypoints />}
            title="Rule-based indicators"
            description="Documented signals that matched, strongest first. Each one is an indicator, not proof of phishing."
            animate={animate}
            delay={60}
          >
            {signals.length === 0 ? (
              <Empty>No rule-based indicators matched. That is not a guarantee of safety.</Empty>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {signals.map((e, i) => (
                  <li
                    key={e.rule_id}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border border-line bg-surface-2/50 py-3.5 pl-5 pr-4 transition-colors hover:border-line-strong hover:bg-surface-2",
                      animate && "motion-safe:animate-rise",
                    )}
                    style={animate ? { animationDelay: `${120 + i * 50}ms` } : undefined}
                  >
                    <span className={cn("absolute inset-y-3 left-0 w-1 rounded-r-full", STRENGTH_RAIL[e.strength])} aria-hidden="true" />
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                      <p className="flex min-w-0 items-start gap-2 text-sm font-semibold text-fg">
                        <span className="shrink-0 whitespace-nowrap rounded-md border border-line bg-surface px-1.5 py-0.5 font-mono text-[11px] font-medium text-fg-muted">
                          {e.rule_id}
                        </span>
                        {e.title}
                      </p>
                      <StrengthMeter strength={e.strength} />
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-fg-soft">{e.explanation}</p>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {isEmailResult(result) && <EmbeddedLinks result={result} animate={animate} />}
        </div>

        <div className="flex flex-col gap-5 lg:col-span-2">
          <Section icon={<BrainCircuit />} title="Model contributions" animate={animate} delay={100}>
            {result.model_contributions.length === 0 ? (
              <Empty>Machine-learning analysis is not available yet. This result uses documented rules only.</Empty>
            ) : (
              <ul className="flex flex-col gap-2">
                {result.model_contributions.map((m) => (
                  <li key={m.feature} className="text-sm text-fg-soft">
                    {m.label}
                    <span className="text-fg-muted">
                      {" "}— {m.direction === "towards_phishing" ? "towards phishing" : "towards legitimate"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {notes.length > 0 && (
            <Section icon={<Info />} title="About this result" animate={animate} delay={140}>
              <BulletList items={notes} />
            </Section>
          )}

          <Section icon={<ShieldQuestion />} title="Limitations" animate={animate} delay={180}>
            <BulletList items={result.limitations} />
          </Section>
        </div>
      </div>
    </div>
  );
}

function EmbeddedLinks({ result, animate }: { result: EmailScanResult; animate: boolean }) {
  const links = result.embedded_urls;
  const stats = [
    ["Found", links.found],
    ["Analysed", links.analysed],
    ["Not analysed", links.not_analysed],
    ["Failed", links.failed],
  ] as const;

  return (
    <Section
      icon={<Link2 />}
      title="Links in the email"
      description="From the visible text and hidden HTML link targets. Up to 20 unique links are analysed — none are opened."
      animate={animate}
      delay={100}
    >
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-line bg-surface-2/60 px-3 py-2.5">
            <dt className="text-xs text-fg-muted">{label}</dt>
            <dd className="mt-0.5 font-mono text-xl font-semibold tabular-nums text-fg">{formatNumber(value)}</dd>
          </div>
        ))}
      </dl>
      {links.findings.length === 0 ? (
        <Empty>No links were found in the email.</Empty>
      ) : (
        <ul className="overflow-hidden rounded-xl border border-line">
          {links.findings.map((f, i) => (
            <li
              key={`${f.display_value}-${i}`}
              className="flex flex-col gap-2 border-b border-line px-3.5 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className={cn("size-1.5 shrink-0 rounded-full", CATEGORY_STYLES[f.category].dot)} aria-hidden="true" />
                <DefangedUrl value={f.display_value} className="min-w-0" />
              </span>
              <span className="flex shrink-0 items-center gap-2 pl-4 sm:pl-0">
                {f.rule_ids.length > 0 && <span className="font-mono text-[11px] text-fg-muted">{f.rule_ids.join(" · ")}</span>}
                <CategoryBadge category={f.category} size="sm" />
              </span>
            </li>
          ))}
        </ul>
      )}
      {result.language.status === "not_checked" && (
        <p className="flex items-center gap-2 text-xs text-fg-muted">
          <FileText className="size-3.5" aria-hidden="true" />
          Language was not checked in this version. Reliable detection is supported for English only.
        </p>
      )}
    </Section>
  );
}

function Section({
  icon,
  title,
  description,
  children,
  animate,
  delay = 0,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  animate?: boolean;
  delay?: number;
}) {
  return (
    <Card className={cn(animate && "motion-safe:animate-rise")} style={animate ? { animationDelay: `${delay}ms` } : undefined}>
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex gap-3">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-fg-muted [&>svg]:size-4"
            aria-hidden="true"
          >
            {icon}
          </span>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold tracking-tight text-fg">{title}</h3>
            {description && <p className="mt-0.5 text-sm leading-relaxed text-fg-muted">{description}</p>}
          </div>
        </div>
        {children}
      </div>
    </Card>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((t) => (
        <li key={t} className="flex gap-2.5 text-sm leading-relaxed text-fg-soft">
          <span className="mt-2 size-1 shrink-0 rounded-full bg-fg-muted/60" aria-hidden="true" />
          {t}
        </li>
      ))}
    </ul>
  );
}

function Chip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-line bg-surface/90 px-2.5 text-xs font-medium text-fg-soft [&>svg]:size-3.5 [&>svg]:text-fg-muted">
      {icon}
      {children}
    </span>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-line-strong bg-surface-2/40 px-4 py-3.5 text-sm text-fg-muted">{children}</p>
  );
}
