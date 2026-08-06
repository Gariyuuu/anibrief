"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils/cn";

interface SearchHit {
  id: string;
  title: string;
  image: string | null;
  kind: "anime" | "manga" | "person" | "character";
}

/** Maps a search hit's kind to the route segment it lives under — people/characters don't share the "/kind/id" shape anime/manga use. */
function hrefForHit(hit: SearchHit): string {
  if (hit.kind === "person") return `/people/${encodeURIComponent(hit.id)}`;
  if (hit.kind === "character") return `/characters/${encodeURIComponent(hit.id)}`;
  return `/${hit.kind}/${encodeURIComponent(hit.id)}`;
}

/** Cmd/Ctrl+K opens; "/" opens+focuses when nothing else has focus; "g then x" jumps via nav.ts shortcuts. */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ anime: SearchHit[]; manga: SearchHit[]; people: SearchHit[]; characters: SearchHit[] }>({
    anime: [],
    manga: [],
    people: [],
    characters: [],
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingG = useRef(false);

  useEffect(() => {
    function isTypingTarget(el: EventTarget | null) {
      const tag = (el as HTMLElement | null)?.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || (el as HTMLElement | null)?.isContentEditable;
    }

    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (isTypingTarget(e.target)) return;

      if (e.key === "/") {
        e.preventDefault();
        setOpen(true);
        return;
      }

      if (pendingG.current) {
        pendingG.current = false;
        const item = navItems.find((n) => n.shortcut === e.key.toLowerCase());
        if (item) router.push(item.href);
        return;
      }
      if (e.key.toLowerCase() === "g") {
        pendingG.current = true;
        setTimeout(() => (pendingG.current = false), 1200);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
    } else {
      // Clears the search box when the palette closes, so reopening it
      // starts fresh rather than showing the last query.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      // Clears stale results once the query is too short to search on.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults({ anime: [], manga: [], people: [], characters: [] });
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (res.ok) setResults(await res.json());
      } catch {
        // aborted or network error — leave previous results in place
      }
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  if (!open) return null;

  const hits = [...results.anime, ...results.manga, ...results.people, ...results.characters];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-24" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface-raised shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anime, manga, or jump to a page…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
          <kbd className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted">Esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {hits.length === 0 && query.trim().length >= 2 && (
            <p className="px-2 py-4 text-center text-sm text-muted">No matches for &quot;{query}&quot;.</p>
          )}
          {hits.map((hit) => (
            <button
              key={hit.id}
              onClick={() => {
                setOpen(false);
                router.push(hrefForHit(hit));
              }}
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-border/40"
            >
              {hit.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={hit.image} alt="" className="h-10 w-7 shrink-0 rounded object-cover" />
              ) : (
                <div className="h-10 w-7 shrink-0 rounded bg-border" />
              )}
              <span className="flex-1 truncate">{hit.title}</span>
              <span className="shrink-0 text-xs text-muted capitalize">{hit.kind}</span>
            </button>
          ))}
          {query.trim().length < 2 && (
            <div className="grid grid-cols-2 gap-1 p-1">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => {
                    setOpen(false);
                    router.push(item.href);
                  }}
                  className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-border/40")}
                >
                  <item.icon className="h-4 w-4 text-muted" />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
