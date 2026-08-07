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

/** A real Spotify track — from the Client Credentials search/playlist-tracks endpoints. Never fabricated; `id`/`uri` are real Spotify identifiers only ever populated from a live API response. */
export interface SpotifyTrack {
  id: string;
  uri: string; // e.g. "spotify:track:<id>" — what playlist-creation needs
  title: string;
  artists: string[];
  albumArt: string | null;
  externalUrl: string;
  previewUrl: string | null;
}

/** A real Spotify playlist, as returned by search or lookup — used to transparently label "these tracks come from Spotify's own '[name]' playlist", not an AniBrief-computed chart. */
export interface SpotifyPlaylistInfo {
  id: string;
  name: string;
  description: string | null;
  ownerName: string;
  imageUrl: string | null;
  externalUrl: string;
  trackCount: number;
  /** Real Spotify follower count — null until a follow-up lookup fetches it (search results don't include it); used to pick and label the genuinely most-popular candidate playlist. */
  followers: number | null;
}

/**
 * Real tracks from a direct Spotify track search, plus (best-effort) a link
 * to a genuinely well-followed matching playlist for browsing — the honest
 * shape behind the "new this season" / "top anime songs" Spotify feeds (see
 * SpotifyProvider.getCuratedFeed). `playlist` is null when no good playlist
 * match was found; `tracks` is still real and populated in that case.
 */
export interface SpotifyCuratedFeed {
  playlist: SpotifyPlaylistInfo | null;
  tracks: SpotifyTrack[];
}

/** Normalized shape the Music page's multi-select UI operates on, regardless of whether the underlying track came from YouTube search or a Spotify playlist. */
export interface SelectableTrack {
  /** Unique across both sources, e.g. `youtube:<videoId>` or `spotify:<trackId>`. */
  key: string;
  source: "youtube" | "spotify";
  title: string;
  subtitle: string;
  thumbnail: string | null;
  externalUrl: string;
  youtubeVideoId?: string;
  spotifyUri?: string;
}
