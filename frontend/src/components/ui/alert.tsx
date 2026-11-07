import { cva, type VariantProps } from "class-variance-authority";
import { CircleAlert, Info, ShieldCheck, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../../lib/utils";

const alertVariants = cva(
  "flex gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      tone: {
        info: "border-accent-line/70 bg-accent-soft text-fg-soft [&>svg]:text-accent",
        privacy: "border-line bg-surface-2 text-fg-soft [&>svg]:text-risk-low",
        warning: "border-risk-medium-line bg-risk-medium-soft text-risk-medium-text [&>svg]:text-risk-medium",
        error: "border-risk-high-line bg-risk-high-soft text-risk-high-text [&>svg]:text-risk-high",
      },
    },
    defaultVariants: { tone: "info" },
  },
);

const ICONS = { info: Info, privacy: ShieldCheck, warning: TriangleAlert, error: CircleAlert };

interface AlertProps extends VariantProps<typeof alertVariants> {
  title?: string;
  children: ReactNode;
  className?: string;
  role?: "alert" | "status";
}

export function Alert({ tone = "info", title, children, className, role }: AlertProps) {
  const Icon = ICONS[tone ?? "info"];
  return (
    <div role={role} className={cn(alertVariants({ tone }), className)}>
      <Icon aria-hidden="true" />
      <div className="min-w-0">
        {title && <p className="font-medium text-fg">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
