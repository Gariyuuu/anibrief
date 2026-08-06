# Contributing to AniBrief

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in what you have; every feature degrades gracefully without a key
npm run dev
```

See `ENVIRONMENT_VARIABLES.md` for what each variable unlocks, and `DATABASE.md` for the (optional) Neon/Drizzle setup.

## Before opening a PR

```bash
npm run typecheck   # tsc --noEmit — must be clean
npm run lint         # eslint — must be clean
npm test              # node's built-in test runner
npm run build           # production build — exercises every static/ISR route against live providers
```

## Code conventions

- **App Router only.** Server Components by default; add `"use client"` only where interactivity (state, effects, browser APIs) actually requires it.
- **Server-only secrets.** Any module that touches an API key or the database imports `"server-only"` at the top (see `src/lib/providers/*/index.ts`, `src/lib/db/client.ts`). Never import one of these from a Client Component.
- **Provider abstraction.** UI code should never call `fetch()` against AniList/Jikan/YouTube/etc. directly — go through the corresponding module in `src/lib/providers/`. If you need a new field, extend the provider's query + mapper, not the calling page.
- **Normalized types.** Anime/manga data flows through `NormalizedMedia` (`src/lib/types/media.ts`); people through `NormalizedPerson`. Don't leak provider-specific raw shapes into components — map them first (see `src/lib/providers/anilist/mappers.ts`).
- **Graceful degradation, not fake data.** If a provider isn't configured or a request fails, render `ErrorState`/`EmptyState` (`src/components/ui/`) with an honest message. Never fabricate scores, trend percentages, dates, or "personalized" claims that aren't backed by real data — see the product spec's explicit rule against invented data.
- **Server actions for mutations.** User-writable state (lists, alerts, follows, profile settings) goes through a `"use server"` action in `src/lib/actions/`, gated by `await auth()` from `@clerk/nextjs/server`. Client components call these via `useTransition`, following the pattern in `src/components/actions/AddToListButton.tsx`.
- **Clerk auth API.** This project is on Clerk's newer SDK, which does **not** export `SignedIn`/`SignedOut` — use `<Show when="signed-in">`/`<Show when="signed-out">` from `@clerk/nextjs`, `useUser()` client-side, or `await auth()` server-side.
- **Styling.** Tailwind v4, CSS-variable theme tokens in `src/app/globals.css` (`bg-surface`, `text-muted`, `border-border`, `text-accent`, etc.) rather than hardcoded colors, so both themes and all seven accent options stay correct automatically.
- **`Button` component.** Renders a real `<a>`/`Link` when given an `href` prop — never nest a `<Link>` inside a `<Button>`.

## Adding a new data provider

1. Add a folder under `src/lib/providers/<name>/` with an `index.ts` exporting a `.configured` boolean and typed async methods, matching the pattern in `src/lib/providers/youtube/index.ts` (real implementation when a key is present, empty/`null` return + a logged reason when it isn't — never throw for "not configured").
2. If it produces anime/manga/person items, map raw responses into `NormalizedMedia`/`NormalizedPerson` rather than a bespoke shape.
3. Document the required env var(s) in `.env.example` and `ENVIRONMENT_VARIABLES.md`, and the provider's role/priority in `DATA_SOURCES.md`.

## Database changes

Schema lives in `src/lib/db/schema/*.ts` (Drizzle). After editing a schema file, run `npm run db:generate` to produce a migration in `drizzle/`, and update `DATABASE.md` if you added a table. Don't hand-edit generated migration files.

## Commit style

Small, focused commits; describe the *why* in the message when it isn't obvious from the diff. This project doesn't currently enforce a specific commit-message format.
