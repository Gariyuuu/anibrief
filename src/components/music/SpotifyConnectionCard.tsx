"use client";

import { useState, useTransition } from "react";
import { Music } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { disconnectSpotify } from "@/lib/actions/spotify";

/** Small connect/disconnect block for a signed-in user's Spotify OAuth connection — used on both /music and /settings so the status is visible wherever it matters. */
export function SpotifyConnectionCard({
  status,
}: {
  status: { connected: boolean; spotifyUserId: string | null };
}) {
  const [pending, startTransition] = useTransition();
  const [disconnected, setDisconnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connected = status.connected && !disconnected;

  function handleDisconnect() {
    setError(null);
    startTransition(async () => {
      try {
        await disconnectSpotify();
        setDisconnected(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to disconnect");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Music className="h-4 w-4 text-accent" />
          {connected ? (
            <span>
              Connected as <span className="font-medium">{status.spotifyUserId}</span>
            </span>
          ) : (
            <span className="text-muted">Not connected</span>
          )}
        </div>
        {connected ? (
          <Button variant="secondary" size="sm" onClick={handleDisconnect} disabled={pending}>
            {pending ? "Disconnecting…" : "Disconnect"}
          </Button>
        ) : (
          <Button variant="primary" size="sm" href="/api/spotify/connect">
            Connect Spotify
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-negative">{error}</p>}
    </div>
  );
}
