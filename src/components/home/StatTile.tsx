import { Card } from "@/components/ui/Card";
import type { BriefingStat } from "@/lib/types/briefing";

export function StatTile({ stat }: { stat: BriefingStat }) {
  return (
    <Card className="p-3 text-center">
      <p className="text-2xl font-semibold tabular-nums text-foreground">{stat.value}</p>
      <p className="mt-0.5 text-xs text-muted">{stat.label}</p>
    </Card>
  );
}
