import Image from "next/image";
import { Star, Users, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { AddToListButton } from "@/components/actions/AddToListButton";
import { RemindMeButton } from "@/components/actions/RemindMeButton";
import { getStreamingAvailability } from "@/lib/providers/streaming";
import type { NormalizedMedia } from "@/lib/types/media";

export function AnimeDetailHeader({ media, active, kind = "anime" }: { media: NormalizedMedia; active: string; kind?: "anime" | "manga" }) {
  const base = `/${kind}/${encodeURIComponent(media.id)}`;
  const tabs =
    kind === "anime"
      ? [
          { href: base, label: "Overview" },
          { href: `${base}/characters`, label: "Characters" },
          { href: `${base}/staff`, label: "Staff" },
          { href: `${base}/music`, label: "Music" },
          { href: `${base}/relations`, label: "Relations" },
          { href: `${base}/news`, label: "News" },
          { href: `${base}/statistics`, label: "Statistics" },
        ]
      : [
          { href: base, label: "Overview" },
          { href: `${base}/characters`, label: "Characters" },
          { href: `${base}/relations`, label: "Relations" },
          { href: `${base}/news`, label: "News" },
        ];
  const streaming = getStreamingAvailability(media);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative -mx-4 h-40 overflow-hidden bg-border sm:-mx-6 sm:h-56">
        {media.bannerImage && <Image src={media.bannerImage} alt="" fill className="object-cover" priority />}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      <div className="-mt-16 flex gap-4 sm:-mt-24">
        <div className="relative h-36 w-24 shrink-0 overflow-hidden rounded-lg border border-border shadow-lg sm:h-48 sm:w-32">
          {media.coverImage && <Image src={media.coverImage} alt={media.titles.preferred} fill sizes="128px" className="object-cover" />}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-end gap-1.5 pb-1">
          <h1 className="text-xl font-semibold leading-tight sm:text-2xl">{media.titles.preferred}</h1>
          {media.titles.native && <p className="text-sm text-muted">{media.titles.native}</p>}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            {media.format && <Badge tone="neutral">{media.format}</Badge>}
            {media.status && <Badge tone="neutral">{media.status.replace(/_/g, " ")}</Badge>}
            {media.averageScore != null && (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-current text-accent" /> {(media.averageScore / 10).toFixed(1)}
              </span>
            )}
            {media.popularity != null && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {media.popularity.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <AddToListButton kind={kind} mediaId={media.id} mediaTitle={media.titles.preferred} coverImage={media.coverImage} />
        {kind === "anime" && <RemindMeButton mediaId={media.id} mediaTitle={media.titles.preferred} />}
        {media.trailerUrl && (
          <a href={media.trailerUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs hover:border-accent/50">
            Trailer <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {streaming.map((s) => (
          <a key={s.platform} href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs hover:border-accent/50">
            {s.platform} <ExternalLink className="h-3 w-3" />
          </a>
        ))}
        <a href={media.sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-muted hover:text-accent">
          View on AniList ↗
        </a>
      </div>

      <Tabs items={tabs} active={active} />
    </div>
  );
}
