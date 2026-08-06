import type { AiringSeason, MediaFormat, MediaStatus, NormalizedMedia } from "@/lib/types/media";
import type { NormalizedPerson } from "@/lib/types/person";
import type { RawCharacter, RawFuzzyDate, RawMedia, RawStaff } from "@/lib/providers/anilist/rawTypes";

function fuzzyDateToIso(date: RawFuzzyDate): string | null {
  if (!date.year || !date.month || !date.day) return null;
  const mm = String(date.month).padStart(2, "0");
  const dd = String(date.day).padStart(2, "0");
  return `${date.year}-${mm}-${dd}`;
}

function preferredTitle(title: RawMedia["title"]): string {
  return title.english ?? title.romaji ?? title.native ?? "Untitled";
}

function broadcastDayFromAiringAt(airingAt: number | undefined): string | null {
  if (!airingAt) return null;
  return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "Asia/Tokyo" }).format(
    new Date(airingAt * 1000)
  );
}

export function mapMedia(raw: RawMedia): NormalizedMedia {
  const kind = raw.type === "ANIME" ? "anime" : "manga";

  return {
    id: `anilist:${raw.id}`,
    kind,
    source: "anilist",
    sourceId: String(raw.id),
    sourceUrl: raw.siteUrl,
    externalIds: [
      { source: "anilist", sourceId: String(raw.id), sourceUrl: raw.siteUrl },
      ...(raw.idMal
        ? [
            {
              source: "myanimelist" as const,
              sourceId: String(raw.idMal),
              sourceUrl: `https://myanimelist.net/${kind}/${raw.idMal}`,
            },
          ]
        : []),
    ],
    titles: {
      romaji: raw.title.romaji,
      english: raw.title.english,
      native: raw.title.native,
      preferred: preferredTitle(raw.title),
    },
    coverImage: raw.coverImage?.large ?? null,
    bannerImage: raw.bannerImage,
    description: raw.description ? raw.description.replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, "") : null,
    format: (raw.format as MediaFormat) ?? null,
    status: (raw.status as MediaStatus) ?? null,
    genres: raw.genres ?? [],
    tags: (raw.tags ?? []).filter((t) => !t.isMediaSpoiler).map((t) => t.name),
    studios: (raw.studios?.nodes ?? []).map((s) => s.name),
    publishers: kind === "manga" ? (raw.studios?.nodes ?? []).map((s) => s.name) : [],
    episodes: raw.episodes,
    duration: raw.duration,
    chapters: raw.chapters,
    volumes: raw.volumes,
    season: (raw.season as AiringSeason) ?? null,
    seasonYear: raw.seasonYear,
    startDate: fuzzyDateToIso(raw.startDate),
    endDate: fuzzyDateToIso(raw.endDate),
    averageScore: raw.averageScore,
    popularity: raw.popularity,
    favourites: raw.favourites,
    trailerUrl:
      raw.trailer?.site === "youtube" && raw.trailer.id ? `https://www.youtube.com/watch?v=${raw.trailer.id}` : null,
    officialSiteUrl: raw.externalLinks?.find((l) => l.site === "Official Site")?.url ?? null,
    nextAiringEpisode: raw.nextAiringEpisode
      ? {
          episode: raw.nextAiringEpisode.episode,
          airingAt: new Date(raw.nextAiringEpisode.airingAt * 1000).toISOString(),
        }
      : null,
    broadcastDay: broadcastDayFromAiringAt(raw.nextAiringEpisode?.airingAt),
    relations: (raw.relations?.edges ?? []).map((e) => ({
      relation: e.relationType,
      mediaId: `anilist:${e.node.id}`,
      title: e.node.title.romaji ?? "Untitled",
    })),
    externalLinks: raw.externalLinks ?? [],
    confidence: { level: "high" },
    lastUpdated: new Date().toISOString(),
  };
}

export function mapStaff(raw: RawStaff): NormalizedPerson {
  const primaryOccupation = (raw.primaryOccupations?.[0] ?? "").toLowerCase();
  const roleMap: Record<string, NormalizedPerson["primaryRole"]> = {
    "voice actor": "voice_actor",
    "voice actress": "voice_actor",
    director: "director",
    "sound director": "director",
    composer: "composer",
    "music producer": "composer",
    producer: "producer",
    "original creator": "author",
    "story & art": "author",
    mangaka: "author",
    "art director": "artist",
    illustrator: "artist",
  };

  return {
    id: `anilist:${raw.id}`,
    source: "anilist",
    sourceId: String(raw.id),
    sourceUrl: raw.siteUrl,
    name: raw.name.full,
    nativeName: raw.name.native,
    alternateNames: raw.name.alternative ?? [],
    image: raw.image?.large ?? null,
    primaryRole: roleMap[primaryOccupation] ?? "voice_actor",
    dateOfBirth: raw.dateOfBirth?.year || raw.dateOfBirth?.month ? raw.dateOfBirth : null,
    description: raw.description ? raw.description.replace(/<[^>]+>/g, "") : null,
    homeTown: raw.homeTown,
    notableRoles: [
      ...(raw.characterMedia?.edges ?? []).map((e) => ({
        mediaId: `anilist:${e.node.id}`,
        mediaTitle: e.node.title.romaji ?? "Untitled",
      })),
      ...(raw.staffMedia?.edges ?? []).map((e) => ({
        mediaId: `anilist:${e.node.id}`,
        mediaTitle: e.node.title.romaji ?? "Untitled",
      })),
    ],
    lastUpdated: new Date().toISOString(),
  };
}

export interface CharacterBirthday {
  id: string;
  name: string;
  nativeName: string | null;
  image: string | null;
  sourceUrl: string;
  mediaTitle: string | null;
}

export function mapCharacterBirthday(raw: RawCharacter): CharacterBirthday {
  return {
    id: `anilist-char:${raw.id}`,
    name: raw.name.full,
    nativeName: raw.name.native,
    image: raw.image?.large ?? null,
    sourceUrl: raw.siteUrl,
    mediaTitle: raw.media?.nodes?.[0]?.title.romaji ?? null,
  };
}
