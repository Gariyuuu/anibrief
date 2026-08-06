"use client";

import { Check } from "lucide-react";
import { useMusicSelection } from "@/components/music/MusicSelectionProvider";
import type { SelectableTrack } from "@/lib/types/music";
import { cn } from "@/lib/utils/cn";

/** A checkbox bound to the shared selection context — rendered inside an otherwise server-rendered track card. */
export function TrackSelector({ track }: { track: SelectableTrack }) {
  const { toggle, isSelected } = useMusicSelection();
  const checked = isSelected(track.key);

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={checked ? `Remove ${track.title} from selection` : `Add ${track.title} to selection`}
      onClick={() => toggle(track)}
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
        checked ? "border-accent bg-accent text-accent-foreground" : "border-border text-transparent hover:border-accent/50"
      )}
    >
      <Check className="h-3.5 w-3.5" />
    </button>
  );
}
