"use client";

import { useState, useTransition } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { UserCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { followTarget, unfollowTarget } from "@/lib/actions/follows";

export function FollowButton({
  targetId,
  targetLabel,
  initialFollowing = false,
  size = "sm",
}: {
  targetId: string;
  targetLabel: string;
  initialFollowing?: boolean;
  size?: "sm" | "md";
}) {
  const { isSignedIn, isLoaded } = useUser();
  const [pending, startTransition] = useTransition();
  const [following, setFollowing] = useState(initialFollowing);
  const [error, setError] = useState<string | null>(null);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button variant="secondary" size={size}>
          <UserPlus className="h-3.5 w-3.5" /> Follow
        </Button>
      </SignInButton>
    );
  }

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        if (following) {
          await unfollowTarget("person", targetId);
          setFollowing(false);
        } else {
          await followTarget("person", targetId, targetLabel);
          setFollowing(true);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update follow status.");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button variant={following ? "secondary" : "primary"} size={size} onClick={handleClick} disabled={pending}>
        {following ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
        {pending ? "…" : following ? "Following" : "Follow"}
      </Button>
      {error && <p className="text-xs text-negative">{error}</p>}
    </div>
  );
}
