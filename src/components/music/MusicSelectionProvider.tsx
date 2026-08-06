"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { SelectableTrack } from "@/lib/types/music";

interface MusicSelectionContextValue {
  selected: Map<string, SelectableTrack>;
  toggle: (track: SelectableTrack) => void;
  isSelected: (key: string) => boolean;
  clear: () => void;
}

const MusicSelectionContext = createContext<MusicSelectionContextValue | null>(null);

/**
 * Client-side selection state shared between track checkboxes scattered
 * across several server-rendered sections (New this season, Trending) and
 * the fixed selection bar at the bottom of the page. Deliberately lives only
 * in React state — selections aren't persisted, and clear on navigation/
 * reload, which matches "pick some tracks, act on them now" rather than a
 * saved cart.
 */
export function MusicSelectionProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Map<string, SelectableTrack>>(new Map());

  const toggle = useCallback((track: SelectableTrack) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(track.key)) next.delete(track.key);
      else next.set(track.key, track);
      return next;
    });
  }, []);

  const isSelected = useCallback((key: string) => selected.has(key), [selected]);
  const clear = useCallback(() => setSelected(new Map()), []);

  const value = useMemo(() => ({ selected, toggle, isSelected, clear }), [selected, toggle, isSelected, clear]);

  return <MusicSelectionContext.Provider value={value}>{children}</MusicSelectionContext.Provider>;
}

export function useMusicSelection(): MusicSelectionContextValue {
  const ctx = useContext(MusicSelectionContext);
  if (!ctx) throw new Error("useMusicSelection must be used within a MusicSelectionProvider");
  return ctx;
}
