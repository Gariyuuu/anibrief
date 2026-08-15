"use client";

import { useState, useTransition } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Check, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { addOrUpdateAnimeListEntry } from "@/lib/actions/animeList";
import { addOrUpdateMangaListEntry } from "@/lib/actions/mangaList";

export function AddToListButton({
  kind,
  mediaId,
  mediaTitle,
  coverImage,
  size = "sm",
}: {
  kind: "anime" | "manga";
  mediaId: string;
  mediaTitle: string;
  coverImage: string | null;
  size?: "sm" | "md";
}) {
  const { isSignedIn, isLoaded } = useUser();
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button variant="secondary" size={size}>
          <ListPlus className="h-3.5 w-3.5" /> Add to list
        </Button>
      </SignInButton>
    );
  }

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        if (kind === "anime") {
          await addOrUpdateAnimeListEntry({ mediaId, mediaTitle, coverImage, status: "planning" });
        } else {
          await addOrUpdateMangaListEntry({ mediaId, mediaTitle, coverImage, status: "planning" });
        }
        setAdded(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button variant="secondary" size={size} onClick={handleClick} disabled={pending || added}>
        {added ? <Check className="h-3.5 w-3.5 check-pop" /> : <ListPlus className="h-3.5 w-3.5" />}
        {added ? "On your list" : pending ? "Adding…" : "Add to list"}
      </Button>
      {error && <p className="text-xs text-negative">{error}</p>}
    </div>
  );
}
