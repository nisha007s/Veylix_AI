import { CATEGORY_STYLES } from "../lib/display/categories";
import { cn } from "../lib/utils";
import type { Category } from "../types/api";

interface Props {
  category: Category;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Text + icon + colour, never colour alone (SRS UI-006).
export function CategoryBadge({ category, size = "md", className }: Props) {
  const style = CATEGORY_STYLES[category];
  const Icon = style.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium ring-1 ring-inset",
        size === "sm" && "h-6 px-2 text-xs [&>svg]:size-3.5",
        size === "md" && "h-7 px-2.5 text-xs [&>svg]:size-3.5",
        size === "lg" && "h-8 px-3 text-sm [&>svg]:size-4",
        style.badge,
        className,
      )}
    >
      <Icon aria-hidden="true" />
      <span>{style.label}</span>
      <span className="sr-only"> risk</span>
    </span>
  );
}
