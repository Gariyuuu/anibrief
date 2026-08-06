"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { accentThemes, ACCENT_STORAGE_KEY, THEME_STORAGE_KEY } from "@/lib/theme";
import { updateProfile } from "@/lib/actions/profile";

type ColorMode = "light" | "dark" | "system";

const COLOR_MODES: { id: ColorMode; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

function applyColorMode(mode: ColorMode) {
  if (mode === "system") {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
    document.documentElement.classList.toggle("dark", prefersDark);
  } else {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    document.documentElement.classList.toggle("dark", mode === "dark");
  }
}

/** Syncs the accent/color-mode choice to both localStorage (so header ThemeToggle/AccentPicker keep working unchanged) and the `profiles` table (so it follows the user across devices when signed in). */
export function AppearanceForm({ initialAccent, initialColorMode }: { initialAccent: string; initialColorMode: string }) {
  const [accent, setAccent] = useState(initialAccent);
  const [colorMode, setColorMode] = useState<ColorMode>(
    initialColorMode === "light" || initialColorMode === "system" ? initialColorMode : "dark"
  );
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectAccent(id: string) {
    setAccent(id);
    setError(null);
    document.documentElement.setAttribute("data-accent", id);
    window.localStorage.setItem(ACCENT_STORAGE_KEY, id);
    startTransition(async () => {
      try {
        await updateProfile({ accentTheme: id });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  function selectColorMode(mode: ColorMode) {
    setColorMode(mode);
    setError(null);
    applyColorMode(mode);
    startTransition(async () => {
      try {
        await updateProfile({ colorMode: mode });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-medium text-muted">Accent color</p>
        <div className="flex flex-wrap gap-2">
          {accentThemes.map((t) => (
            <button
              key={t.id}
              type="button"
              title={t.label}
              aria-label={t.label}
              onClick={() => selectAccent(t.id)}
              disabled={pending}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-transform hover:scale-105",
                accent === t.id ? "border-foreground" : "border-transparent"
              )}
              style={{ background: t.swatch }}
            >
              {accent === t.id && <Check className="h-4 w-4" style={{ color: t.id === "monochrome" ? "#fff" : undefined }} />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted">Color mode</p>
        <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
          {COLOR_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              disabled={pending}
              onClick={() => selectColorMode(m.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                colorMode === m.id ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {saved && <p className="text-xs text-positive">Saved.</p>}
      {error && <p className="text-xs text-negative">{error}</p>}
    </div>
  );
}
