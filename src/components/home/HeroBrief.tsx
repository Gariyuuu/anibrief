import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatTile } from "@/components/home/StatTile";
import { Button } from "@/components/ui/Button";
import type { DailyBriefing } from "@/lib/types/briefing";
import { formatDigestDate } from "@/lib/utils/dates";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Still up?";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function HeroBrief({ briefing }: { briefing: DailyBriefing }) {
  return (
    <Card className="relative overflow-hidden p-5 sm:p-6">
      <div className="halftone pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{formatDigestDate(briefing.date + "T00:00:00Z")}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {greeting()} — Today in Anime
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {briefing.summaryIsAiGenerated && (
              <Badge tone="accent">
                <Sparkles className="mr-1 h-3 w-3" /> AI summary
              </Badge>
            )}
            <Button variant="secondary" size="sm" href="/daily-brief">
              Full Daily Brief
            </Button>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-foreground/90">{briefing.summary}</p>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {briefing.stats.map((stat) => (
            <StatTile key={stat.label} stat={stat} />
          ))}
        </div>
      </div>
    </Card>
  );
}
