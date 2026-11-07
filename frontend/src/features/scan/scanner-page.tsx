import { ArrowRight, LoaderCircle, RotateCcw, ScanSearch, type LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link } from "react-router";

import { Alert } from "../../components/ui/alert";
import { Button, buttonVariants } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input, Label, Textarea } from "../../components/ui/field";
import { PageHeader } from "../../components/page-header";
import { cn, formatNumber } from "../../lib/utils";
import type { AnyScanResult } from "../../types/api";
import { useHistory } from "../history/history-context";
import { ResultView } from "./result-view";
import { useScan } from "./use-scan";

export interface ScannerConfig {
  title: string;
  description: string;
  label: string;
  placeholder: string;
  helper: string;
  submitLabel: string;
  emptyMessage: string;
  tooLongMessage: string;
  fieldName: "url" | "text";
  maxLength: number;
  multiline: boolean;
  notices?: string[];
  examples: { label: string; value: string }[];
  checks: { icon: LucideIcon; title: string; text: string }[];
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

  const loading = state.status === "loading";
  const tooLong = value.length > config.maxLength;

  // A server validation error for this field is shown next to the field (SRS UI-005).
  const serverFieldError =
    state.status === "error" && state.error.fields.some((f) => f.field === config.fieldName)
      ? state.error.message
      : null;
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
    if (!value.trim()) return setClientError(config.emptyMessage);
    if (tooLong) return setClientError(config.tooLongMessage);
    setClientError(null);
    const result = await run(value);
    if (result) setLastId(add(result));
  }

  function onKeyDown(event: KeyboardEvent) {
    if (config.multiline && event.key === "Enter" && (event.ctrlKey || event.metaKey)) submit();
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
  }

  const fieldProps = {
    id: fieldId,
    value,
    placeholder: config.placeholder,
    spellCheck: false,
    autoComplete: "off",
    "aria-invalid": fieldError ? true : undefined,
    "aria-describedby": fieldError ? `${errorId} ${helpId}` : helpId,
    onKeyDown,
  } as const;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={config.title} description={config.description} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <form onSubmit={submit} noValidate className="flex flex-col gap-4 p-5 sm:p-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <Label htmlFor={fieldId}>{config.label}</Label>
                <span className={cn("text-xs tabular-nums", tooLong ? "font-medium text-red-700" : "text-ink-muted")} aria-live="polite">
                  {formatNumber(value.length)} / {formatNumber(config.maxLength)}
                </span>
              </div>
              {config.multiline ? (
                <Textarea {...fieldProps} onChange={(e) => onChange(e.target.value)} />
              ) : (
                <Input {...fieldProps} type="text" inputMode="url" className="font-mono text-[14px]" onChange={(e) => onChange(e.target.value)} />
              )}
              {fieldError && (
                <p id={errorId} className="text-sm font-medium text-red-700">
                  {fieldError}
                </p>
              )}
              <p id={helpId} className="text-xs leading-relaxed text-ink-muted">
                {config.helper}
              </p>
            </div>

            {config.notices && (
              <Alert tone="info">
                <ul className="flex list-disc flex-col gap-0.5 pl-4">
                  {config.notices.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </Alert>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs text-ink-muted">Try:</span>
                {config.examples.map((ex) => (
                  <Button key={ex.label} variant="ghost" size="sm" className="h-7 rounded-full border border-line px-2.5 font-normal" onClick={() => onChange(ex.value)}>
                    {ex.label}
                  </Button>
                ))}
              </div>
              <Button type="submit" size="lg" disabled={loading} aria-busy={loading} className="sm:min-w-40">
                {loading ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <ScanSearch aria-hidden="true" />}
                {loading ? "Analysing…" : config.submitLabel}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="h-fit">
          <div className="flex flex-col gap-4 p-5 sm:p-6">
            <h2 className="text-[15px] font-semibold tracking-tight">What Veylix checks</h2>
            <ul className="flex flex-col gap-3.5">
              {config.checks.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{title}</p>
                    <p className="text-sm leading-relaxed text-ink-muted">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <div ref={resultRef} aria-live="polite" className="scroll-mt-24">
        {generalError && (
          <Alert tone="error" role="alert" title="The scan could not be completed">
            {generalError.message}
            {generalError.requestId && (
              <span className="mt-1 block font-mono text-xs opacity-70">Reference: {generalError.requestId}</span>
            )}
          </Alert>
        )}
        {loading && <ResultSkeleton />}
        {state.status === "success" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-medium uppercase tracking-wider text-ink-muted">Result</h2>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={startOver}>
                  <RotateCcw aria-hidden="true" /> New scan
                </Button>
                {lastId && (
                  <Link to={`/results/${lastId}`} className={buttonVariants({ variant: "subtle", size: "sm" })}>
                    Open result <ArrowRight aria-hidden="true" />
                  </Link>
                )}
              </div>
            </div>
            <ResultView result={state.result} headingId={resultHeadingId} />
          </div>
        )}
      </div>
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-label="Analysing" role="status">
      <div className="h-44 animate-pulse rounded-2xl border border-line bg-surface" />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="h-40 animate-pulse rounded-2xl border border-line bg-surface lg:col-span-3" />
        <div className="h-40 animate-pulse rounded-2xl border border-line bg-surface lg:col-span-2" />
      </div>
    </div>
  );
}
