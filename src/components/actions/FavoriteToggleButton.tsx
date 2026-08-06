"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toggleAnimeFavorite } from "@/lib/actions/animeList";
import { toggleMangaFavorite } from "@/lib/actions/mangaList";

export function FavoriteToggleButton({
  kind,
  mediaId,
  isFavorite,
}: {
  kind: "anime" | "manga";
  mediaId: string;
  isFavorite: boolean;
}) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(isFavorite);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const next = !favorite;
    setFavorite(next);
    startTransition(async () => {
      try {
        if (kind === "anime") {
          await toggleAnimeFavorite(mediaId, next);
        } else {
          await toggleMangaFavorite(mediaId, next);
        }
        router.refresh();
      } catch {
        setFavorite(!next);
      }
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
      className="shrink-0 text-muted transition-colors hover:text-accent disabled:opacity-60"
    >
      <Star className={cn("h-4 w-4", favorite && "fill-accent text-accent")} />
    </button>
  );
}
