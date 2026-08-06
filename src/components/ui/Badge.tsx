import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

type BadgeTone = "neutral" | "accent" | "positive" | "negative";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-border/60 text-foreground",
  accent: "bg-accent/15 text-accent",
  positive: "bg-positive/15 text-positive",
  negative: "bg-negative/15 text-negative",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tracking-wide", toneClasses[tone], className)}
      {...props}
    />
  );
}
