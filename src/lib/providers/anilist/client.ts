import "server-only";
import { withRetry } from "@/lib/utils/retry";
import { logger } from "@/lib/utils/logger";

const ENDPOINT = "https://graphql.anilist.co";

export class AniListError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "AniListError";
  }
}

/**
 * AniList's GraphQL endpoint requires no API key for public queries.
 * Rate limit is modest (~30 req/min) — every call runs through Next's
 * fetch cache (`revalidate`) so repeated page loads don't re-hit it.
 */
export async function anilistFetch<TData, TVars extends Record<string, unknown> = Record<string, unknown>>(
  query: string,
  variables: TVars,
  { revalidate = 600 }: { revalidate?: number } = {}
): Promise<TData> {
  return withRetry(
    async () => {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query, variables }),
        next: { revalidate },
      });

      if (res.status === 429) {
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
    { attempts: 3, baseDelayMs: 800 }
  ).catch((error) => {
    logger.error("AniList fetch failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  });
}
