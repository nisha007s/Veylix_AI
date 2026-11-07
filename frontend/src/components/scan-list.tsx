import { ArrowUpRight, Link2, Mail } from "lucide-react";
import { Link } from "react-router";

import type { HistoryEntry } from "../features/history/history-context";
import { CATEGORY_STYLES } from "../lib/display/categories";
import { cn, formatTime } from "../lib/utils";
import { CategoryBadge } from "./category-badge";
import { DefangedUrl } from "./defanged-url";

/** Compact activity feed used on the dashboard. */
export function ScanList({ entries }: { entries: HistoryEntry[] }) {
  return (
    <ol className="relative flex flex-col">
      {entries.map(({ id, result }, i) => {
        const Icon = result.input_type === "url" ? Link2 : Mail;
        return (
          <li key={id} className="motion-safe:animate-rise" style={{ animationDelay: `${i * 40}ms` }}>
            <Link
              to={`/results/${id}`}
              className="group flex items-center gap-3 rounded-xl px-3 py-3 outline-none transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="relative flex size-9 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-2 text-fg-muted">
                <Icon className="size-4" aria-hidden="true" />
                <span className={cn("absolute -right-0.5 -top-0.5 size-2.5 rounded-full ring-2 ring-surface", CATEGORY_STYLES[result.category].dot)} aria-hidden="true" />
                <span className="sr-only">{result.input_type === "url" ? "URL scan" : "Email scan"}</span>
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                {result.input_type === "url" ? (
                  <DefangedUrl value={result.display_value} className="truncate text-fg" />
                ) : (
                  <span className="truncate text-sm text-fg">{result.display_value}</span>
                )}
                <span className="text-xs text-fg-muted">
                  {formatTime(result.analysed_at)} · {result.rule_evidence.length} signal
                  {result.rule_evidence.length === 1 ? "" : "s"}
                </span>
              </span>
              <CategoryBadge category={result.category} size="sm" className="hidden sm:inline-flex" />
              <ArrowUpRight
                className="size-4 shrink-0 text-fg-muted opacity-60 transition-[transform,opacity] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
                aria-hidden="true"
              />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
