import { ArrowDownWideNarrow, ArrowUpRight, ArrowUpWideNarrow, History, Link2, Mail, Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";

import { CategoryBadge } from "../components/category-badge";
import { DefangedUrl } from "../components/defanged-url";
import { EmptyState } from "../components/empty-state";
import { PageHeader } from "../components/page-header";
import { Alert } from "../components/ui/alert";
import { Button, buttonVariants } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useHistory, type HistoryEntry } from "../features/history/history-context";
import { CATEGORY_ORDER, CATEGORY_STYLES } from "../lib/display/categories";
import { cn, formatDateTime, formatTime } from "../lib/utils";
import type { Category, InputType } from "../types/api";

type TypeFilter = "all" | InputType;
type CategoryFilter = "all" | Category;
type Sort = "newest" | "oldest";

export function HistoryPage() {
  const { entries, clear } = useHistory();
  const [type, setType] = useState<TypeFilter>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timer = window.setTimeout(() => setConfirming(false), 4000);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  const filtered = entries.filter(
    (e) => (type === "all" || e.result.input_type === type) && (category === "all" || e.result.category === category),
  );
  const visible = sort === "newest" ? filtered : [...filtered].reverse();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Scan history"
        icon={History}
        title="Everything you scanned this session."
        description="Only the analysis results are listed — never the URL or email text you submitted."
        actions={
          entries.length > 0 && (
            <Button
              variant={confirming ? "danger" : "secondary"}
              size="sm"
              onClick={() => {
                if (confirming) {
                  clear();
                  setConfirming(false);
                } else setConfirming(true);
              }}
            >
              <Trash2 aria-hidden="true" />
              {confirming ? "Click again to clear" : "Clear session"}
            </Button>
          )
        }
      />

      <Alert tone="privacy" className="motion-safe:animate-rise">
        Session only: results disappear when you refresh or close this tab. Nothing is saved on a server. Saved history will
        arrive with user accounts.
      </Alert>

      <Card className="overflow-hidden motion-safe:animate-rise" style={{ animationDelay: "60ms" }}>
        <div className="flex flex-col gap-3 border-b border-line bg-surface-2/40 p-4 lg:flex-row lg:items-center lg:justify-between sm:px-5">
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              label="Input type"
              value={type}
              onChange={setType}
              options={[
                { value: "all", label: "All" },
                { value: "url", label: <><Link2 className="size-3.5" aria-hidden="true" />URL</> },
                { value: "email", label: <><Mail className="size-3.5" aria-hidden="true" />Email</> },
              ]}
            />
            <Segmented
              label="Risk category"
              value={category}
              onChange={setCategory}
              options={[
                { value: "all", label: "Any risk" },
                ...CATEGORY_ORDER.map((c) => {
                  const { icon: Icon, label, text } = CATEGORY_STYLES[c];
                  return { value: c, label: <><Icon className={cn("size-3.5", text)} aria-hidden="true" />{label}</> };
                }),
              ]}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-fg-muted">
              {visible.length} of {entries.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSort((s) => (s === "newest" ? "oldest" : "newest"))}
              aria-label={`Sort by time, currently ${sort} first`}
            >
              {sort === "newest" ? <ArrowDownWideNarrow aria-hidden="true" /> : <ArrowUpWideNarrow aria-hidden="true" />}
              {sort === "newest" ? "Newest first" : "Oldest first"}
            </Button>
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={History}
            title={entries.length === 0 ? "No scans yet" : "No scans match these filters"}
            actions={
              entries.length === 0 ? (
                <>
                  <Link to="/scan/url" className={buttonVariants({ size: "sm" })}>
                    <Link2 aria-hidden="true" /> Scan a URL
                  </Link>
                  <Link to="/scan/email" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                    <Mail aria-hidden="true" /> Analyse an email
                  </Link>
                </>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => { setType("all"); setCategory("all"); }}>
                  Reset filters
                </Button>
              )
            }
          >
            {entries.length === 0 ? "Your URL and email scans from this session will be listed here." : "Try a different filter."}
          </EmptyState>
        ) : (
          <HistoryTable entries={visible} />
        )}
      </Card>
    </div>
  );
}

