import { ArrowLeft, ChevronLeft, ChevronRight, FileSearch, Link2, Mail } from "lucide-react";
import { Link, useParams } from "react-router";

import { EmptyState } from "../components/empty-state";
import { PageHeader } from "../components/page-header";
import { buttonVariants } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useHistory } from "../features/history/history-context";
import { ResultView } from "../features/scan/result-view";
import { cn } from "../lib/utils";

export function ResultsPage() {
  const { id } = useParams();
  const { entries } = useHistory();
  const index = id ? entries.findIndex((e) => e.id === id) : 0;
  const entry = index >= 0 ? entries[index] : undefined;

  if (!entry) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader eyebrow="Scan results" icon={FileSearch} title={id ? "Result not available" : "No results yet"} />
        <Card>
          <EmptyState
            icon={FileSearch}
            title={id ? "This result is no longer in this tab" : "Run a scan to see its full analysis"}
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
            {id
              ? "Results are kept only in this browser tab and are cleared when you refresh or close it."
              : "The verdict, every matched indicator and the limitations of the analysis will appear here."}
          </EmptyState>
        </Card>
      </div>
    );
  }

  // Newer = lower index (history is newest first).
  const newer = index > 0 ? entries[index - 1] : undefined;
  const older = index < entries.length - 1 ? entries[index + 1] : undefined;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={`Scan results · ${entries.length - index} of ${entries.length}`}
        icon={FileSearch}
        title={entry.result.input_type === "url" ? "URL analysis" : "Email analysis"}
        description={id ? "The full explanation for this scan." : "Your most recent scan. Earlier results are in Scan History."}
        actions={
          <>
            <Link to="/history" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              <ArrowLeft aria-hidden="true" /> History
            </Link>
            <span className="flex overflow-hidden rounded-lg border border-line-strong bg-surface shadow-xs">
              <PagerLink to={older && `/results/${older.id}`} label="Older result" icon={ChevronLeft} />
              <span className="w-px bg-line" aria-hidden="true" />
              <PagerLink to={newer && `/results/${newer.id}`} label="Newer result" icon={ChevronRight} />
            </span>
          </>
        }
      />
      <ResultView key={entry.id} result={entry.result} />
    </div>
  );
}

function PagerLink({ to, label, icon: Icon }: { to?: string; label: string; icon: typeof ChevronLeft }) {
  const cls = "flex size-8 items-center justify-center transition-colors";
  if (!to) {
    return (
      <span className={cn(cls, "cursor-not-allowed text-fg-muted/40")} aria-label={`${label} (none)`} role="img">
        <Icon className="size-4" aria-hidden="true" />
      </span>
    );
  }
  return (
    <Link to={to} className={cn(cls, "text-fg-soft hover:bg-surface-2 hover:text-fg focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent outline-none")} aria-label={label}>
      <Icon className="size-4" aria-hidden="true" />
    </Link>
  );
}
