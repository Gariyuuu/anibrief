import type { DataSource } from "@/lib/types/media";

export interface CharacterMediaAppearance {
  /** Matches NormalizedMedia.id, e.g. "anilist:16498". */
  mediaId: string;
  mediaTitle: string;
  mediaKind: "anime" | "manga";
}

/** Normalized shape for an AniList fictional character — distinct from NormalizedPerson (real people). */
export interface NormalizedCharacter {
  id: string;
  source: DataSource;
  sourceId: string;
  sourceUrl: string;
  name: string;
  nativeName: string | null;
  alternateNames: string[];
  image: string | null;
  description: string | null;
  favourites: number | null;
  /** Fictional characters usually have no recorded birthday — null means unknown, never fabricated. */
  dateOfBirth: { year: number | null; month: number | null; day: number | null } | null;
  media: CharacterMediaAppearance[];
  lastUpdated: string;
}
