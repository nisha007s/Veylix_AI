import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

// Custom button system: machined edge, layered shadow, press feedback,
// two-ring focus and a built-in loading state.
export const buttonVariants = cva(
  "group/btn relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 overflow-hidden " +
    "whitespace-nowrap font-medium tracking-[-0.01em] outline-none " +
    "transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out " +
    "active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas " +
    "disabled:pointer-events-none disabled:opacity-45 aria-busy:cursor-progress " +
    "[&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-fg shadow-accent " +
          "bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0)_55%)] " +
          "ring-1 ring-inset ring-white/15 hover:bg-accent-strong dark:hover:bg-accent " +
          "hover:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_14px_32px_-10px_var(--glow)] dark:hover:brightness-110",
        secondary:
          "border border-line-strong bg-surface text-fg shadow-xs edge-highlight " +
          "hover:border-fg-muted/45 hover:bg-surface-2",
        ghost: "text-fg-soft hover:bg-surface-2 hover:text-fg",
        subtle: "bg-accent-soft text-accent-strong ring-1 ring-inset ring-accent-line/60 hover:ring-accent-line",
        danger:
          "bg-risk-high text-white shadow-xs ring-1 ring-inset ring-white/15 hover:brightness-110",
      },
      size: {
        sm: "h-8 rounded-lg px-3 text-[13px]",
        md: "h-10 rounded-xl px-4 text-sm",
        lg: "h-12 rounded-xl px-5 text-[15px]",
        icon: "size-9 rounded-xl",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({ className, variant, size, type = "button", loading, disabled, children, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (variant ?? "primary") === "primary" && (
        <span
          className="pointer-events-none absolute inset-0 motion-safe:animate-shimmer bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent)]"
          aria-hidden="true"
        />
      )}
      {loading && <LoaderCircle className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
