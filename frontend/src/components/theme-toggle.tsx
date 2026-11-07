import { Moon, Sun } from "lucide-react";

import { useTheme } from "../features/theme/theme";
import { cn } from "../lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "group relative flex h-9 w-17 shrink-0 cursor-pointer items-center rounded-full border border-line-strong bg-surface-2 p-1",
        "shadow-[inset_0_1px_2px_rgba(10,18,38,0.06)] transition-colors duration-300 hover:border-fg-muted/45",
        "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none",
        className,
      )}
    >
      <Sun className="absolute left-2.5 size-3.5 text-fg-muted" aria-hidden="true" />
      <Moon className="absolute right-2.5 size-3.5 text-fg-muted" aria-hidden="true" />
      <span
        className={cn(
          "relative z-10 flex size-7 items-center justify-center rounded-full bg-surface shadow-[0_1px_3px_rgba(10,18,38,0.2)] ring-1 ring-line",
          "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          dark && "translate-x-7.5",
        )}
        aria-hidden="true"
      >
        {dark ? <Moon className="size-3.5 text-accent" /> : <Sun className="size-3.5 text-risk-medium" />}
      </span>
    </button>
  );
}
