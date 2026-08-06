export interface AccentTheme {
  id: string;
  label: string;
  swatch: string;
}

// Swatches are the light-mode accent hex from globals.css, kept in sync by hand.
export const accentThemes: AccentTheme[] = [
  { id: "sakura", label: "Sakura", swatch: "#d95c85" },
  { id: "midnight", label: "Midnight", swatch: "#4f6fd6" },
  { id: "ocean", label: "Ocean", swatch: "#17879c" },
  { id: "ember", label: "Ember", swatch: "#c85a26" },
  { id: "matcha", label: "Matcha", swatch: "#5c7f3f" },
  { id: "violet", label: "Violet", swatch: "#6f52c2" },
  { id: "monochrome", label: "Monochrome", swatch: "#18140f" },
];

export const defaultAccent = "sakura";
export const ACCENT_STORAGE_KEY = "anibrief-accent";
export const THEME_STORAGE_KEY = "anibrief-theme";

export function isAccentId(value: string | null): value is string {
  return !!value && accentThemes.some((a) => a.id === value);
}
