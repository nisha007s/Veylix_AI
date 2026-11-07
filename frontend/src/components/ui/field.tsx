import type { ComponentProps, LabelHTMLAttributes, ReactNode } from "react";

import { cn } from "../../lib/utils";

const fieldBase =
  "w-full bg-transparent text-fg placeholder:text-fg-muted/70 outline-none disabled:opacity-60";

// React 19: `ref` is a normal prop, included in ComponentProps.
export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldBase, "h-12 text-[15px]", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(fieldBase, "min-h-64 resize-y text-[15px] leading-relaxed", className)} {...props} />;
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-fg", className)} {...props} />;
}

/** The framed shell around inputs: focus ring, invalid state and hover. */
export function FieldFrame({
  invalid,
  className,
  children,
}: {
  invalid?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-invalid={invalid || undefined}
      className={cn(
        "relative rounded-2xl border border-line-strong bg-surface shadow-xs transition-[border-color,box-shadow] duration-200",
        "hover:border-fg-muted/40 focus-within:border-accent focus-within:shadow-[0_0_0_4px_var(--accent-soft),0_8px_24px_-12px_var(--glow)]",
        "data-invalid:border-risk-high data-invalid:focus-within:shadow-[0_0_0_4px_var(--risk-high-soft)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
