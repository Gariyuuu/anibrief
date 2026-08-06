"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { unfollowTarget } from "@/lib/actions/follows";

type FollowTargetType = "studio" | "person" | "character" | "tag" | "genre";

export function UnfollowChip({
  targetType,
  targetId,
  targetLabel,
}: {
  targetType: FollowTargetType;
  targetId: string;
  targetLabel: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (removed) return null;

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await unfollowTarget(targetType, targetId);
              setRemoved(true);
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to unfollow");
            }
          })
        }
        className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:border-negative/50 hover:text-negative disabled:opacity-60"
      >
        {targetLabel} <X className="h-3 w-3" />
      </button>
      {error && <p className="text-[11px] text-negative">{error}</p>}
    </div>
  );
}
