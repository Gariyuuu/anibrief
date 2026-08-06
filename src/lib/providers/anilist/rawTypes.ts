/** Raw shapes as returned by AniList's GraphQL API (subset actually queried). */

export interface RawFuzzyDate {
  year: number | null;
  month: number | null;
  day: number | null;
}

export interface RawMedia {
  id: number;
  idMal: number | null;
  type: "ANIME" | "MANGA";
  format: string | null;
  status: string | null;
  title: { romaji: string | null; english: string | null; native: string | null };
  description: string | null;
  coverImage: { large: string | null; color: string | null };
  bannerImage: string | null;
  genres: string[];
  tags: { name: string; isMediaSpoiler: boolean }[];
  studios: { nodes: { name: string }[] };
  episodes: number | null;
  duration: number | null;
  chapters: number | null;
  volumes: number | null;
  season: string | null;
  seasonYear: number | null;
  startDate: RawFuzzyDate;
  endDate: RawFuzzyDate;
  averageScore: number | null;
  popularity: number | null;
  favourites: number | null;
  trailer: { id: string; site: string; thumbnail: string | null } | null;
  siteUrl: string;
  source: string | null;
  nextAiringEpisode: { episode: number; airingAt: number } | null;
  externalLinks: { site: string; url: string }[];
  relations: {
    edges: { relationType: string; node: { id: number; title: { romaji: string | null }; type: string } }[];
  };
  characters?: {
    edges: {
      role: string;
      node: { id: number; name: { full: string }; image: { large: string | null } };
      voiceActors: { id: number; name: { full: string }; image: { large: string | null } }[];
    }[];
  };
  staff?: {
    edges: { role: string; node: { id: number; name: { full: string }; image: { large: string | null } } }[];
  };
  recommendations?: { nodes: { mediaRecommendation: RawMedia | null }[] };
}

export interface RawAiringScheduleNode {
  id: number;
  episode: number;
  airingAt: number;
  media: RawMedia;
}

export interface RawStaff {
  id: number;
  name: { full: string; native: string | null; alternative?: string[] };
  image: { large: string | null };
  primaryOccupations: string[];
  dateOfBirth: RawFuzzyDate;
  homeTown: string | null;
  siteUrl: string;
  description: string | null;
  characterMedia?: {
    edges: { characterRole: string; node: { id: number; title: { romaji: string | null } } }[];
  };
  staffMedia?: {
    edges: { staffRole: string; node: { id: number; title: { romaji: string | null } } }[];
  };
}

export interface RawCharacter {
  id: number;
  name: { full: string; native: string | null; alternative?: string[] };
  image: { large: string | null };
  siteUrl: string;
  description: string | null;
  favourites: number | null;
  dateOfBirth: RawFuzzyDate;
  media?: { nodes: { id: number; title: { romaji: string | null }; type: "ANIME" | "MANGA" }[] };
}

export interface RawStudio {
  id: number;
  name: string;
  siteUrl: string;
  media: {
    pageInfo: { hasNextPage: boolean; total: number };
    nodes: RawMedia[];
  };
}
