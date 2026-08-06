import type { NormalizedMedia } from "@/lib/types/media";

export interface StreamingLink {
  platform: string;
  url: string;
}

// AniList's externalLinks already carries officially-declared streaming
// platforms per title (spec §5's StreamingAvailabilityProvider) — this is
// real, licensed-source data, not scraped or guessed.
export const KNOWN_STREAMING_SITES = new Set([
  "Crunchyroll",
  "Netflix",
  "Funimation",
  "Hulu",
  "Amazon Prime Video",
  "HIDIVE",
  "Disney Plus",
  "YouTube",
  "Hidive",
  "Max",
  "Muse Asia",
]);

export function getStreamingAvailability(media: NormalizedMedia): StreamingLink[] {
  return media.externalLinks
    .filter((link) => KNOWN_STREAMING_SITES.has(link.site))
    .map((link) => ({ platform: link.site, url: link.url }));
}
