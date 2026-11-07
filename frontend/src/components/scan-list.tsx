import { ChevronRight, Link2, Mail } from "lucide-react";
import { Link } from "react-router";

import type { HistoryEntry } from "../features/history/history-context";
import { formatDateTime } from "../lib/utils";
import { CategoryBadge } from "./category-badge";
import { DefangedUrl } from "./defanged-url";

export function ScanList({ entries }: { entries: HistoryEntry[] }) {
  return (
    <ul className="divide-y divide-line">
      {entries.map(({ id, result }) => {
        const Icon = result.input_type === "url" ? Link2 : Mail;
        return (
          <li key={id}>
            <Link
              to={`/results/${id}`}
              className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-canvas/70 focus-visible:-outline-offset-2 sm:px-6"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas text-ink-muted">
                <Icon className="size-4" aria-hidden="true" />
                <span className="sr-only">{result.input_type === "url" ? "URL scan" : "Email scan"}</span>
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                {result.input_type === "url" ? (
                  <DefangedUrl value={result.display_value} className="truncate text-ink" />
                ) : (
                  <span className="truncate text-sm text-ink">{result.display_value}</span>
                )}
                <span className="text-xs text-ink-muted">
                  {formatDateTime(result.analysed_at)} · {result.rule_evidence.length} indicator
                  {result.rule_evidence.length === 1 ? "" : "s"}
                </span>
              </span>
              <CategoryBadge category={result.category} size="sm" />
              <ChevronRight className="size-4 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
