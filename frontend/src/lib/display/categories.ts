import { CircleHelp, ShieldAlert, ShieldCheck, TriangleAlert, type LucideIcon } from "lucide-react";

import type { Category, Strength } from "../../types/api";

interface CategoryStyle {
  label: string;
  icon: LucideIcon;
  badge: string;   // pill colours
  rail: string;    // accent bar on result cards
  bar: string;     // distribution chart segment
  soft: string;    // tinted panel
}

// Every category always pairs colour with a text label and an icon (SRS UI-006).
export const CATEGORY_STYLES: Record<Category, CategoryStyle> = {
  low: {
    label: "Low",
    icon: ShieldCheck,
    badge: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    rail: "bg-emerald-500",
    bar: "bg-emerald-500",
    soft: "bg-emerald-50/60",
  },
  medium: {
    label: "Medium",
    icon: TriangleAlert,
    badge: "bg-amber-50 text-amber-900 ring-amber-200",
    rail: "bg-amber-500",
    bar: "bg-amber-400",
    soft: "bg-amber-50/60",
  },
  high: {
    label: "High",
    icon: ShieldAlert,
    badge: "bg-red-50 text-red-800 ring-red-200",
    rail: "bg-red-500",
    bar: "bg-red-500",
    soft: "bg-red-50/60",
  },
  inconclusive: {
    label: "Inconclusive",
    icon: CircleHelp,
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
    rail: "bg-slate-400",
    bar: "bg-slate-400",
    soft: "bg-slate-50",
  },
};

export const CATEGORY_ORDER: Category[] = ["high", "medium", "inconclusive", "low"];

export const STRENGTH_LEVEL: Record<Strength, number> = { weak: 1, moderate: 2, strong: 3 };

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
