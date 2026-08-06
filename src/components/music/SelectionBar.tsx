"use client";

import { useMemo, useState, useTransition } from "react";
import { ExternalLink, ListMusic, Search, X } from "lucide-react";
import { useMusicSelection } from "@/components/music/MusicSelectionProvider";
import { Button } from "@/components/ui/Button";
import { createSpotifyPlaylist } from "@/lib/actions/spotify";

/** Real multi-video YouTube queue URL — https://www.youtube.com/watch_videos accepts a comma-separated list of real video IDs and plays them as a queue; this is a genuine YouTube feature, not a fabricated deep link. */
function youtubeQueueUrl(videoIds: string[]): string {
  return `https://www.youtube.com/watch_videos?video_ids=${videoIds.join(",")}`;
}

function spotifySearchUrl(query: string): string {
  return `https://open.spotify.com/search/${encodeURIComponent(query)}`;
}

/**
 * Fixed bottom bar showing the current cross-source selection and three real
 * actions. Spotify playlist creation is only offered when the signed-in user
 * has actually connected their account (`spotifyConnected`, computed
 * server-side via getSpotifyConnectionStatus) — otherwise a "Connect
 * Spotify" link is shown instead of a button that would just error.
 */
export function SelectionBar({ spotifyConnected }: { spotifyConnected: boolean }) {
  const { selected, clear } = useMusicSelection();
  const [pending, startTransition] = useTransition();
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tracks = useMemo(() => Array.from(selected.values()), [selected]);
  const youtubeIds = tracks.filter((t) => t.source === "youtube" && t.youtubeVideoId).map((t) => t.youtubeVideoId!);
  const spotifyUris = tracks.filter((t) => t.source === "spotify" && t.spotifyUri).map((t) => t.spotifyUri!);
  const combinedQuery = tracks.slice(0, 6).map((t) => `${t.title} ${t.subtitle}`).join(" | ");

  if (tracks.length === 0) return null;

  function handleSavePlaylist() {
    setError(null);
    setPlaylistUrl(null);
    startTransition(async () => {
      try {
        const result = await createSpotifyPlaylist({
          name: `AniBrief mix — ${new Date().toLocaleDateString()}`,
          description: "Created from AniBrief's Music page.",
          trackUris: spotifyUris,
        });
        setPlaylistUrl(result.playlistUrl);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create playlist.");
      }
    });
  }

  return (
    <div className="sticky bottom-4 z-10 mx-auto flex w-full max-w-4xl flex-col gap-2 rounded-lg border border-border bg-surface/95 p-3 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted">
          {tracks.length} track{tracks.length === 1 ? "" : "s"} selected
        </p>
        <button
          type="button"
          onClick={() => {
            clear();
            setPlaylistUrl(null);
            setError(null);
          }}
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
        >
          <X className="h-3 w-3" /> Clear
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {youtubeIds.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            href={youtubeQueueUrl(youtubeIds)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ListMusic className="h-3.5 w-3.5" /> Open {youtubeIds.length} in YouTube <ExternalLink className="h-3 w-3" />
          </Button>
        )}

        <Button variant="secondary" size="sm" href={spotifySearchUrl(combinedQuery)} target="_blank" rel="noopener noreferrer">
          <Search className="h-3.5 w-3.5" /> Search combined on Spotify <ExternalLink className="h-3 w-3" />
        </Button>

        {spotifyUris.length > 0 &&
          (spotifyConnected ? (
            <Button variant="primary" size="sm" onClick={handleSavePlaylist} disabled={pending}>
              {pending ? "Saving…" : `Save ${spotifyUris.length} as Spotify playlist`}
            </Button>
          ) : (
            <Button variant="primary" size="sm" href="/api/spotify/connect">
              Connect Spotify to save a playlist
            </Button>
          ))}
      </div>

      {playlistUrl && (
        <p className="text-xs text-positive">
          Playlist created —{" "}
          <a href={playlistUrl} target="_blank" rel="noopener noreferrer" className="underline">
            open on Spotify
          </a>
        </p>
      )}
      {error && <p className="text-xs text-negative">{error}</p>}
    </div>
  );
}
