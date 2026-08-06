import "server-only";
import { buildDailyBriefing } from "@/lib/briefing/buildBriefing";
import { getBriefing, isStale, saveBriefing } from "@/lib/briefing/store";

/** Shared by Home and Daily Brief so both pages agree on one generated-per-day briefing, rebuilt when stale (mirrors daily-brief's isStale() pattern). */
export async function getTodaysBriefing() {
  const date = new Date().toISOString().slice(0, 10);
  const existing = await getBriefing(date);
  if (existing && !isStale(existing)) return existing;

  const fresh = await buildDailyBriefing(date);
  await saveBriefing(fresh);
  return fresh;
}
