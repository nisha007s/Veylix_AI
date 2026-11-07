import { ArrowLeft, FileSearch, Link2, Mail } from "lucide-react";
import { Link, useParams } from "react-router";

import { PageHeader } from "../components/page-header";
import { buttonVariants } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useHistory } from "../features/history/history-context";
import { ResultView } from "../features/scan/result-view";

export function ResultsPage() {
  const { id } = useParams();
  const { entries, get } = useHistory();
  const entry = id ? get(id) : entries[0];

  if (!entry) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Scan Results" />
        <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <FileSearch className="size-7 text-ink-muted" aria-hidden="true" />
          <h2 className="text-base font-semibold text-ink">{id ? "Result not available" : "No results yet"}</h2>
          <p className="max-w-sm text-sm leading-relaxed text-ink-muted">
            {id
              ? "Results are kept only in this browser tab and are cleared when you refresh or close it."
              : "Run a scan and its full result will appear here."}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Link to="/scan/url" className={buttonVariants({ size: "sm" })}>
              <Link2 aria-hidden="true" /> Scan a URL
            </Link>
            <Link to="/scan/email" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              <Mail aria-hidden="true" /> Analyse an email
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Scan Results"
        description={
          id ? "Full explanation for this scan." : "Your most recent scan. Earlier results are in Scan History."
        }
        actions={
          <Link to="/history" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            <ArrowLeft aria-hidden="true" /> Scan History
          </Link>
        }
      />
      <ResultView key={entry.id} result={entry.result} />
    </div>
  );
}
