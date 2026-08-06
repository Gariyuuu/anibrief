# UI_SYSTEM.md

> Re-synced 2026-08-06 ~15:35 MST against the actual current git state (commit
> `1d1eef9`). The "Page structure" and "Error states" sections below were stale
> (written against a pre-commit snapshot with no content pages) and have been
> corrected; everything else in this file was already accurate.

## Layout system

`src/app/layout.tsx` (root) → `src/components/layout/AppShell.tsx`
(visual chrome, client component). `AppShell` uses a 3-region flex
layout inside a `max-w-[1440px]` centered container: a fixed-width
(`w-60`) sticky sidebar on desktop (`md:flex`, hidden below `md`), a
main content column (`flex-1`), and (on mobile) a slide-in drawer +
fixed bottom nav bar instead of the sidebar. `main` has
`px-4 py-6 sm:px-6` padding and `pb-14` on mobile to clear the bottom
nav bar.

## Navigation

Single source of truth: `src/lib/nav.ts` — 15 `NavItem`s (`href`,
`label`, `icon` (a `lucide-react` component), optional single-letter
`shortcut` for the command palette's "g then <letter>" pattern). A
`mobileNavItems` subset (5 items: Home, Daily Brief, Airing, My List,
Calendar) drives `MobileNav.tsx`'s bottom bar "for thumb reach" (in-code
comment). Active-route highlighting uses `usePathname()` with
prefix-matching (`pathname.startsWith(item.href)`) except for `/`,
which requires an exact match.

## Page structure

**All 34 `page.tsx` files now exist** (re-verified this pass via `find src/app -name
page.tsx | wc -l` → 34, and `npm run build`'s 44-route output) — every route in
`src/lib/nav.ts` resolves to a real page. Clerk's `/sign-in` and `/sign-up`
catch-all routes are unchanged from the earlier description: a centered single
Clerk component (`<SignIn />`/`<SignUp />`) inside a `min-h-screen` flex-center div,
no custom styling beyond that wrapper. Content pages generally follow a
Server-Component-fetches-then-renders-Client-Components pattern (e.g. the home
page, `src/app/page.tsx`, calls `getTodaysBriefing()` then renders `HeroBrief`/
`EpisodeTimeline`/`TrendingList`/`BirthdayStrip`) — see `ARCHITECTURE.md`'s "Data
flow" section and its "Production fixes" note on the one place this pattern broke
in production (a function prop crossing the server/client boundary in
`DailyBriefView`, fixed in commit `1d1eef9`).

## Reusable components (`src/components/ui/`)

| Component | Variants/props | Notes |
|---|---|---|
| `Button` | `variant`: primary/secondary/ghost/outline; `size`: sm/md; optional `href` (renders `Link`, else `<button>`) | Base classes include `disabled:cursor-not-allowed disabled:opacity-50` |
| `Card` | none (just `className` passthrough) | `rounded-lg border border-border bg-surface shadow-sm` |
| `Badge` | `tone`: neutral/accent/positive/negative | Pill shape, `rounded-full` |
| `Avatar` | `src`, `alt`, `size` (default 32) | Falls back to a circle with the first letter of `alt` when `src` is null |
| `Skeleton` | none | `animate-pulse rounded-md bg-border/60` — a bare loading block, not composed into any larger skeleton layout yet |
| `EmptyState` | `icon` (Lucide), `title`, `description`, optional `action` | Rendered inside a `Card` |
| `ErrorState` | `reason`: `"not_configured"` \| `"fetch_failed"` (different icon per reason), `message` | Rendered inside a `Card` |
| `Tabs` | `items: {href,label}[]`, `active: string` | Underline-style tab bar, `role="tablist"`/`role="tab"` |

## Themes

CSS custom properties defined in `src/app/globals.css`, applied via
Tailwind v4's `@theme inline` block (maps `--color-*` Tailwind tokens to
the raw CSS vars). Two axes:

1. **Light/dark** — `:root` defines light values; `.dark` (applied to
   `<html>`) overrides them. Toggled by `ThemeToggle.tsx`, persisted to
   `localStorage` key `anibrief-theme`.
2. **Accent color** — 7 options defined in `src/lib/theme.ts`
   (`sakura` [default], `midnight`, `ocean`, `ember`, `matcha`,
   `violet`, `monochrome`), each with a light-mode and dark-mode hex
   pair for `--accent`/`--accent-foreground`, applied via
   `[data-accent="..."]` selectors on `<html>`. Toggled by
   `AccentPicker.tsx` (a swatch grid), persisted to `localStorage` key
   `anibrief-accent`.

Both are read synchronously in an inline `<script>` in `layout.tsx`'s
`<head>` before paint, to avoid a flash of the wrong theme/accent (FOUC).
Default (nothing in `localStorage`): dark mode, `sakura` accent.

## Colors

Base tokens (light mode values, see `globals.css` for dark-mode pairs):
`--background: #f6f3ec`, `--surface: #ffffff`,
`--surface-raised: #fffdf8`, `--border: #e5e0d3`,
`--foreground: #18140f`, `--muted: #6f6a5d`, `--positive: #2f8f5b`,
`--negative: #c0392b`, `--link: #1a56db`. In-code comment describes the
palette as "neutral ink/paper (no default 'SaaS purple')."

