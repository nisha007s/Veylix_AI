import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 rounded-lg font-medium " +
    "transition-[background-color,box-shadow,transform,color] duration-150 " +
    "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-white shadow-[0_1px_2px_rgba(15,27,51,0.12),inset_0_1px_0_rgba(255,255,255,0.12)] " +
          "hover:bg-accent-strong active:translate-y-px",
        secondary:
          "border border-line-strong bg-surface text-ink shadow-[0_1px_2px_rgba(15,27,51,0.05)] " +
          "hover:border-ink-muted/40 hover:bg-canvas",
        ghost: "text-ink-soft hover:bg-canvas hover:text-ink",
        subtle: "bg-accent-soft text-accent-strong hover:bg-[#e2eaff]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-5 text-[15px]",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
