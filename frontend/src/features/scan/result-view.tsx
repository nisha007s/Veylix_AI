import { BrainCircuit, Clock, EyeOff, Info, Link2, ListChecks, Mail, ShieldQuestion } from "lucide-react";
import type { ReactNode } from "react";

import { CategoryBadge } from "../../components/category-badge";
import { DefangedUrl } from "../../components/defanged-url";
import { StrengthMeter } from "../../components/strength-meter";
import { Card } from "../../components/ui/card";
import { CATEGORY_STYLES, NORMALIZATION_TEXT, NOTICE_TEXT } from "../../lib/display/categories";
import { cn, formatDateTime, formatNumber } from "../../lib/utils";
import { isEmailResult, type AnyScanResult, type EmailScanResult } from "../../types/api";

// Result layout follows SRS UI-009: category, mode, rule evidence, model
// contributions, embedded-URL findings (email), limitations.
// Everything is rendered as plain text; nothing from the scan is inserted as HTML.

export function ResultView({ result, headingId }: { result: AnyScanResult; headingId?: string }) {
  const style = CATEGORY_STYLES[result.category];
  const notices = result.notices.map((n) => NOTICE_TEXT[n]).filter(Boolean);
  const normalizations = result.normalizations.map((n) => NORMALIZATION_TEXT[n]).filter(Boolean);

  return (
    <div className="flex flex-col gap-4 motion-safe:animate-rise">
      {/* Summary */}
      <Card className="relative overflow-hidden">
        <div className={cn("absolute inset-y-0 left-0 w-1", style.rail)} aria-hidden="true" />
        <div className={cn("flex flex-col gap-5 p-5 pl-6 sm:p-7 sm:pl-8", style.soft)}>
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={result.category} size="lg" />
            <Chip>
              <ListChecks aria-hidden="true" />
              {result.analysis_mode === "rules_only" ? "Rule-based analysis" : "Rules + machine learning"}
            </Chip>
            {!result.saved && (
              <Chip>
                <EyeOff aria-hidden="true" />
                Not saved
              </Chip>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <h2 id={headingId} tabIndex={-1} className="text-xl font-semibold tracking-tight text-ink outline-none sm:text-2xl">
              {result.category_meaning}
            </h2>
            <p className="text-[15px] leading-relaxed text-ink-soft">{result.suggested_action}</p>
          </div>

          <div className="flex min-w-0 items-start gap-2.5 rounded-xl border border-line bg-surface/80 px-3.5 py-2.5">
            {result.input_type === "url" ? (
              <Link2 className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
            ) : (
              <Mail className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
            )}
            {result.input_type === "url" ? (
              <DefangedUrl value={result.display_value} />
            ) : (
              <span className="text-sm text-ink-soft">{result.display_value}</span>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-3">
          {/* Rule evidence */}
          <Section
            icon={<ListChecks />}
            title="Rule-based indicators"
            description="Documented signals that matched. Each one is an indicator, not proof of phishing."
          >
            {result.rule_evidence.length === 0 ? (
              <Empty>No rule-based indicators matched.</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {result.rule_evidence.map((e) => (
                  <li key={e.rule_id} className="flex flex-col gap-1.5 py-3.5 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <p className="text-sm font-medium text-ink">
                        <span className="mr-2 font-mono text-xs text-ink-muted">{e.rule_id}</span>
                        {e.title}
                      </p>
                      <StrengthMeter strength={e.strength} />
                    </div>
                    <p className="text-sm leading-relaxed text-ink-soft">{e.explanation}</p>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {isEmailResult(result) && <EmbeddedLinks result={result} />}
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Model contributions */}
          <Section icon={<BrainCircuit />} title="Model contributions">
            {result.model_contributions.length === 0 ? (
              <Empty>Machine-learning analysis is not available yet. This result uses documented rules only.</Empty>
            ) : (
              <ul className="flex flex-col gap-2">
                {result.model_contributions.map((m) => (
                  <li key={m.feature} className="text-sm text-ink-soft">
                    {m.label}
                    <span className="text-ink-muted">
                      {" "}— {m.direction === "towards_phishing" ? "towards phishing" : "towards legitimate"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {(notices.length > 0 || normalizations.length > 0) && (
            <Section icon={<Info />} title="About this result">
              <ul className="flex list-disc flex-col gap-1.5 pl-4 text-sm leading-relaxed text-ink-soft marker:text-ink-muted/60">
                {[...normalizations, ...notices].map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </Section>
          )}

          <Section icon={<ShieldQuestion />} title="Limitations">
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-sm leading-relaxed text-ink-soft marker:text-ink-muted/60">
              {result.limitations.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Section>
        </div>
      </div>

      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" aria-hidden="true" />
          Analysed {formatDateTime(result.analysed_at)}
        </span>
        <span>Rule version {result.versions.rule_version}</span>
        <span>Model {result.versions.model_version ?? "not used"}</span>
      </p>
    </div>
  );
}

function EmbeddedLinks({ result }: { result: EmailScanResult }) {
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
      description="Links from the text and from hidden HTML link targets. Up to 20 unique links are analysed; none are opened."
    >
      <dl className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-line bg-canvas/60 px-3 py-2.5">
            <dt className="text-xs text-ink-muted">{label}</dt>
            <dd className="text-lg font-semibold tabular-nums text-ink">{formatNumber(value)}</dd>
          </div>
        ))}
      </dl>
      {links.findings.length === 0 ? (
        <Empty>No links were found in the email.</Empty>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {links.findings.map((f, i) => (
            <li key={`${f.display_value}-${i}`} className="flex flex-col gap-2 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <DefangedUrl value={f.display_value} className="min-w-0" />
              <div className="flex shrink-0 items-center gap-2">
                {f.rule_ids.length > 0 && (
                  <span className="font-mono text-[11px] text-ink-muted">{f.rule_ids.join(" · ")}</span>
                )}
                <CategoryBadge category={f.category} size="sm" />
              </div>
            </li>
          ))}
        </ul>
      )}
      {result.language.status === "not_checked" && (
        <p className="mt-3 text-xs text-ink-muted">Language was not checked in this version. Reliable detection is supported for English only.</p>
      )}
    </Section>
  );
}

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex gap-3">
          <span className="mt-0.5 text-ink-muted [&>svg]:size-4" aria-hidden="true">{icon}</span>
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h3>
            {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
          </div>
        </div>
        {children}
      </div>
    </Card>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink-soft [&>svg]:size-3.5">
      {children}
    </span>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-line-strong px-4 py-3 text-sm text-ink-muted">{children}</p>;
}
