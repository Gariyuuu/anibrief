import "server-only";
import { logger } from "@/lib/utils/logger";
import type { MusicRelease } from "@/lib/types/music";

/**
 * No music-metadata credential is configured in this deployment (no
 * Spotify/MusicBrainz key — see DATA_SOURCES.md). Per spec §42, the
 * provider interface and UI are complete; this returns a small hand-curated
 * reference set of widely-known, publicly documented OP/ED credits (real
 * song and artist names, not invented) so the Music hub isn't empty, with
 * every card clearly labeled "curated reference data" rather than
 * implying it's a live sync. Listen links point to a YouTube *search* for
 * the track rather than a guessed video ID, since linking to an unverified
 * ID risks pointing at the wrong (or no) video.
 */
function searchLink(query: string): { platform: string; url: string }[] {
  return [{ platform: "YouTube Search", url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}` }];
}

const CURATED_RELEASES: Omit<MusicRelease, "id">[] = [
  {
    source: "mock",
    title: "Guren no Yumiya",
    artist: "Linked Horizon",
    composer: "Revo",
    coverImage: null,
    releaseDate: "2013-04-06",
    themeType: "opening",
    relatedAnimeId: null,
    relatedAnimeTitle: "Attack on Titan",
    episodeDebut: 1,
    listenLinks: searchLink("Linked Horizon Guren no Yumiya"),
    youtubeVideoId: null,
  },
  {
    source: "mock",
    title: "Again",
    artist: "YUI",
    composer: "YUI",
    coverImage: null,
    releaseDate: "2009-04-06",
    themeType: "opening",
    relatedAnimeId: null,
    relatedAnimeTitle: "Fullmetal Alchemist: Brotherhood",
    episodeDebut: 1,
    listenLinks: searchLink("YUI Again Fullmetal Alchemist"),
    youtubeVideoId: null,
  },
  {
    source: "mock",
    title: "Unravel",
    artist: "TK from Ling Tosite Sigure",
    composer: "TK",
    coverImage: null,
    releaseDate: "2014-07-04",
    themeType: "opening",
    relatedAnimeId: null,
    relatedAnimeTitle: "Tokyo Ghoul",
    episodeDebut: 1,
    listenLinks: searchLink("TK Unravel Tokyo Ghoul"),
    youtubeVideoId: null,
  },
  {
    source: "mock",
    title: "Idol",
    artist: "YOASOBI",
    composer: "Ayase",
    coverImage: null,
    releaseDate: "2023-04-09",
    themeType: "opening",
    relatedAnimeId: null,
    relatedAnimeTitle: "Oshi no Ko",
    episodeDebut: 1,
    listenLinks: searchLink("YOASOBI Idol Oshi no Ko"),
    youtubeVideoId: null,
  },
];

export const MusicProvider = {
  configured: false, // no live Spotify/MusicBrainz credential in this deployment

  async getCuratedReleases(): Promise<MusicRelease[]> {
    logger.info("MusicProvider.getCuratedReleases: serving curated reference set (no music API key configured)");
    return CURATED_RELEASES.map((r, i) => ({ ...r, id: `curated-${i}` }));
  },
};
