import type { NextRequest } from "next/server";
import { buildDailyBriefing } from "@/lib/briefing/buildBriefing";
import { saveBriefing } from "@/lib/briefing/store";
import { runCronJob } from "@/lib/cron/runCronJob";

// Builds and saves today's briefing so it's warm before the first user opens
// /daily-brief. Vercel Cron: daily at 13:00 UTC (see vercel.json).
export async function GET(request: NextRequest) {
  return runCronJob(request, "daily-brief", "day", async () => {
    const briefing = await buildDailyBriefing();
    await saveBriefing(briefing);
    return briefing.sections.reduce((sum, section) => sum + section.items.length, 0);
  });
}
