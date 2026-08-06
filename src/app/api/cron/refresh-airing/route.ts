import type { NextRequest } from "next/server";
import { AniListProvider } from "@/lib/providers/anilist";
import { runCronJob } from "@/lib/cron/runCronJob";

// Cache-warming only: this repo relies on Next's fetch `revalidate` cache
// rather than a separate cached table, so this route's value is pre-warming
// AniList's airing-schedule cache for roughly the next 48h before user
// traffic hits it. Vercel Cron: every 20 minutes (see vercel.json).
export async function GET(request: NextRequest) {
  return runCronJob(request, "refresh-airing", "hour", async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const in48hSec = nowSec + 48 * 60 * 60;
    const entries = await AniListProvider.getAiringBetween(nowSec, in48hSec, 50);
    return entries.length;
  });
}
