import { AlertTriangle, Settings2 } from "lucide-react";
import { Card } from "@/components/ui/Card";

/** Distinguishes "a source isn't configured" from "a live request failed" (inspired by daily-brief's Section<T> pattern). */
export function ErrorState({ reason, message }: { reason: "not_configured" | "fetch_failed"; message: string }) {
  const Icon = reason === "not_configured" ? Settings2 : AlertTriangle;
  return (
    <Card className="flex items-start gap-3 p-4 text-sm text-muted">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </Card>
  );
}
