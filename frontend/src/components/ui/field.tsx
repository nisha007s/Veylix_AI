import type { InputHTMLAttributes, LabelHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

const fieldBase =
  "w-full rounded-xl border border-line-strong bg-surface text-[15px] text-ink " +
  "placeholder:text-ink-muted/70 shadow-[inset_0_1px_2px_rgba(15,27,51,0.04)] " +
  "transition-[border-color,box-shadow] duration-150 " +
  "focus-visible:border-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/12 " +
  "aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-red-100 disabled:opacity-60";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, "h-12 px-4", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "min-h-56 resize-y px-4 py-3 leading-relaxed", className)} {...props} />;
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-ink", className)} {...props} />;
}
