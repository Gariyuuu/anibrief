"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/lib/actions/profile";
import { browserTimeZone } from "@/lib/utils/dates";

const LANGUAGES: { id: string; label: string }[] = [
  { id: "en", label: "English" },
  { id: "ja", label: "Japanese" },
  { id: "es", label: "Spanish" },
  { id: "fr", label: "French" },
  { id: "de", label: "German" },
  { id: "pt", label: "Portuguese" },
  { id: "ko", label: "Korean" },
  { id: "zh", label: "Chinese" },
];

export function RegionForm({
  initialTimezone,
  initialRegion,
  initialLanguage,
  initialHour12,
  initialWeekStartsMonday,
}: {
  initialTimezone: string;
  initialRegion: string | null;
  initialLanguage: string;
  initialHour12: boolean;
  initialWeekStartsMonday: boolean;
}) {
  const [timezone, setTimezone] = useState(initialTimezone);
  const [region, setRegion] = useState(initialRegion ?? "");
  const [language, setLanguage] = useState(initialLanguage);
  const [hour12, setHour12] = useState(initialHour12);
  const [weekStartsMonday, setWeekStartsMonday] = useState(initialWeekStartsMonday);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function save(patch: Partial<{ timezone: string; region: string | null; language: string; hour12: boolean; weekStartsMonday: boolean }>) {
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
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        save({ timezone, region: region || null, language });
      }}
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Timezone
          <input
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-52 rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            const detected = browserTimeZone();
            setTimezone(detected);
            save({ timezone: detected });
          }}
          className="rounded-md border border-border px-2.5 py-1.5 text-xs hover:border-accent/50"
        >
          Use my browser&apos;s timezone
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Region
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="e.g. US, JP, worldwide"
            className="w-40 rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Language
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-40 rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-accent"
          >
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hour12}
            onChange={(e) => {
              setHour12(e.target.checked);
              save({ hour12: e.target.checked });
            }}
          />
          12-hour clock
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={weekStartsMonday}
            onChange={(e) => {
              setWeekStartsMonday(e.target.checked);
              save({ weekStartsMonday: e.target.checked });
            }}
          />
          Week starts Monday
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-md border border-border px-3 py-1.5 text-sm hover:border-accent/50 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {saved && <p className="text-xs text-positive">Saved.</p>}
        {error && <p className="text-xs text-negative">{error}</p>}
      </div>
    </form>
  );
}
