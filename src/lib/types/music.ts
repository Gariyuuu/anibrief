export type ThemeType = "opening" | "ending" | "insert" | "ost" | "character_song" | "single" | "album";

export interface MusicRelease {
  id: string;
  source: "mock" | "anilist";
  title: string;
  artist: string;
  composer: string | null;
  coverImage: string | null;
  releaseDate: string | null; // ISO date
  themeType: ThemeType;
  relatedAnimeId: string | null;
  relatedAnimeTitle: string | null;
  episodeDebut: number | null;
  listenLinks: { platform: string; url: string }[];
  youtubeVideoId: string | null;
}
