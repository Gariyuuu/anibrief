import type { NextRequest } from "next/server";
import { AniListProvider } from "@/lib/providers/anilist";
import { currentSeason } from "@/lib/utils/season";
import { runCronJob } from "@/lib/cron/runCronJob";

// Cache-warming only: pre-fetches the current season's chart so it's warm
// ahead of user traffic. Vercel Cron: every 6 hours (see vercel.json).
export async function GET(request: NextRequest) {
  return runCronJob(request, "refresh-seasonal", "hour", async () => {
    const { season, year } = currentSeason();
    const result = await AniListProvider.browse({
      season,
      seasonYear: year,
      sort: ["POPULARITY_DESC"],
      perPage: 50,
    });
    return result.items.length;
  });
}
