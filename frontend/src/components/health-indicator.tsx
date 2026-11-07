import type { HealthStatus } from "../features/health/use-health";
import { cn } from "../lib/utils";

const TEXT: Record<HealthStatus, string> = {
  checking: "Connecting…",
  online: "Engine online",
  offline: "Engine offline",
};

export function HealthIndicator({ status, className }: { status: HealthStatus; className?: string }) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-full border border-line bg-surface px-3 text-xs font-medium text-fg-soft shadow-xs",
        className,
      )}
    >
      <span className="relative flex size-2">
        {status === "online" && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-risk-low opacity-50 motion-reduce:hidden" />
        )}
        <span
          className={cn(
            "relative inline-flex size-2 rounded-full",
            status === "online" && "bg-risk-low",
            status === "offline" && "bg-risk-high",
            status === "checking" && "bg-fg-muted/50",
          )}
        />
      </span>
      {TEXT[status]}
    </span>
  );
}
