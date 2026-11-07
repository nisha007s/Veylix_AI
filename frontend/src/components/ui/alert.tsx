import { cva, type VariantProps } from "class-variance-authority";
import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../../lib/utils";

const alertVariants = cva("flex gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0", {
  variants: {
    tone: {
      info: "border-accent/15 bg-accent-soft/70 text-ink-soft [&>svg]:text-accent",
      warning: "border-amber-200 bg-amber-50 text-amber-900 [&>svg]:text-amber-600",
      error: "border-red-200 bg-red-50 text-red-900 [&>svg]:text-red-600",
    },
  },
  defaultVariants: { tone: "info" },
});

const ICONS = { info: Info, warning: TriangleAlert, error: CircleAlert };

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
        {title && <p className="font-medium">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
