import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  icon: Icon,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  icon?: LucideIcon;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 motion-safe:animate-rise sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-col gap-3">
        {eyebrow && (
          <span className="inline-flex w-fit items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
            {Icon && (
              <span className="flex size-6 items-center justify-center rounded-md bg-accent-soft ring-1 ring-inset ring-accent-line/60">
                <Icon className="size-3.5" aria-hidden="true" />
              </span>
            )}
            {eyebrow}
          </span>
        )}
        <h1 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] text-fg sm:text-4xl">{title}</h1>
        {description && <p className="max-w-2xl text-[15px] leading-relaxed text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
