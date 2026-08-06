import Image from "next/image";
import { ExternalLink, Music2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { TrackSelector } from "@/components/music/TrackSelector";
import type { SelectableTrack } from "@/lib/types/music";

/** Server-renderable track card (YouTube or Spotify) with an embedded client-side selection checkbox — safe to call directly from a Server Component page. */
export function SelectableTrackCard({ track }: { track: SelectableTrack }) {
  return (
    <Card className="flex items-center gap-3 p-3">
      <TrackSelector track={track} />
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-surface-raised">
        {track.thumbnail ? (
          <Image src={track.thumbnail} alt="" fill sizes="48px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Music2 className="h-5 w-5 text-muted" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-sm font-medium">{track.title}</p>
        <p className="truncate text-xs text-muted">{track.subtitle}</p>
      </div>
      <a
        href={track.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-muted hover:text-accent"
        aria-label={`Open ${track.title} on ${track.source === "youtube" ? "YouTube" : "Spotify"}`}
      >
        <ExternalLink className="h-4 w-4" />
      </a>
    </Card>
  );
}
