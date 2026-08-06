"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Route error boundary:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-16">
      <EmptyState
        icon={AlertTriangle}
        title="Something didn't load"
        description="A live data source (AniList, news, or the database) may be temporarily unavailable. Try again in a moment."
        action={
          <Button size="sm" onClick={() => reset()}>
            Try again
          </Button>
        }
      />
    </div>
  );
}
