import "server-only";
import { withRetry } from "@/lib/utils/retry";
import { logger } from "@/lib/utils/logger";

const BASE = "https://api.jikan.moe/v4";

// Jikan wraps public MyAnimeList data and needs no key, but is aggressively
// rate-limited (~3 req/s, 60/min) and explicitly asks callers not to hammer
// it. This module exists as an optional *supplementary* source — e.g. MAL
// ranking numbers AniList doesn't expose — never as the primary data path.
// A tiny in-process queue keeps us under ~1 req/s regardless of caller count.
let queueTail: Promise<unknown> = Promise.resolve();

function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = queueTail.then(() => fn());
  queueTail = run.catch(() => undefined).then(() => new Promise((r) => setTimeout(r, 1000)));
  return run;
}

async function jikanFetch<T>(path: string, revalidate = 3600): Promise<T | null> {
  try {
    return await throttled(() =>
      withRetry(
        async () => {
          const res = await fetch(`${BASE}${path}`, { next: { revalidate } });
          if (res.status === 429) throw new Error("Jikan rate limited");
          if (!res.ok) throw new Error(`Jikan request failed: ${res.status}`);
          const json = await res.json();
          return json.data as T;
        },
        { attempts: 2, baseDelayMs: 1500 }
      )
    );
  } catch (error) {
    logger.warn("Jikan fetch failed (non-fatal, supplementary source)", {
      path,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export interface JikanRanking {
  malId: number;
  rank: number | null;
  score: number | null;
  scoredBy: number | null;
  members: number | null;
}

export const JikanProvider = {
  configured: true, // no key required, but see rate-limit note above

  async getRankingByMalId(malId: number): Promise<JikanRanking | null> {
    const data = await jikanFetch<{
      mal_id: number;
      rank: number | null;
      score: number | null;
      scored_by: number | null;
      members: number | null;
    }>(`/anime/${malId}`);
    if (!data) return null;
    return {
      malId: data.mal_id,
      rank: data.rank,
      score: data.score,
      scoredBy: data.scored_by,
      members: data.members,
    };
  },
};
