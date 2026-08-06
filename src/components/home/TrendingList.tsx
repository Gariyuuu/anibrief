import Link from "next/link";
import Image from "next/image";
import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { NormalizedMedia } from "@/lib/types/media";

export function TrendingList({ items }: { items: NormalizedMedia[] }) {
  return (
    <Card className="p-4">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold">
        <TrendingUp className="h-4 w-4 text-accent" /> Trending anime
      </h2>
      <ol className="mt-3 flex flex-col gap-2.5">
        {items.map((media, i) => (
          <li key={media.id}>
            <Link href={`/anime/${encodeURIComponent(media.id)}`} className="flex items-center gap-2.5 group">
              <span className="w-4 shrink-0 text-right text-xs font-semibold tabular-nums text-muted">{i + 1}</span>
              <div className="relative h-11 w-8 shrink-0 overflow-hidden rounded">
                {media.coverImage && <Image src={media.coverImage} alt="" fill sizes="32px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium group-hover:text-accent">{media.titles.preferred}</p>
                <p className="text-xs text-muted">
                  {media.averageScore != null ? `${(media.averageScore / 10).toFixed(1)} · ` : ""}
                  {media.popularity != null ? `${media.popularity.toLocaleString()} on lists` : "—"}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}
