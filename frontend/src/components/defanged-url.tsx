import { cn } from "../lib/utils";

interface Props {
  value: string;
  className?: string;
}

// Shows a backend-defanged URL as plain text. Never a link (SRS UI-007, AC-12).
export function DefangedUrl({ value, className }: Props) {
  return (
    <span
      className={cn("break-all font-mono text-[13px] text-ink-soft", className)}
      title="Defanged address — not clickable"
      translate="no"
    >
      {value}
    </span>
  );
}
