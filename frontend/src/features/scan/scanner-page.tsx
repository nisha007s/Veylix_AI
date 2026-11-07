import { ArrowUpRight, CornerDownLeft, Eraser, Radar, RotateCcw, ScanSearch, ShieldCheck, type LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link } from "react-router";

import { EmptyState } from "../../components/empty-state";
import { PageHeader } from "../../components/page-header";
import { Alert } from "../../components/ui/alert";
import { Button, buttonVariants } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { FieldFrame, Input, Textarea } from "../../components/ui/field";
import { cn, formatNumber } from "../../lib/utils";
import type { AnyScanResult } from "../../types/api";
import { useHistory } from "../history/history-context";
import { ResultView } from "./result-view";
import { useScan } from "./use-scan";

export interface ScannerConfig {
  eyebrow: string;
  icon: LucideIcon;
  title: string;
  description: string;
  label: string;
  placeholder: string;
  helper: string;
  submitLabel: string;
  loadingLabel: string;
  emptyMessage: string;
  tooLongMessage: string;
  fieldName: "url" | "text";
  maxLength: number;
  multiline: boolean;
  privacy: string[];
  examples: { label: string; value: string }[];
  checks: { icon: LucideIcon; title: string; text: string }[];
  idleHint: string;
  scan: (input: string, signal: AbortSignal) => Promise<AnyScanResult>;
}

