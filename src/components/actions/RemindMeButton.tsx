"use client";

import { useState, useTransition } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createAlert } from "@/lib/actions/alerts";

export function RemindMeButton({ mediaId, mediaTitle, size = "sm" }: { mediaId: string; mediaTitle: string; size?: "sm" | "md" }) {
  const { isSignedIn, isLoaded } = useUser();
  const [pending, startTransition] = useTransition();
  const [set, setSet] = useState(false);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button variant="secondary" size={size}>
          <Bell className="h-3.5 w-3.5" /> Remind me
        </Button>
      </SignInButton>
    );
  }

  return (
    <Button
      variant="secondary"
      size={size}
      disabled={pending || set}
      onClick={() =>
        startTransition(async () => {
          await createAlert({ type: "new_episode", targetId: mediaId, targetLabel: mediaTitle });
          setSet(true);
        })
      }
    >
      {set ? <BellRing className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
      {set ? "Reminder set" : "Remind me"}
    </Button>
  );
}
