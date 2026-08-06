import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db, isDatabaseConfigured } from "@/lib/db/client";
import { syncJobs } from "@/lib/db/schema";
import { logger } from "@/lib/utils/logger";

/**
 * Shared wrapper for every `/api/cron/*` route (spec §25). Handles:
 * - `CRON_SECRET` bearer-token auth (401 if set and mismatched; warns and
 *   proceeds if unset, since some deployments run without it configured yet).
 * - Idempotency: each invocation is bucketed into an hour or day lock key
 *   (`<jobName>:<YYYY-MM-DDTHH>` or `<jobName>:<YYYY-MM-DD>`); a job already
 *   "running" or "success" for that bucket is skipped rather than re-run.
 * - A `syncJobs` row per attempt (status/duration/itemsProcessed/errorMessage),
 *   skipped gracefully when `DATABASE_URL` isn't set.
 * - Errors are caught and recorded as `status: "failed"` but the route still
 *   returns HTTP 200 (with the error in the body) so Vercel Cron doesn't
 *   treat a partial failure as needing infinite retries.
 */
function checkCronAuth(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    logger.warn("CRON_SECRET is not set; cron route is running without authentication");
    return true;
  }
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function lockKeyFor(jobName: string, bucket: "hour" | "day"): string {
  const iso = new Date().toISOString();
  const bucketPart = bucket === "hour" ? iso.slice(0, 13) : iso.slice(0, 10); // YYYY-MM-DDTHH | YYYY-MM-DD
  return `${jobName}:${bucketPart}`;
}

export async function runCronJob(
  request: NextRequest,
  jobName: string,
  bucket: "hour" | "day",
  work: () => Promise<number>
): Promise<NextResponse> {
  if (!checkCronAuth(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const lockKey = lockKeyFor(jobName, bucket);

  if (!isDatabaseConfigured()) {
    // No DB to record a syncJobs row or check the lock against — still run
    // the work itself so Next's fetch cache gets warmed ahead of traffic.
    try {
      const itemsProcessed = await work();
      return NextResponse.json({
        ok: true,
        jobName,
        itemsProcessed,
        note: "DATABASE_URL not set; sync job not recorded",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`${jobName} failed`, { error: message });
      return NextResponse.json({ ok: false, jobName, error: message });
    }
  }

  const database = db();

  const [existing] = await database.select().from(syncJobs).where(eq(syncJobs.lockKey, lockKey)).limit(1);
  if (existing && (existing.status === "running" || existing.status === "success")) {
    return NextResponse.json({ ok: true, jobName, skipped: true, reason: `already ${existing.status} for ${lockKey}` });
  }

  const id = randomUUID();
  await database.insert(syncJobs).values({ id, jobName, status: "running", lockKey });

  try {
    const itemsProcessed = await work();
    await database
      .update(syncJobs)
      .set({ status: "success", finishedAt: new Date(), itemsProcessed })
      .where(eq(syncJobs.id, id));
    return NextResponse.json({ ok: true, jobName, itemsProcessed });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`${jobName} failed`, { error: message });
    await database
      .update(syncJobs)
      .set({ status: "failed", finishedAt: new Date(), errorMessage: message })
      .where(eq(syncJobs.id, id));
    return NextResponse.json({ ok: false, jobName, error: message }, { status: 200 });
  }
}
