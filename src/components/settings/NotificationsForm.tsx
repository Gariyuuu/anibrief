"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/lib/actions/profile";

export function NotificationsForm({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(next: boolean) {
    setEnabled(next);
    setError(null);
    startTransition(async () => {
      try {
        await updateProfile({ emailDigestEnabled: next });
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
        <input type="checkbox" checked={enabled} disabled={pending} onChange={(e) => toggle(e.target.checked)} />
        Email me a daily digest
      </label>
      <p className="text-xs text-muted">
        This preference is saved for when email digests are enabled on this deployment — no email delivery is wired
        up yet (`resend` is installed but not integrated), so toggling this won&apos;t send anything today.
      </p>
      {saved && <p className="text-xs text-positive">Saved.</p>}
      {error && <p className="text-xs text-negative">{error}</p>}
    </div>
  );
}
