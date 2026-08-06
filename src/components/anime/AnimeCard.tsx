import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import type { NormalizedMedia } from "@/lib/types/media";
import { Badge } from "@/components/ui/Badge";

const formatLabel: Record<string, string> = {
  TV: "TV",
  TV_SHORT: "TV Short",
  MOVIE: "Movie",
  OVA: "OVA",
  ONA: "ONA",
  SPECIAL: "Special",
  MUSIC: "Music",
  MANGA: "Manga",
  NOVEL: "Novel",
  ONE_SHOT: "One-shot",
};

export function AnimeCard({ media, subtitle }: { media: NormalizedMedia; subtitle?: string }) {
  return (
    <Link href={`/${media.kind}/${encodeURIComponent(media.id)}`} className="group flex flex-col gap-2">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-border bg-surface-raised">
        {media.coverImage ? (
          <Image
            src={media.coverImage}
            alt={media.titles.preferred}
            fill
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 160px"
            className="object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted">No image</div>
        )}
        {media.format && (
          <Badge tone="neutral" className="absolute left-1.5 top-1.5 backdrop-blur">
            {formatLabel[media.format] ?? media.format}
          </Badge>
        )}
        {media.averageScore != null && (
          <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">
            <Star className="h-2.5 w-2.5 fill-current" />
            {(media.averageScore / 10).toFixed(1)}
          </span>
        )}
      </div>
      <div>
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:text-accent">
          {media.titles.preferred}
        </p>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
    </Link>
  );
}
