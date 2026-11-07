import { STRENGTH_LEVEL } from "../lib/display/categories";
import { cn } from "../lib/utils";
import type { Strength } from "../types/api";

const TONE: Record<Strength, string> = {
  strong: "bg-risk-high",
  moderate: "bg-risk-medium",
  weak: "bg-fg-muted",
};

/** Three-segment signal strength, always with a text label (never colour alone). */
export function StrengthMeter({ strength, compact }: { strength: Strength; compact?: boolean }) {
  const level = STRENGTH_LEVEL[strength];
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-fg-muted">
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn("h-1.5 w-3.5 rounded-full", i <= level ? TONE[strength] : "bg-line-strong")}
          />
        ))}
      </span>
      <span>
        {strength.charAt(0).toUpperCase() + strength.slice(1)}
        {!compact && " signal"}
      </span>
    </span>
  );
}