export function ScannerPage({ config }: { config: ScannerConfig }) {
  const { add } = useHistory();
  const { state, run, reset } = useScan(config.scan);
  const [value, setValue] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const [lastId, setLastId] = useState<string | null>(null);

  const fieldId = useId();
  const helpId = `${fieldId}-help`;
  const errorId = `${fieldId}-error`;
  const resultHeadingId = `${fieldId}-result`;
  const resultRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  const loading = state.status === "loading";
  const tooLong = value.length > config.maxLength;
  const nearLimit = !tooLong && value.length > config.maxLength * 0.9;

  // A server validation error for this field is shown next to the field (SRS UI-005).
  const serverFieldError =
    state.status === "error" && state.error.fields.some((f) => f.field === config.fieldName) ? state.error.message : null;
  const fieldError = clientError ?? serverFieldError;
  const generalError = state.status === "error" && !serverFieldError ? state.error : null;

  useEffect(() => {
    if (state.status === "success") {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById(resultHeadingId)?.focus({ preventScroll: true });
    }
  }, [state.status, resultHeadingId]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (loading) return;
    if (!value.trim()) {
      setClientError(config.emptyMessage);
      inputRef.current?.focus();
      return;
    }
    if (tooLong) {
      setClientError(config.tooLongMessage);
      return;
    }
    setClientError(null);
    const result = await run(value);
    if (result) setLastId(add(result));
  }

  function onKeyDown(event: KeyboardEvent) {
    if (config.multiline && event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      submit();
    }
  }

  function onChange(next: string) {
    setValue(next);
    if (clientError) setClientError(null);
  }

  function startOver() {
    setValue("");
    setClientError(null);
    setLastId(null);
    reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => inputRef.current?.focus(), 300);
  }

  const fieldProps = {
    id: fieldId,
    ref: inputRef,
    value,
    placeholder: config.placeholder,
    spellCheck: false,
    autoComplete: "off",
    "aria-invalid": fieldError ? true : undefined,
    "aria-describedby": fieldError ? `${errorId} ${helpId}` : helpId,
    onKeyDown,
  } as const;

  const counter = (
    <span
      className={cn(
        "font-mono text-[11px] tabular-nums",
        tooLong ? "font-semibold text-risk-high-text" : nearLimit ? "text-risk-medium-text" : "text-fg-muted",
      )}
    >
      {formatNumber(value.length)} / {formatNumber(config.maxLength)}
    </span>
  );

  const submitButton = (
    <Button type="submit" size="lg" loading={loading} className="w-full sm:w-auto sm:min-w-44">
      {!loading && <ScanSearch aria-hidden="true" />}
      {loading ? config.loadingLabel : config.submitLabel}
    </Button>
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow={config.eyebrow} icon={config.icon} title={config.title} description={config.description} />

      <div className="grid gap-5 lg:grid-cols-12">
        {/* Input */}
        <form onSubmit={submit} noValidate className="flex flex-col gap-4 motion-safe:animate-rise lg:col-span-8">
          <label htmlFor={fieldId} className="sr-only">
            {config.label}
          </label>

          {config.multiline ? (
            <FieldFrame invalid={!!fieldError}>
              <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
                <span className="flex items-center gap-2 text-sm font-medium text-fg">
                  <span className="flex gap-1" aria-hidden="true">
                    <span className="size-2 rounded-full bg-line-strong" />
                    <span className="size-2 rounded-full bg-line-strong" />
                    <span className="size-2 rounded-full bg-line-strong" />
                  </span>
                  {config.label}
                </span>
                <span className="flex items-center gap-2">
                  {counter}
                  {value && (
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onChange("")} aria-label="Clear text">
                      <Eraser aria-hidden="true" />
                      <span className="hidden sm:inline">Clear</span>
                    </Button>
                  )}
                </span>
              </div>
              <Textarea {...fieldProps} className="px-4 py-3.5" onChange={(e) => onChange(e.target.value)} />
              <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="hidden items-center gap-1.5 text-xs text-fg-muted sm:flex">
                  <kbd className="rounded-md border border-line-strong bg-surface-2 px-1.5 py-0.5 font-mono text-[10px]">Ctrl</kbd>
                  <kbd className="rounded-md border border-line-strong bg-surface-2 px-1.5 py-0.5 font-mono text-[10px]">
                    <CornerDownLeft className="inline size-3" aria-label="Enter" />
                  </kbd>
                  to analyse
                </span>
                {submitButton}
              </div>
            </FieldFrame>
          ) : (
            <FieldFrame invalid={!!fieldError} className="p-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3 pl-3">
                  <config.icon className="size-5 shrink-0 text-fg-muted" aria-hidden="true" />
                  <Input
                    {...fieldProps}
                    type="text"
                    inputMode="url"
                    className="font-mono text-[14px] sm:text-[15px]"
                    onChange={(e) => onChange(e.target.value)}
                  />
                  <span className="hidden shrink-0 pr-1 sm:inline">{counter}</span>
                </div>
                {submitButton}
              </div>
            </FieldFrame>
          )}

          <div className="flex flex-col gap-3 px-1">
            {fieldError && (
              <p id={errorId} className="flex items-center gap-2 text-sm font-medium text-risk-high-text motion-safe:animate-fade">
                <span className="size-1.5 rounded-full bg-risk-high" aria-hidden="true" />
                {fieldError}
              </p>
            )}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p id={helpId} className="text-xs leading-relaxed text-fg-muted">
                {config.helper}
              </p>
              {!config.multiline && <span className="sm:hidden">{counter}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 font-mono text-[11px] uppercase tracking-wider text-fg-muted">Try</span>
              {config.examples.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => {
                    onChange(ex.value);
                    inputRef.current?.focus();
                  }}
                  className="h-7 cursor-pointer rounded-full border border-line bg-surface px-3 text-xs font-medium text-fg-soft shadow-xs outline-none transition-all duration-200 hover:-translate-y-px hover:border-accent-line hover:text-accent-strong focus-visible:ring-2 focus-visible:ring-accent active:translate-y-0"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Side panel */}
        <aside className="flex flex-col gap-4 motion-safe:animate-rise lg:col-span-4" style={{ animationDelay: "80ms" }}>
          <Card>
            <div className="flex flex-col gap-4 p-5">
              <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-fg-muted">What Veylix checks</h2>
              <ul className="flex flex-col gap-3.5">
                {config.checks.map(({ icon: Icon, title, text }) => (
                  <li key={title} className="flex gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent ring-1 ring-inset ring-accent-line/50">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-fg">{title}</p>
                      <p className="text-[13px] leading-relaxed text-fg-muted">{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
          <div className="flex flex-col gap-2.5 rounded-2xl border border-line bg-surface-2/60 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-fg">
              <ShieldCheck className="size-4 text-risk-low" aria-hidden="true" />
              Privacy
            </p>
            <ul className="flex flex-col gap-1.5">
              {config.privacy.map((p) => (
                <li key={p} className="flex gap-2 text-[13px] leading-relaxed text-fg-muted">
                  <span className="mt-[7px] size-1 shrink-0 rounded-full bg-fg-muted/60" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* Output */}
      <section ref={resultRef} aria-live="polite" aria-label="Scan result" className="scroll-mt-24">
        {state.status === "idle" && (
          <Card className="motion-safe:animate-rise" style={{ animationDelay: "140ms" }}>
            <EmptyState icon={Radar} title="Awaiting input">
              {config.idleHint}
            </EmptyState>
          </Card>
        )}

        {loading && <Scanning label={config.loadingLabel} />}

        {generalError && (
          <Alert tone="error" role="alert" title="The scan could not be completed" className="motion-safe:animate-rise">
            {generalError.message}
            {generalError.requestId && (
              <span className="mt-1 block font-mono text-xs opacity-70">Reference: {generalError.requestId}</span>
            )}
          </Alert>
        )}

        {state.status === "success" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-fg-muted">
                <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
                Analysis complete
              </h2>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={startOver}>
                  <RotateCcw aria-hidden="true" /> New scan
                </Button>
                {lastId && (
                  <Link to={`/results/${lastId}`} className={buttonVariants({ variant: "subtle", size: "sm" })}>
                    Open in Results <ArrowUpRight aria-hidden="true" />
                  </Link>
                )}
              </div>
            </div>
            <ResultView result={state.result} headingId={resultHeadingId} />
          </div>
        )}
      </section>
    </div>
  );
}

function Scanning({ label }: { label: string }) {
  return (
    <Card className="overflow-hidden motion-safe:animate-fade" role="status" aria-label={label}>
      <div className="relative p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute inset-x-0 top-0 h-full motion-safe:animate-scanline">
            <div className="h-24 bg-[linear-gradient(to_bottom,transparent,var(--accent-soft),transparent)]" />
            <div className="h-px bg-accent/60 shadow-[0_0_12px_var(--glow)]" />
          </div>
        </div>
        <div className="relative flex items-center gap-4">
          <span className="relative flex size-12 items-center justify-center rounded-2xl border border-accent-line bg-accent-soft">
            <Radar className="size-5 text-accent motion-safe:animate-spin" style={{ animationDuration: "2.4s" }} aria-hidden="true" />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-fg">{label}</p>
            <p className="text-sm text-fg-muted">Reading it as text only — nothing is opened or fetched.</p>
          </div>
        </div>
        <div className="relative mt-6 grid gap-3 sm:grid-cols-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl border border-line bg-surface-2/60" />
          ))}
        </div>
      </div>
    </Card>
  );
}