function HistoryTable({ entries }: { entries: HistoryEntry[] }) {
  const navigate = useNavigate();
  return (
    <>
      {/* Desktop / tablet table */}
      <table className="hidden w-full text-left text-sm md:table">
        <thead>
          <tr className="border-b border-line font-mono text-[11px] uppercase tracking-[0.12em] text-fg-muted">
            <th scope="col" className="w-28 px-5 py-3 font-medium">Type</th>
            <th scope="col" className="px-3 py-3 font-medium">Target</th>
            <th scope="col" className="w-36 px-3 py-3 font-medium">Risk</th>
            <th scope="col" className="w-24 px-3 py-3 text-right font-medium">Signals</th>
            <th scope="col" className="w-44 px-3 py-3 font-medium">Scanned</th>
            <th scope="col" className="w-14 px-5 py-3"><span className="sr-only">Open</span></th>
          </tr>
        </thead>
        <tbody>
          {entries.map(({ id, result }) => (
            <tr
              key={id}
              onClick={() => navigate(`/results/${id}`)}
              className="group cursor-pointer border-b border-line transition-colors last:border-b-0 hover:bg-surface-2/70"
            >
              <td className="px-5 py-3.5">
                <TypeLabel type={result.input_type} />
              </td>
              <td className="max-w-0 px-3 py-3.5">
                {result.input_type === "url" ? (
                  <DefangedUrl value={result.display_value} className="block truncate text-fg" />
                ) : (
                  <span className="block truncate text-fg-soft">{result.display_value}</span>
                )}
              </td>
              <td className="px-3 py-3.5">
                <CategoryBadge category={result.category} size="sm" />
              </td>
              <td className="px-3 py-3.5 text-right font-mono tabular-nums text-fg">{result.rule_evidence.length}</td>
              <td className="px-3 py-3.5 text-fg-muted">{formatDateTime(result.analysed_at)}</td>
              <td className="px-5 py-3.5 text-right">
                <Link
                  to={`/results/${id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex size-8 items-center justify-center rounded-lg text-fg-muted outline-none transition-all group-hover:bg-surface group-hover:text-accent group-hover:shadow-xs focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label="Open result"
                >
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile cards */}
      <ul className="divide-y divide-line md:hidden">
        {entries.map(({ id, result }) => (
          <li key={id}>
            <Link to={`/results/${id}`} className="flex flex-col gap-2.5 px-4 py-4 outline-none transition-colors hover:bg-surface-2/70 focus-visible:bg-surface-2">
              <div className="flex items-center justify-between gap-3">
                <TypeLabel type={result.input_type} />
                <CategoryBadge category={result.category} size="sm" />
              </div>
              {result.input_type === "url" ? (
                <DefangedUrl value={result.display_value} className="text-fg" />
              ) : (
                <span className="text-sm text-fg-soft">{result.display_value}</span>
              )}
              <span className="text-xs text-fg-muted">
                {formatTime(result.analysed_at)} · {result.rule_evidence.length} signal{result.rule_evidence.length === 1 ? "" : "s"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function TypeLabel({ type }: { type: InputType }) {
  const Icon = type === "url" ? Link2 : Mail;
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-fg-soft">
      <span className="flex size-7 items-center justify-center rounded-lg border border-line bg-surface-2 text-fg-muted">
        <Icon className="size-3.5" aria-hidden="true" />
      </span>
      {type === "url" ? "URL" : "Email"}
    </span>
  );
}

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex max-w-full flex-wrap gap-0.5 rounded-xl border border-line bg-surface-2 p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex h-8 cursor-pointer items-center gap-1.5 rounded-[10px] px-3 text-xs font-medium outline-none transition-all duration-200",
              "focus-visible:ring-2 focus-visible:ring-accent",
              active ? "bg-surface text-fg shadow-[0_1px_2px_rgba(10,18,38,0.1),0_0_0_1px_var(--line-strong)] dark:bg-surface-3" : "text-fg-muted hover:text-fg",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
