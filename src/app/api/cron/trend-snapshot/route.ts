import type { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { AniListProvider } from "@/lib/providers/anilist";
import { db, isDatabaseConfigured } from "@/lib/db/client";
import { trendSnapshots } from "@/lib/db/schema";
import { runCronJob } from "@/lib/cron/runCronJob";

// Genuine data collection (not just cache-warming): records a real,
// unmodified snapshot of AniList's current trending chart into
// `trend_snapshots` for a future trend-delta feature. Nothing computed here
// is displayed anywhere yet — there isn't enough historical data to show a
// trend honestly, so this route only collects it. Vercel Cron: every 6
// hours (see vercel.json).
export async function GET(request: NextRequest) {
  return runCronJob(request, "trend-snapshot", "hour", async () => {
    const { items } = await AniListProvider.browse({ sort: ["TRENDING_DESC"], perPage: 50 });
    if (!isDatabaseConfigured() || items.length === 0) return items.length;

    const capturedAt = new Date();
    await db()
      .insert(trendSnapshots)
      .values(
        items.map((item) => ({
          id: randomUUID(),
          mediaId: item.id,
          window: "24h" as const,
          popularity: item.popularity,
          averageScore: item.averageScore,
          favourites: item.favourites,
          capturedAt,
        }))
      );
    return items.length;
  });
}
