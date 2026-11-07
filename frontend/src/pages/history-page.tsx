import { History, Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { CategoryBadge } from "../components/category-badge";
import { PageHeader } from "../components/page-header";
import { ScanList } from "../components/scan-list";
import { Alert } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useHistory } from "../features/history/history-context";
import { CATEGORY_ORDER } from "../lib/display/categories";
import { cn } from "../lib/utils";
import type { Category, InputType } from "../types/api";

type TypeFilter = "all" | InputType;
type CategoryFilter = "all" | Category;

export function HistoryPage() {
  const { entries, clear } = useHistory();
  const [type, setType] = useState<TypeFilter>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timer = window.setTimeout(() => setConfirming(false), 4000);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  const visible = entries.filter(
    (e) => (type === "all" || e.result.input_type === type) && (category === "all" || e.result.category === category),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Scan History"
        description="Results from this browser tab, newest first."
        actions={
          entries.length > 0 && (
            <Button
              variant={confirming ? "primary" : "secondary"}
              size="sm"
              className={cn(confirming && "bg-red-600 hover:bg-red-700")}
              onClick={() => {
                if (confirming) {
                  clear();
                  setConfirming(false);
                } else setConfirming(true);
              }}
            >
              <Trash2 aria-hidden="true" />
              {confirming ? "Confirm clear" : "Clear session"}
            </Button>
          )
        }
      />

      <Alert tone="info">
        Session only: results disappear when you refresh or close this tab. Nothing is saved on the server. Saved history
        will arrive with user accounts.
      </Alert>

      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Segmented
            label="Input type"
            value={type}
            onChange={setType}
            options={[
              { value: "all", label: "All" },
              { value: "url", label: "URL" },
              { value: "email", label: "Email" },
            ]}
          />
          <Segmented
            label="Risk category"
            value={category}
            onChange={setCategory}
            options={[
              { value: "all", label: "All" },
              ...CATEGORY_ORDER.map((c) => ({ value: c, label: <CategoryBadge category={c} size="sm" className="ring-0 bg-transparent px-0" /> })),
            ]}
          />
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <History className="size-6 text-ink-muted" aria-hidden="true" />
            <p className="text-sm font-medium text-ink">{entries.length === 0 ? "No scans yet" : "No scans match these filters"}</p>
            <p className="max-w-xs text-sm text-ink-muted">
              {entries.length === 0 ? "Your URL and email scans from this session will be listed here." : "Try a different filter."}
            </p>
          </div>
        ) : (
          <div className="py-1">
            <ScanList entries={visible} />
          </div>
        )}
      </Card>
    </div>
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
    <div role="radiogroup" aria-label={label} className="flex max-w-full flex-wrap gap-1 rounded-xl bg-canvas p-1 ring-1 ring-inset ring-line">
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
              "flex h-8 cursor-pointer items-center rounded-lg px-3 text-xs font-medium transition-all duration-150",
              active ? "bg-surface text-ink shadow-[0_1px_2px_rgba(15,27,51,0.08)] ring-1 ring-line" : "text-ink-muted hover:text-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
