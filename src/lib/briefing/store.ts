import "server-only";
import { eq, desc } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/lib/db/client";
import { briefings } from "@/lib/db/schema";
import type { DailyBriefing } from "@/lib/types/briefing";

// Persists each day's briefing so /daily-brief/archive survives across
// deploys, mirroring daily-brief's store.ts pattern — but against Neon via
// Drizzle instead of Upstash Redis, since this app only uses one database.
// Falls back to an in-process Map (ephemeral, per-instance) when
// DATABASE_URL isn't set, so the app still runs with zero DB configured.
const memoryStore = new Map<string, DailyBriefing>();

export const archiveIsPersistent = isDatabaseConfigured();

export async function saveBriefing(briefing: DailyBriefing): Promise<void> {
  if (!isDatabaseConfigured()) {
    memoryStore.set(briefing.date, briefing);
    return;
  }
  await db()
    .insert(briefings)
    .values({
      date: briefing.date,
      generatedAt: new Date(briefing.generatedAt),
      summary: briefing.summary,
      summaryIsAiGenerated: String(briefing.summaryIsAiGenerated),
      stats: briefing.stats,
      sections: briefing.sections,
    })
    .onConflictDoUpdate({
      target: briefings.date,
      set: {
        generatedAt: new Date(briefing.generatedAt),
        summary: briefing.summary,
        summaryIsAiGenerated: String(briefing.summaryIsAiGenerated),
        stats: briefing.stats,
        sections: briefing.sections,
      },
    });
}

export async function getBriefing(date: string): Promise<DailyBriefing | null> {
  if (!isDatabaseConfigured()) {
    return memoryStore.get(date) ?? null;
  }
  const [row] = await db().select().from(briefings).where(eq(briefings.date, date)).limit(1);
  if (!row) return null;
  return {
    date: row.date,
    generatedAt: row.generatedAt.toISOString(),
    summary: row.summary,
    summaryIsAiGenerated: row.summaryIsAiGenerated === "true",
    stats: row.stats as DailyBriefing["stats"],
    sections: row.sections as DailyBriefing["sections"],
  };
}

export async function listBriefingDates(limit = 30): Promise<string[]> {
  if (!isDatabaseConfigured()) {
    return Array.from(memoryStore.keys()).sort().reverse().slice(0, limit);
  }
  const rows = await db().select({ date: briefings.date }).from(briefings).orderBy(desc(briefings.date)).limit(limit);
  return rows.map((r) => r.date);
}

const STALE_MS = 20 * 60 * 1000; // 20 minutes

export function isStale(briefing: DailyBriefing): boolean {
  return Date.now() - new Date(briefing.generatedAt).getTime() > STALE_MS;
}
