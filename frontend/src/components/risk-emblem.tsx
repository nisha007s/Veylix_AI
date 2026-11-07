import { CATEGORY_STYLES } from "../lib/display/categories";
import { cn } from "../lib/utils";
import type { Category } from "../types/api";

/** Large category emblem used on result verdicts. Decorative; the label is shown next to it. */
export function RiskEmblem({ category, animate = true }: { category: Category; animate?: boolean }) {
  const style = CATEGORY_STYLES[category];
  const Icon = style.icon;
  return (
    <span className="relative flex size-16 shrink-0 items-center justify-center sm:size-20" aria-hidden="true">
      {animate && (
        <span className={cn("absolute inset-0 rounded-[28%] border-2 motion-safe:animate-ring", style.line)} />
      )}
      <span
        className={cn(
          "relative flex size-full items-center justify-center rounded-[28%] border bg-surface",
          style.line,
          style.glow,
          animate && "motion-safe:animate-pop",
        )}
      >
        <span className={cn("absolute inset-1.5 rounded-[24%]", style.soft)} />
        <Icon className={cn("relative size-7 sm:size-8", style.text)} strokeWidth={1.75} />
      </span>
    </span>
  );
}
