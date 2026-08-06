import type { SelectableTrack, SpotifyTrack } from "@/lib/types/music";
import type { YouTubeVideo } from "@/lib/providers/youtube";

/** Normalizes a real YouTube search result into the Music page's shared selectable-track shape. */
export function youtubeVideoToSelectable(video: YouTubeVideo): SelectableTrack {
  return {
    key: `youtube:${video.videoId}`,
    source: "youtube",
    title: video.title,
    subtitle: video.channelName,
    thumbnail: video.thumbnail,
    externalUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
    youtubeVideoId: video.videoId,
  };
}

/** Normalizes a real Spotify track (from search or a curator playlist) into the Music page's shared selectable-track shape. */
export function spotifyTrackToSelectable(track: SpotifyTrack): SelectableTrack {
  return {
    key: `spotify:${track.id}`,
    source: "spotify",
    title: track.title,
    subtitle: track.artists.join(", "),
    thumbnail: track.albumArt,
    externalUrl: track.externalUrl,
    spotifyUri: track.uri,
  };
}
