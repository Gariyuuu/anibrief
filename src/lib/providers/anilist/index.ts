import "server-only";
import { anilistFetch } from "@/lib/providers/anilist/client";
import {
  AIRING_SCHEDULE_QUERY,
  BROWSE_MEDIA_QUERY,
  CHARACTER_BIRTHDAYS_QUERY,
  CHARACTER_BY_ID_QUERY,
  MEDIA_BY_ID_QUERY,
  POPULAR_CHARACTERS_QUERY,
  POPULAR_STAFF_QUERY,
  SEARCH_CHARACTERS_QUERY,
  SEARCH_MEDIA_QUERY,
  SEARCH_STAFF_QUERY,
  STAFF_BIRTHDAYS_QUERY,
  STAFF_BY_ID_QUERY,
  STUDIO_SEARCH_QUERY,
} from "@/lib/providers/anilist/queries";
import {
  mapCharacter,
  mapCharacterBirthday,
  mapMedia,
  mapStaff,
  type CharacterBirthday,
} from "@/lib/providers/anilist/mappers";
import type { RawAiringScheduleNode, RawCharacter, RawMedia, RawStaff, RawStudio } from "@/lib/providers/anilist/rawTypes";
import type { AiringEntry, AiringSeason, MediaFormat, NormalizedMedia } from "@/lib/types/media";
import type { NormalizedPerson } from "@/lib/types/person";
import type { NormalizedCharacter } from "@/lib/types/character";
import { logger } from "@/lib/utils/logger";

type MediaType = "ANIME" | "MANGA";
export type MediaSort =
  | "TRENDING_DESC"
  | "POPULARITY_DESC"
  | "SCORE_DESC"
  | "START_DATE_DESC"
  | "FAVOURITES_DESC";

// Per-lambda-instance last-good-result cache (same "not shared across concurrent
// instances" caveat as client.ts's rate-limit cooldown — still meaningfully cuts
// how often a warm instance shows an empty section during an AniList outage). Only
// worth it for high-traffic, call-site-stable queries like `browse` (a handful of
// season/year/sort/format combos, hit constantly) — not wired into every `safe()`
// caller, since most (searchMedia, getMediaById, ...) have effectively unbounded
// cache keys where this would just leak memory for no real hit-rate benefit.
const lastGood = new Map<string, { data: unknown; ts: number }>();
const LAST_GOOD_MAX_AGE_MS = 30 * 60_000;

async function safe<T>(fn: () => Promise<T>, fallback: T, label: string, cacheKey?: string): Promise<T> {
  try {
    const result = await fn();
    if (cacheKey) lastGood.set(cacheKey, { data: result, ts: Date.now() });
    return result;
  } catch (error) {
    logger.error(`AniListProvider.${label} failed`, {
      error: error instanceof Error ? error.message : String(error),
    });
    if (cacheKey) {
      const cached = lastGood.get(cacheKey);
      if (cached && Date.now() - cached.ts < LAST_GOOD_MAX_AGE_MS) {
        return cached.data as T;
      }
    }
    return fallback;
  }
}

