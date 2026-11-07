import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  children,
  actions,
  className,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative flex flex-col items-center gap-3 overflow-hidden px-6 py-14 text-center", className)}>
      <div className="bg-grid mask-fade-b pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
      <span className="relative flex size-12 items-center justify-center rounded-2xl border border-line bg-surface shadow-card edge-highlight">
        <span className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_50%_0%,var(--accent-soft),transparent_70%)]" aria-hidden="true" />
        <Icon className="relative size-5 text-accent" aria-hidden="true" />
      </span>
      <p className="relative text-[15px] font-semibold tracking-tight text-fg">{title}</p>
      {children && <div className="relative max-w-sm text-sm leading-relaxed text-fg-muted">{children}</div>}
      {actions && <div className="relative mt-2 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
