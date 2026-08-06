"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createAlert } from "@/lib/actions/alerts";
import { ALERT_TYPES, ALERT_FREQUENCIES, humanizeAlertType, humanizeFrequency } from "@/lib/utils/alertLabels";
import type { AlertType, AlertFrequency } from "@/lib/types/userList";

interface SearchResult {
  id: string;
  title: string;
  image: string | null;
  kind: "anime" | "manga";
}

/** Live-searches AniList via the shared /api/search endpoint (same one the command palette uses)
 * so a typed title can be resolved to a real media id/label pair for the alert. */
export function CreateAlertForm() {
  const router = useRouter();
  const [type, setType] = useState<AlertType>("new_episode");
  const [frequency, setFrequency] = useState<AlertFrequency>("immediate");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (selected || query.trim().length < 2) return;

    // All state updates for this search happen inside the timeout callback
    // (including the initial "searching" flag) rather than synchronously in
    // the effect body, so the dropdown only ever reflects the latest query.
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        const combined: SearchResult[] = [...(data.anime ?? []), ...(data.manga ?? [])];
        setResults(combined.slice(0, 8));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected]);

  function handleSelect(result: SearchResult) {
    setSelected(result);
    setQuery(result.title);
    setResults([]);
  }

  function handleClearSelection() {
    setSelected(null);
    setQuery("");
    setResults([]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      setError("Search for a title and pick a match first.");
      return;
    }
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        await createAlert({
          type,
          targetId: selected.id,
          targetLabel: selected.title,
          frequency,
        });
        setSuccess(true);
        handleClearSelection();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create alert.");
      }
    });
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      <p className="text-sm font-medium text-foreground">Create alert</p>
      <p className="text-xs text-muted">
        Target search currently matches anime &amp; manga titles from AniList. Alert types about people or studios
        will need a title that mentions them until dedicated search is added.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-muted">
            Type
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AlertType)}
              className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
            >
              {ALERT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {humanizeAlertType(t)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            Frequency
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as AlertFrequency)}
              className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
            >
              {ALERT_FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {humanizeFrequency(f)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="relative flex flex-col gap-1">
          <label className="text-xs text-muted" htmlFor="alert-target-search">
            Target
          </label>
          <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted" />
            <input
              id="alert-target-search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(null);
              }}
              placeholder="Search a title…"
              className="flex-1 bg-transparent text-sm text-foreground outline-none"
              autoComplete="off"
            />
            {selected && (
              <button
                type="button"
                onClick={handleClearSelection}
                aria-label="Clear selection"
                className="text-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {!selected && query.trim().length >= 2 && (searching || results.length > 0) && (
            <div className="absolute top-full z-10 mt-1 w-full rounded-md border border-border bg-surface-raised shadow-sm">
              {searching && <p className="px-3 py-2 text-xs text-muted">Searching…</p>}
              {!searching &&
                results.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelect(r)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-border/40"
                  >
                    <span className="truncate">{r.title}</span>
                    <span className="ml-auto shrink-0 text-xs text-muted">{r.kind}</span>
                  </button>
                ))}
              {!searching && results.length === 0 && query.trim().length >= 2 && (
                <p className="px-3 py-2 text-xs text-muted">No matches.</p>
              )}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-negative">{error}</p>}
        {success && <p className="text-xs text-positive">Alert created.</p>}

        <div>
          <Button type="submit" variant="primary" size="sm" disabled={pending || !selected}>
            {pending ? "Creating…" : "Create alert"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
