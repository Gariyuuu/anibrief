import "server-only";
import { withRetry } from "@/lib/utils/retry";
import { logger } from "@/lib/utils/logger";

const ENDPOINT = "https://graphql.anilist.co";
const RATE_LIMIT_COOLDOWN_MS = 60_000;

export class AniListError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "AniListError";
  }
}

// AniList's public GraphQL endpoint shares one modest budget (~30 req/min)
// across every concurrent render. Retrying a 429 only spends more of an
// already-exhausted budget and prolongs the outage for everyone else, and a
// failed render never gets cached — so the next request for that same page
// repeats the whole storm. A 429 here trips a short, process-wide cooldown
// (skip calling AniList entirely, fail fast) instead of being retried like a
// transient network error; see ANIBRIEF_VERCEL_COST_AUDIT.md for the
// incident this was written to stop.
let rateLimitedUntil = 0;

export async function anilistFetch<TData, TVars extends Record<string, unknown> = Record<string, unknown>>(
  query: string,
  variables: TVars,
  { revalidate = 600 }: { revalidate?: number } = {}
): Promise<TData> {
  if (Date.now() < rateLimitedUntil) {
    throw new AniListError("AniList rate limit cooldown active", 429);
  }

  return withRetry(
    async () => {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query, variables }),
        next: { revalidate },
      });

      if (res.status === 429) {
        rateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
        throw new AniListError("AniList rate limit hit", 429);
      }
      if (!res.ok) {
        throw new AniListError(`AniList request failed: ${res.status} ${res.statusText}`, res.status);
      }

      const json = await res.json();
      if (json.errors) {
        throw new AniListError(json.errors.map((e: { message: string }) => e.message).join("; "));
      }
      return json.data as TData;
    },
    { attempts: 3, baseDelayMs: 800, shouldRetry: (error) => !(error instanceof AniListError && error.status === 429) }
  ).catch((error) => {
    logger.error("AniList fetch failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  });
}