## Typography

`Geist` (sans) and `Geist_Mono` via `next/font/google`, exposed as CSS
vars `--font-geist-sans`/`--font-geist-mono`, mapped to Tailwind's
`--font-sans`/`--font-mono`. `body` falls back to
`Arial, Helvetica, sans-serif` if the Google Font fails to load. No
separate type-scale documentation found — sizes are ad-hoc Tailwind
utility classes per component (e.g. `text-2xl font-semibold` for the
hero headline).

## Spacing / border radius / shadows

No custom spacing/radius scale defined beyond Tailwind's defaults;
components consistently use `rounded-md`/`rounded-lg`/`rounded-full`
and `border border-border`. `Card` uses `shadow-sm`; `CommandPalette`'s
modal uses `shadow-2xl`.

## Breakpoints

Tailwind defaults (`sm`, `md`, `lg`) — no custom breakpoint config
found in `globals.css` or Tailwind config. Sidebar/mobile-drawer switch
at `md`; grid column counts step up at `sm`/`md`/`lg` in `AnimeGrid`.

## Animations

Minimal: `animate-pulse` (Skeleton), `transition-colors`/
`transition-transform` on interactive elements (buttons, nav links,
accent swatches scaling on hover). A global
`@media (prefers-reduced-motion: reduce)` block in `globals.css` forces
all animation/transition durations to `0.001ms` and disables smooth
scroll — respected app-wide, not per-component.

## Icon system

`lucide-react` throughout — no custom icon set beyond the brand `Mark`
SVG (`src/components/brand/Mark.tsx`). Icons are always sized via
Tailwind (`h-4 w-4`, `h-5 w-5`, etc.), never inline `style` dimensions.

## Image assets

**`public/` is completely empty** — zero static image files anywhere in
the repo. All "images" are either remote URLs (AniList CDN via
`next/image` + `next.config.ts`'s `remotePatterns`) or generated
on-request via `next/og`'s `ImageResponse` (favicon, apple touch icon,
OG image, PWA icons — all built from simple JSX shapes, not exported
PNGs).

## Modals

One modal pattern in the whole repo: `CommandPalette`'s fixed
full-screen overlay (`fixed inset-0 z-50 bg-black/50`) with a centered
panel, closed by clicking the backdrop or `Escape`. `AccentPicker`'s
dropdown uses the same "fixed full-screen invisible backdrop to catch
outside clicks" trick at `z-40` rather than a true modal. Clerk's
`<SignInButton mode="modal">` renders Clerk's own hosted modal (not
styled by this codebase).

## Forms

No traditional `<form>` elements found — all mutations go through
server actions invoked from `onClick` handlers wrapped in
`useTransition`, not `<form action={...}>`. No form-validation library
in use (no `react-hook-form`, no client-side `zod` resolver).

## Loading states

`Skeleton` primitive exists but is not yet composed into any
feature-specific loading layout (e.g. no `AnimeGridSkeleton`). Buttons
show inline pending text (`"Adding…"`) during their `useTransition`,
disabled while pending.

## Empty states

`EmptyState` used by `AnimeGrid` ("No results"), `NewsList` ("No
stories right now"), `EpisodeTimeline` ("No episodes today"),
`BirthdayStrip` (inline empty message, not the shared `EmptyState`
component — a minor inconsistency).

## Error states

`ErrorState` primitive (2 reasons: `not_configured`/`fetch_failed`) is **now used**
by `src/app/music/page.tsx`, `src/app/anime/[id]/music/page.tsx`, and
`src/components/briefing/BriefModeToggle.tsx` (re-verified this pass — the
previous pass found zero usages). Server actions still separately throw and let
the calling client component render its own inline error text (e.g.
`AddToListButton`'s `<p className="text-xs text-negative">`) for mutation
failures — that's a different, still-valid pattern for a different case
(write-path errors vs. read-path "this data source isn't configured/reachable"
states). **A global `error.tsx` App Router boundary now exists**
(`src/app/error.tsx`) — this is new since the previous pass, which found none.

## Accessibility

Observed good practices: `aria-label` on icon-only buttons throughout
(menu toggle, search, notifications, close), `role="tablist"`/
`role="tab"`/`aria-selected` on `Tabs`, `aria-hidden` on decorative
icons in `EmptyState`/`ErrorState`, `suppressHydrationWarning` used
correctly around client-only relative-time text (`NewsCard`,
`EpisodeTimeline`) to avoid SSR/CSR mismatch warnings without hiding
real hydration bugs elsewhere. No automated accessibility testing found
(no `axe`/`jest-axe` dependency).

## Responsive design

Sidebar (desktop) ↔ drawer + bottom bar (mobile) split at `md`.
`AnimeGrid` steps from 2 columns (mobile) to 6 (`lg`). Search bar hides
behind an icon-only button below `sm`. No dedicated tablet-specific
breakpoint handling beyond Tailwind's stock `sm`/`md`/`lg`.
