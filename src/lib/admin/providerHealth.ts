import "server-only";
import { AniListProvider } from "@/lib/providers/anilist";
import { JikanProvider } from "@/lib/providers/jikan";
import { MyAnimeListProvider } from "@/lib/providers/mal";
import { NewsFeedProvider } from "@/lib/providers/news";
import { YouTubeProvider } from "@/lib/providers/youtube";
import { MusicProvider } from "@/lib/providers/music";

export type ProviderStatus = "healthy" | "not_configured" | "error";

export interface ProviderHealthEntry {
  name: string;
  status: ProviderStatus;
  note: string;
}

/**
 * Live provider-health check for the admin dashboard. Reads each provider's
 * own `.configured` flag rather than a stored/stale `provider_health` table
 * row, except for AniList, which needs no key and so gets an actual cheap
 * live call instead (a "configured" flag would always read true and tell us
 * nothing about whether the API is actually reachable right now).
 */
export async function getProviderHealth(): Promise<ProviderHealthEntry[]> {
  const entries: ProviderHealthEntry[] = [];

  try {
    const result = await AniListProvider.browse({ perPage: 1 });
    entries.push({
      name: "AniList",
      status: result.items.length > 0 ? "healthy" : "error",
      note:
        result.items.length > 0
          ? "Live GraphQL request returned data just now."
          : "Live GraphQL request returned zero items — likely a fetch failure (AniListProvider swallows errors and returns an empty page).",
    });
  } catch (error) {
    entries.push({
      name: "AniList",
      status: "error",
      note: `Live GraphQL request threw: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  entries.push({
    name: "Jikan (MyAnimeList data, unofficial)",
    status: JikanProvider.configured ? "healthy" : "not_configured",
    note: "No key required. Used only as a supplementary source, self-throttled to ~1 req/s per Jikan's public rate limit.",
  });

  entries.push({
    name: "MyAnimeList (official API)",
    status: MyAnimeListProvider.configured ? "healthy" : "not_configured",
    note: MyAnimeListProvider.configured
      ? "MAL_CLIENT_ID is set, but this provider's methods are still unimplemented stubs."
      : "MAL_CLIENT_ID not set.",
  });

  entries.push({
    name: "News (Google News RSS)",
    status: NewsFeedProvider.configured ? "healthy" : "not_configured",
    note: "No key required — public RSS search.",
  });

  entries.push({
    name: "YouTube",
    status: YouTubeProvider.configured ? "healthy" : "not_configured",
    note: YouTubeProvider.configured
      ? "YOUTUBE_API_KEY is set."
      : "YOUTUBE_API_KEY not set — trailer/PV search returns an empty list.",
  });

  entries.push({
    name: "Music",
    status: MusicProvider.configured ? "healthy" : "not_configured",
    note: "No Spotify/MusicBrainz credential configured — serving a small hand-curated reference set of real, publicly documented OP/ED credits.",
  });

  entries.push({
    name: "Streaming availability",
    status: "healthy",
    note: "Derived from AniList's own externalLinks field — no separate credential or provider needed.",
  });

  return entries;
}
