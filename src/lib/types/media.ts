/** Shared normalized-item contract every provider adapter must satisfy (see spec §5). */

export type DataSource = "anilist" | "myanimelist" | "jikan" | "mock";

export type MediaKind = "anime" | "manga";

export type MediaFormat =
  | "TV"
  | "TV_SHORT"
  | "MOVIE"
  | "OVA"
  | "ONA"
  | "SPECIAL"
  | "MUSIC"
  | "MANGA"
  | "NOVEL"
  | "ONE_SHOT";

export type MediaStatus =
  | "FINISHED"
  | "RELEASING"
  | "NOT_YET_RELEASED"
  | "CANCELLED"
  | "HIATUS";

export type AiringSeason = "WINTER" | "SPRING" | "SUMMER" | "FALL";

export interface ExternalId {
  source: DataSource;
  sourceId: string;
  sourceUrl: string;
}

export interface Titles {
  romaji: string | null;
  english: string | null;
  native: string | null;
  /** Best-available display title, computed by the mapper (english > romaji > native). */
  preferred: string;
}

export interface DataConfidence {
  /** "high" = came straight from a primary provider field; "low" = derived/inferred. */
  level: "high" | "medium" | "low";
  note?: string;
}

export interface NormalizedMedia {
  id: string; // internal id, `${source}:${sourceId}`
  kind: MediaKind;
  source: DataSource;
  sourceId: string;
  sourceUrl: string;
  externalIds: ExternalId[];
  titles: Titles;
  coverImage: string | null;
  bannerImage: string | null;
  description: string | null;
  format: MediaFormat | null;
  status: MediaStatus | null;
  genres: string[];
  tags: string[];
  studios: string[]; // anime
  publishers: string[]; // manga
  episodes: number | null;
  duration: number | null; // minutes, anime
  chapters: number | null; // manga
  volumes: number | null; // manga
  season: AiringSeason | null;
  seasonYear: number | null;
  startDate: string | null; // ISO date
  endDate: string | null; // ISO date
  averageScore: number | null; // 0-100
  popularity: number | null;
  favourites: number | null;
  trailerUrl: string | null;
  officialSiteUrl: string | null;
  nextAiringEpisode: { episode: number; airingAt: string } | null;
  broadcastDay: string | null; // e.g. "Saturday" JST
  relations: { relation: string; mediaId: string; title: string }[];
  externalLinks: { site: string; url: string }[];
  confidence: DataConfidence;
  lastUpdated: string; // ISO timestamp
}

export interface AiringEntry {
  mediaId: string;
  anime: NormalizedMedia;
  episode: number;
  airingAt: string; // ISO
}
