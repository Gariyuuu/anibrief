"use client";

import { useState, useTransition } from "react";
import { updateAnnouncementBanner } from "@/lib/actions/admin";
import { Button } from "@/components/ui/Button";

type Tone = "neutral" | "positive" | "negative";

export function AnnouncementBannerForm({
  initialMessage,
  initialTone,
  initialActive,
}: {
  initialMessage: string;
  initialTone: Tone;
  initialActive: boolean;
}) {
  const [message, setMessage] = useState(initialMessage);
  const [tone, setTone] = useState<Tone>(initialTone);
  const [active, setActive] = useState(initialActive);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  function save(next: { message: string; tone: Tone; active: boolean }) {
    setStatus(null);
    startTransition(async () => {
      try {
        await updateAnnouncementBanner(next);
        setStatus({ ok: true, message: "Saved." });
      } catch (e) {
        setStatus({ ok: false, message: e instanceof Error ? e.message : "Failed to save." });
      }
    });
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        save({ message, tone, active });
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Message</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          className="rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground"
          placeholder="e.g. Scheduled maintenance tonight 2-3am UTC — some pages may be slow."
        />
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">Tone</span>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as Tone)}
            className="rounded-md border border-border bg-surface-raised px-2 py-1 text-sm text-foreground"
          >
            <option value="neutral">Neutral</option>
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <span>Active (shown to all visitors)</span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving…" : "Save banner"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => {
            setActive(false);
            save({ message, tone, active: false });
          }}
        >
          Deactivate
        </Button>
        {status && <span className={status.ok ? "text-xs text-positive" : "text-xs text-negative"}>{status.message}</span>}
      </div>
    </form>
  );
}
