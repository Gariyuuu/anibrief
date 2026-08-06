"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/lib/actions/profile";

export function PrivacyForm({ initialIsPublic, initialAnalyticsOptOut }: { initialIsPublic: boolean; initialAnalyticsOptOut: boolean }) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [analyticsOptOut, setAnalyticsOptOut] = useState(initialAnalyticsOptOut);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function save(patch: { isPublic?: boolean; analyticsOptOut?: boolean }) {
    setError(null);
    startTransition(async () => {
      try {
        await updateProfile(patch);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isPublic}
          disabled={pending}
          onChange={(e) => {
            setIsPublic(e.target.checked);
            save({ isPublic: e.target.checked });
          }}
        />
        Make my profile public
      </label>
      <p className="text-xs text-muted">
        Public profile pages by username aren&apos;t built yet in this deployment — this only records your
        preference for when that ships.
      </p>

      <label className="mt-2 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={analyticsOptOut}
          disabled={pending}
          onChange={(e) => {
            setAnalyticsOptOut(e.target.checked);
            save({ analyticsOptOut: e.target.checked });
          }}
        />
        Opt out of analytics
      </label>

      {saved && <p className="text-xs text-positive">Saved.</p>}
      {error && <p className="text-xs text-negative">{error}</p>}
    </div>
  );
}