export const AniListProvider = {
  async searchMedia(
    search: string,
    type: MediaType = "ANIME",
    { page = 1, perPage = 20 }: { page?: number; perPage?: number } = {}
  ): Promise<{ items: NormalizedMedia[]; hasNextPage: boolean; total: number }> {
    return safe(
      async () => {
        const data = await anilistFetch<{
          Page: { pageInfo: { hasNextPage: boolean; total: number }; media: RawMedia[] };
        }>(SEARCH_MEDIA_QUERY, { search, type, page, perPage }, { revalidate: 86400 });
        return {
          items: data.Page.media.map(mapMedia),
          hasNextPage: data.Page.pageInfo.hasNextPage,
          total: data.Page.pageInfo.total,
        };
      },
      { items: [], hasNextPage: false, total: 0 },
      "searchMedia"
    );
  },

  async getMediaById(id: number): Promise<NormalizedMedia | null> {
    return safe(
      async () => {
        const data = await anilistFetch<{ Media: RawMedia | null }>(
          MEDIA_BY_ID_QUERY,
          { id },
          { revalidate: 86400 }
        );
        return data.Media ? mapMedia(data.Media) : null;
      },
      null,
      "getMediaById"
    );
  },

  async getMediaDetailRaw(id: number): Promise<RawMedia | null> {
    return safe(
      async () => {
        const data = await anilistFetch<{ Media: RawMedia | null }>(
          MEDIA_BY_ID_QUERY,
          { id },
          { revalidate: 86400 }
        );
        return data.Media;
      },
      null,
      "getMediaDetailRaw"
    );
  },

  async browse(params: {
    type?: MediaType;
    season?: AiringSeason;
    seasonYear?: number;
    sort?: MediaSort[];
    genres?: string[];
    /** AniList tag names (verified against `MediaTagCollection`, e.g. "Iyashikei", "Detective") — distinct from genres. */
    tags?: string[];
    formats?: MediaFormat[];
    status?: string;
    page?: number;
    perPage?: number;
    /** FuzzyDateInt lower bound, format YYYYMMDD (e.g. 20200101), for decade/era filtering. */
    startDateGreater?: number;
    /** FuzzyDateInt upper bound, format YYYYMMDD. */
    startDateLesser?: number;
    /** Strict "fewer than N episodes" filter (AniList's real `episodes_lesser` arg). */
    episodesLesser?: number;
  }): Promise<{ items: NormalizedMedia[]; hasNextPage: boolean; total: number }> {
    const {
      type = "ANIME",
      season,
      seasonYear,
      sort = ["POPULARITY_DESC"],
      genres,
      tags,
      formats,
      status,
      page = 1,
      perPage = 24,
      startDateGreater,
      startDateLesser,
      episodesLesser,
    } = params;

    return safe(
      async () => {
        const data = await anilistFetch<{
          Page: { pageInfo: { hasNextPage: boolean; total: number }; media: RawMedia[] };
        }>(
          BROWSE_MEDIA_QUERY,
          {
            type,
            season,
            seasonYear,
            sort,
            genre_in: genres,
            tag_in: tags,
            format_in: formats,
            status,
            page,
            perPage,
            startDate_greater: startDateGreater,
            startDate_lesser: startDateLesser,
            episodes_lesser: episodesLesser,
          },
          { revalidate: 86400 }
        );
        return {
          items: data.Page.media.map(mapMedia),
          hasNextPage: data.Page.pageInfo.hasNextPage,
          total: data.Page.pageInfo.total,
        };
      },
      { items: [], hasNextPage: false, total: 0 },
      "browse",
      JSON.stringify({ type, season, seasonYear, sort, genres, tags, formats, status, page, perPage, startDateGreater, startDateLesser, episodesLesser })
    );
  },

  /**
   * Real AniList `Studio(search: String)` lookup (verified live via schema
   * introspection — see STUDIO_SEARCH_QUERY's comment). Returns the single
   * best-match studio AniList resolves for the search string, plus its
   * media. Filters the connection down to anime, since a "studio" here
   * means an animation studio, not a manga publisher.
   */
  async searchStudio(
    search: string,
    { page = 1, perPage = 24 }: { page?: number; perPage?: number } = {}
  ): Promise<{
    studio: { id: number; name: string; sourceUrl: string } | null;
    items: NormalizedMedia[];
    hasNextPage: boolean;
    total: number;
  }> {
    return safe(
      async () => {
        const data = await anilistFetch<{ Studio: RawStudio | null }>(
          STUDIO_SEARCH_QUERY,
          { search, page, perPage },
          { revalidate: 86400 }
        );
        if (!data.Studio) return { studio: null, items: [], hasNextPage: false, total: 0 };
        return {
          studio: { id: data.Studio.id, name: data.Studio.name, sourceUrl: data.Studio.siteUrl },
          items: data.Studio.media.nodes.filter((n) => n.type === "ANIME").map(mapMedia),
          hasNextPage: data.Studio.media.pageInfo.hasNextPage,
          total: data.Studio.media.pageInfo.total,
        };
      },
      { studio: null, items: [], hasNextPage: false, total: 0 },
      "searchStudio"
    );
  },

  async getAiringBetween(startSec: number, endSec: number, perPage = 50): Promise<AiringEntry[]> {
    return safe(
      async () => {
        const data = await anilistFetch<{
          Page: { pageInfo: { hasNextPage: boolean }; airingSchedules: RawAiringScheduleNode[] };
        }>(
          AIRING_SCHEDULE_QUERY,
          { airingAtGreater: startSec, airingAtLesser: endSec, page: 1, perPage },
          { revalidate: 86400 }
        );
        return data.Page.airingSchedules.map((node) => ({
          mediaId: `anilist:${node.media.id}`,
          anime: mapMedia(node.media),
          episode: node.episode,
          airingAt: new Date(node.airingAt * 1000).toISOString(),
        }));
      },
      [],
      "getAiringBetween"
    );
  },

  async getStaffBirthdaysToday(): Promise<NormalizedPerson[]> {
    return safe(
      async () => {
        const data = await anilistFetch<{ Page: { staff: RawStaff[] } }>(
          STAFF_BIRTHDAYS_QUERY,
          { page: 1, perPage: 25 },
          { revalidate: 86400 }
        );
        return data.Page.staff.map(mapStaff);
      },
      [],
      "getStaffBirthdaysToday"
    );
  },

  async getCharacterBirthdaysToday(): Promise<CharacterBirthday[]> {
    return safe(
      async () => {
        const data = await anilistFetch<{ Page: { characters: RawCharacter[] } }>(
          CHARACTER_BIRTHDAYS_QUERY,
          { page: 1, perPage: 25 },
          { revalidate: 86400 }
        );
        return data.Page.characters.map(mapCharacterBirthday);
      },
      [],
      "getCharacterBirthdaysToday"
    );
  },

  async getStaffById(id: number): Promise<{ person: NormalizedPerson; raw: RawStaff } | null> {
    return safe(
      async () => {
        const data = await anilistFetch<{ Staff: RawStaff | null }>(STAFF_BY_ID_QUERY, { id }, { revalidate: 86400 });
        return data.Staff ? { person: mapStaff(data.Staff), raw: data.Staff } : null;
      },
      null,
      "getStaffById"
    );
  },

  async searchStaff(
    search: string,
    { page = 1, perPage = 20 }: { page?: number; perPage?: number } = {}
  ): Promise<{ items: NormalizedPerson[]; hasNextPage: boolean; total: number }> {
    return safe(
      async () => {
        const data = await anilistFetch<{
          Page: { pageInfo: { hasNextPage: boolean; total: number }; staff: RawStaff[] };
        }>(SEARCH_STAFF_QUERY, { search, page, perPage }, { revalidate: 86400 });
        return {
          items: data.Page.staff.map(mapStaff),
          hasNextPage: data.Page.pageInfo.hasNextPage,
          total: data.Page.pageInfo.total,
        };
      },
      { items: [], hasNextPage: false, total: 0 },
      "searchStaff"
    );
  },

  /**
   * The most-favorited staff on AniList, paged by favourites. Also used as
   * the honestly-scoped source pool for "upcoming birthdays" (call with a
   * large perPage and ignore pagination) — see POPULAR_STAFF_QUERY's comment
   * for why upcoming birthdays can't be a real date-range query.
   */
  async getPopularStaff(
    { page = 1, perPage = 100 }: { page?: number; perPage?: number } = {}
  ): Promise<{ items: NormalizedPerson[]; hasNextPage: boolean; total: number }> {
    return safe(
      async () => {
        const data = await anilistFetch<{
          Page: { pageInfo: { hasNextPage: boolean; total: number }; staff: RawStaff[] };
        }>(POPULAR_STAFF_QUERY, { page, perPage }, { revalidate: 86400 });
        return {
          items: data.Page.staff.map(mapStaff),
          hasNextPage: data.Page.pageInfo.hasNextPage,
          total: data.Page.pageInfo.total,
        };
      },
      { items: [], hasNextPage: false, total: 0 },
      "getPopularStaff"
    );
  },

  async searchCharacters(
    search: string,
    { page = 1, perPage = 24 }: { page?: number; perPage?: number } = {}
  ): Promise<{ items: NormalizedCharacter[]; hasNextPage: boolean; total: number }> {
    return safe(
      async () => {
        const data = await anilistFetch<{
          Page: { pageInfo: { hasNextPage: boolean; total: number }; characters: RawCharacter[] };
        }>(SEARCH_CHARACTERS_QUERY, { search, page, perPage }, { revalidate: 86400 });
        return {
          items: data.Page.characters.map(mapCharacter),
          hasNextPage: data.Page.pageInfo.hasNextPage,
          total: data.Page.pageInfo.total,
        };
      },
      { items: [], hasNextPage: false, total: 0 },
      "searchCharacters"
    );
  },

  /** The most-favorited characters on AniList, paged by favourites — default "browse all" pool for the Characters directory tab. */
  async getPopularCharacters(
    { page = 1, perPage = 24 }: { page?: number; perPage?: number } = {}
  ): Promise<{ items: NormalizedCharacter[]; hasNextPage: boolean; total: number }> {
    return safe(
      async () => {
        const data = await anilistFetch<{
          Page: { pageInfo: { hasNextPage: boolean; total: number }; characters: RawCharacter[] };
        }>(POPULAR_CHARACTERS_QUERY, { page, perPage }, { revalidate: 86400 });
        return {
          items: data.Page.characters.map(mapCharacter),
          hasNextPage: data.Page.pageInfo.hasNextPage,
          total: data.Page.pageInfo.total,
        };
      },
      { items: [], hasNextPage: false, total: 0 },
      "getPopularCharacters"
    );
  },

  async getCharacterById(id: number): Promise<{ character: NormalizedCharacter; raw: RawCharacter } | null> {
    return safe(
      async () => {
        const data = await anilistFetch<{ Character: RawCharacter | null }>(
          CHARACTER_BY_ID_QUERY,
          { id },
          { revalidate: 86400 }
        );
        return data.Character ? { character: mapCharacter(data.Character), raw: data.Character } : null;
      },
      null,
      "getCharacterById"
    );
  },
};
