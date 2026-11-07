import type { HealthStatus } from "../features/health/use-health";
import { cn } from "../lib/utils";

const TEXT: Record<HealthStatus, string> = {
  checking: "Checking engine…",
  online: "Analysis engine online",
  offline: "Engine unreachable",
};

export function HealthIndicator({ status }: { status: HealthStatus }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-ink-soft" role="status">
      <span className="relative flex size-2">
        {status === "online" && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-40 motion-reduce:hidden" />
        )}
        <span
          className={cn(
            "relative inline-flex size-2 rounded-full",
            status === "online" && "bg-emerald-500",
            status === "offline" && "bg-red-500",
            status === "checking" && "bg-slate-300",
          )}
        />
      </span>
      {TEXT[status]}
    </span>
  );
}
