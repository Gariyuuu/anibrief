"use client";

import { useEffect, useState } from "react";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { accentThemes, ACCENT_STORAGE_KEY, defaultAccent } from "@/lib/theme";
import { cn } from "@/lib/utils/cn";

export function AccentPicker() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(defaultAccent);

  useEffect(() => {
    // Reads the accent the no-flash init script (layout.tsx) already applied
    // to <html> before paint, so the swatch picker's "current" ring matches
    // on first client render without duplicating localStorage-read logic.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrent(document.documentElement.getAttribute("data-accent") ?? defaultAccent);
  }, []);

  function select(id: string) {
    setCurrent(id);
    document.documentElement.setAttribute("data-accent", id);
    window.localStorage.setItem(ACCENT_STORAGE_KEY, id);
    setOpen(false);
  }

  return (
    <div className="relative">
      <Button variant="secondary" className="px-2" aria-label="Choose accent color" onClick={() => setOpen((v) => !v)}>
        <Palette className="h-4 w-4" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 grid w-44 grid-cols-4 gap-2 rounded-lg border border-border bg-surface-raised p-3 shadow-lg">
            {accentThemes.map((accent) => (
              <button
                key={accent.id}
                type="button"
                aria-label={accent.label}
                title={accent.label}
                onClick={() => select(accent.id)}
                className={cn(
                  "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                  current === accent.id ? "border-foreground" : "border-transparent"
                )}
                style={{ background: accent.swatch }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
