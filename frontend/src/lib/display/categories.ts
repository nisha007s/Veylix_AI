import { CircleHelp, ShieldAlert, ShieldCheck, TriangleAlert, type LucideIcon } from "lucide-react";

import type { Category, Strength } from "../../types/api";

interface CategoryStyle {
  label: string;
  headline: string; // e.g. "High risk"
  icon: LucideIcon;
  badge: string;    // pill
  dot: string;      // solid colour (bars, dots, rails)
  text: string;     // coloured text
  soft: string;     // tinted background
  line: string;     // tinted border
  glow: string;     // emblem glow
}

// Every category always pairs colour with a text label and an icon (SRS UI-006).
// Colours come from theme tokens, so both Light and Dark modes are covered.
export const CATEGORY_STYLES: Record<Category, CategoryStyle> = {
  low: {
    label: "Low",
    headline: "Low risk",
    icon: ShieldCheck,
    badge: "bg-risk-low-soft text-risk-low-text ring-risk-low-line",
    dot: "bg-risk-low",
    text: "text-risk-low-text",
    soft: "bg-risk-low-soft",
    line: "border-risk-low-line",
    glow: "shadow-[0_0_0_6px_var(--risk-low-soft),0_12px_32px_-8px_var(--risk-low-line)]",
  },
  medium: {
    label: "Medium",
    headline: "Medium risk",
    icon: TriangleAlert,
    badge: "bg-risk-medium-soft text-risk-medium-text ring-risk-medium-line",
    dot: "bg-risk-medium",
    text: "text-risk-medium-text",
    soft: "bg-risk-medium-soft",
    line: "border-risk-medium-line",
    glow: "shadow-[0_0_0_6px_var(--risk-medium-soft),0_12px_32px_-8px_var(--risk-medium-line)]",
  },
  high: {
    label: "High",
    headline: "High risk",
    icon: ShieldAlert,
    badge: "bg-risk-high-soft text-risk-high-text ring-risk-high-line",
    dot: "bg-risk-high",
    text: "text-risk-high-text",
    soft: "bg-risk-high-soft",
    line: "border-risk-high-line",
    glow: "shadow-[0_0_0_6px_var(--risk-high-soft),0_12px_32px_-8px_var(--risk-high-line)]",
  },
  inconclusive: {
    label: "Inconclusive",
    headline: "Inconclusive",
    icon: CircleHelp,
    badge: "bg-risk-inconclusive-soft text-risk-inconclusive-text ring-risk-inconclusive-line",
    dot: "bg-risk-inconclusive",
    text: "text-risk-inconclusive-text",
    soft: "bg-risk-inconclusive-soft",
    line: "border-risk-inconclusive-line",
    glow: "shadow-[0_0_0_6px_var(--risk-inconclusive-soft),0_12px_32px_-8px_var(--risk-inconclusive-line)]",
  },
};

export const CATEGORY_ORDER: Category[] = ["high", "medium", "inconclusive", "low"];

export const STRENGTH_LEVEL: Record<Strength, number> = { weak: 1, moderate: 2, strong: 3 };

export const STRENGTH_ORDER: Strength[] = ["strong", "moderate", "weak"];

// Plain-language text for backend codes.
export const NOTICE_TEXT: Record<string, string> = {
  not_saved: "This result is not saved. It is kept only in this browser tab until you close or refresh it.",
  query_string_hidden: "The part after “?” (query string) is hidden, as it can contain private tokens.",
  userinfo_hidden: "Login details written before “@” are hidden.",
  shortener_destination_unknown: "This is a shortened link. Its final destination is unknown because Veylix never opens links.",
};

export const NORMALIZATION_TEXT: Record<string, string> = {
  scheme_added: "No scheme was given, so “http://” was assumed for analysis.",
  defang_reversed: "Defanged notation (such as hxxp or [.]) was converted back for analysis.",
  html_converted: "HTML was converted to plain text. It was never displayed as a web page.",
};
