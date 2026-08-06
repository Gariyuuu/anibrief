import type { NextRequest } from "next/server";
import { AniListProvider } from "@/lib/providers/anilist";
import { runCronJob } from "@/lib/cron/runCronJob";

// Cache-warming only: the Home/Daily-Brief pages already call these live;
// this route just pre-warms the cache ahead of traffic and logs the counts
// found via the syncJobs row's itemsProcessed. Vercel Cron: daily (see vercel.json).
export async function GET(request: NextRequest) {
  return runCronJob(request, "birthdays", "day", async () => {
    const [staff, characters] = await Promise.all([
      AniListProvider.getStaffBirthdaysToday(),
      AniListProvider.getCharacterBirthdaysToday(),
    ]);
    return staff.length + characters.length;
  });
}
