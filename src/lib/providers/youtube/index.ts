import "server-only";
import { logger } from "@/lib/utils/logger";

export interface YouTubeVideo {
  videoId: string;
  title: string;
  channelName: string;
  publishedAt: string;
  thumbnail: string;
  videoType: "trailer" | "pv" | "music_video" | "announcement";
  officialConfidence: "verified_channel" | "unverified";
}

/**
 * Real implementation when YOUTUBE_API_KEY is set; returns [] otherwise so
 * callers render an empty state instead of crashing (spec §42). We never
 * fabricate a video ID or embed an unverified one, since a wrong ID silently
 * plays the wrong (or no) content.
 */
export const YouTubeProvider = {
  get configured() {
    return Boolean(process.env.YOUTUBE_API_KEY);
  },

  async searchTrailers(query: string, maxResults = 6): Promise<YouTubeVideo[]> {
    if (!this.configured) {
      logger.info("YouTubeProvider.searchTrailers skipped: YOUTUBE_API_KEY not set");
      return [];
    }

    try {
      const url = new URL("https://www.googleapis.com/youtube/v3/search");
      url.searchParams.set("part", "snippet");
      url.searchParams.set("q", query);
      url.searchParams.set("type", "video");
      url.searchParams.set("maxResults", String(maxResults));
      url.searchParams.set("key", process.env.YOUTUBE_API_KEY!);

      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) throw new Error(`YouTube API request failed: ${res.status}`);
      const json = await res.json();

      return (json.items ?? []).map(
        (item: {
          id: { videoId: string };
          snippet: { title: string; channelTitle: string; publishedAt: string; thumbnails: { high: { url: string } } };
        }) => ({
          videoId: item.id.videoId,
          title: item.snippet.title,
          channelName: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          thumbnail: item.snippet.thumbnails.high.url,
          videoType: "trailer" as const,
          officialConfidence: "unverified" as const,
        })
      );
    } catch (error) {
      logger.error("YouTubeProvider.searchTrailers failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  },
};
