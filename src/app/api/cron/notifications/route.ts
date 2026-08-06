import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/lib/db/client";
import { userAlerts, notifications, syncJobs } from "@/lib/db/schema";
import { AniListProvider } from "@/lib/providers/anilist";
import { parseInternalId } from "@/lib/utils/mediaId";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

// This job runs every 30 min (see vercel.json). Only notify once an episode's
// airing time falls into a 60-90 min lookahead window: with a 30 min cadence
// and a 30 min wide window, every episode passes through the window on
// exactly one run, so nothing is missed and nothing double-fires (the DB's
// unique dedupeKey + onConflictDoNothing below is the actual safety net).
const LOOKAHEAD_MIN_MS = 60 * 60 * 1000;
const LOOKAHEAD_MAX_MS = 90 * 60 * 1000;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    logger.warn("CRON_SECRET is not set — /api/cron/notifications is running without auth. Set CRON_SECRET to lock this down.");
    return true;
  }
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: true, note: "No-op: DATABASE_URL isn't configured for this deployment." });
  }

  const database = db();
  const lockKey = `notifications:${new Date().toISOString().slice(0, 13)}`;

  const existingJobs = await database.select().from(syncJobs).where(eq(syncJobs.lockKey, lockKey));
  if (existingJobs.some((job) => job.status === "running" || job.status === "success")) {
    return NextResponse.json({
      ok: true,
      note: "Skipped: a notifications job already ran or is running for this hour.",
      lockKey,
    });
  }

  const jobId = randomUUID();
  await database.insert(syncJobs).values({
    id: jobId,
    jobName: "notifications",
    status: "running",
    lockKey,
  });

  let itemsProcessed = 0;
  let notificationsCreated = 0;
  let errorMessage: string | null = null;

  try {
    const episodeAlerts = await database.select().from(userAlerts).where(eq(userAlerts.type, "new_episode"));
    const now = Date.now();

    for (const alert of episodeAlerts) {
      itemsProcessed += 1;
      try {
        const { source, numericId } = parseInternalId(alert.targetId);
        if (source !== "anilist" || !Number.isFinite(numericId)) continue;

        const media = await AniListProvider.getMediaById(numericId);
        const next = media?.nextAiringEpisode;
        if (!media || !next) continue;

        const diffMs = new Date(next.airingAt).getTime() - now;
        if (diffMs < LOOKAHEAD_MIN_MS || diffMs > LOOKAHEAD_MAX_MS) continue;

        const dedupeKey = `new_episode:${alert.targetId}:${next.episode}`;
        const inserted = await database
          .insert(notifications)
          .values({
            id: randomUUID(),
            clerkUserId: alert.clerkUserId,
            alertId: alert.id,
            title: "New episode airing soon",
            body: `${media.titles.preferred} episode ${next.episode} airs soon.`,
            url: `/anime/${alert.targetId}`,
            dedupeKey,
          })
          .onConflictDoNothing()
          .returning({ id: notifications.id });

        if (inserted.length > 0) notificationsCreated += 1;
      } catch (innerError) {
        logger.error("notifications cron: failed processing one alert", {
          alertId: alert.id,
          targetId: alert.targetId,
          error: innerError instanceof Error ? innerError.message : String(innerError),
        });
      }
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("notifications cron run failed", { error: errorMessage });
  }

  await database
    .update(syncJobs)
    .set({
      status: errorMessage ? "failed" : "success",
      finishedAt: new Date(),
      itemsProcessed,
      errorMessage,
    })
    .where(eq(syncJobs.id, jobId));

  return NextResponse.json({ ok: !errorMessage, itemsProcessed, notificationsCreated, errorMessage, lockKey });
}
