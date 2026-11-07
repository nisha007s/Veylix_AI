import { STRENGTH_LEVEL } from "../lib/display/categories";
import { cn } from "../lib/utils";
import type { Strength } from "../types/api";

export function StrengthMeter({ strength }: { strength: Strength }) {
  const level = STRENGTH_LEVEL[strength];
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium capitalize text-ink-muted">
      <span className="flex items-end gap-0.5" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "w-1 rounded-full",
              i === 1 ? "h-1.5" : i === 2 ? "h-2.5" : "h-3.5",
              i <= level ? "bg-ink-soft" : "bg-line-strong",
            )}
          />
        ))}
      </span>
      {strength} indicator
    </span>
  );
}
