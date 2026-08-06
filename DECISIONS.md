# DECISIONS.md — Architectural Decision Log

> Reasoning is labeled **Verified** when it is directly evidenced by an
> in-repo comment or file (with a pointer) and **Inferred** when
> reconstructed from code shape/behavior with no written justification
> found. Never fabricated. Snapshot: 2026-08-06 05:59:28 MST.

### DEC-001 — Clerk for authentication, not a hand-rolled auth system

- **Decision:** Use `@clerk/nextjs` for all auth (middleware, provider,
  hosted sign-in/up UI, server-side `auth()` in actions) rather than a
  custom session/JWT system.
- **Reasoning:** **Inferred.** No comment explains the choice, but the
  entire auth surface (proxy.ts, layout.tsx, every server action) is
  100% Clerk-shaped with no parallel/alternative auth code present.
- **Verification:** Verified as the current state (all auth code
  observed uses Clerk); the *reasoning* for choosing Clerk specifically
  is inferred, not documented.
- **Note:** This decision appears to have **replaced an earlier plan**
  — see DEC-004.

### DEC-002 — Neon Postgres + Drizzle ORM for all persistence

- **Decision:** User-generated data (lists, alerts, follows, profile,
  briefing archive, admin tables) lives in Neon Postgres, accessed via
  Drizzle's HTTP driver (`drizzle-orm/neon-http`), not Prisma or a raw
  `pg` client.
- **Reasoning:** **Verified**, partially — `src/lib/db/client.ts`'s
  comment: "Lazy Neon (Postgres, via Drizzle's HTTP driver — no
  persistent connection needed, which fits serverless routes well)
  client." The choice of Drizzle specifically over other ORMs is
  **Inferred** (no comment compares alternatives).
- **Verification:** Verified (in-repo comment, file:
  `src/lib/db/client.ts:12-19`).
- **Note:** This decision also appears to have **replaced an earlier
  Supabase-based plan** — see DEC-004.

### DEC-003 — Every DB write path must check `isDatabaseConfigured()` and
degrade gracefully rather than crash

- **Decision:** No server action or data path may assume
  `DATABASE_URL` is set. `db()` throws only when actually called
  without it; every call site is expected to guard with
  `isDatabaseConfigured()` first and show a "not configured yet"
  message or empty state instead.
- **Reasoning:** **Verified** — `src/lib/db/client.ts`'s comment:
  "every call site is expected to check `isDatabaseConfigured()` first
  and degrade gracefully... instead of letting this throw reach the
  user, per spec §42." (The referenced spec document itself was not
  found in the repo — see `CLAUDE.md`.)
- **Verification:** Verified (in-repo comment + the pattern is
  followed consistently across all 5 files in `src/lib/actions/`).

### DEC-004 — Supabase was dropped in favor of Clerk + Neon/Drizzle
partway through this project's life

- **Decision (as observed):** At the very start of this audit session,
  `package.json` listed `@supabase/ssr` and `@supabase/supabase-js` as
  dependencies, and `supabase/migrations/` existed as an (empty)
  directory. By the end of the same session, those two packages were
  gone from `package.json`, replaced by `@clerk/nextjs` +
  `@neondatabase/serverless` + `drizzle-orm` + `drizzle-kit`, and a
  complete, unrelated 18-table Drizzle schema had appeared.
- **Reasoning:** **Inferred entirely** — no comment, commit message, or
  note anywhere explains *why* this switch happened. This audit did not
  author the switch (see `PROJECT_STATE.md`'s "Concurrent modification"
  section) and has no access to whoever did, so the motivation is
  unknown. A plausible guess (Supabase Auth + Postgres vs. Clerk (auth
  specialist) + Neon (Postgres specialist) is a common combination for
  apps that want best-of-breed rather than one vendor) is **not**
  confirmed by anything in the repo and should not be treated as fact.
- **Verification:** Verified that the switch happened (before/after
  `package.json` content directly observed); **not verified** why.
- **Consequence:** `supabase/migrations/` is now an orphaned empty
  directory with no purpose — flagged in `TASKS.md` as a cleanup
  candidate, not removed by this audit (out of scope — no product
  behavior changes).

### DEC-005 — Providers never throw; they log and return a safe fallback

- **Decision:** Every module under `src/lib/providers/*` catches its
  own errors, logs via `src/lib/utils/logger.ts`, and returns an empty
  array / `null` / empty-object shape rather than letting an exception
  propagate to the caller.
- **Reasoning:** **Verified** — this exact pattern (`safe()` helper in
  `anilist/index.ts`, try/catch in every other provider) is used
  uniformly across all 7 provider modules with no exception. The intent
  is explicit in `youtube/index.ts`'s comment: "so callers render an
  empty state instead of crashing (spec §42)."
- **Verification:** Verified (pattern observed in every provider file;
  comment citation present).

### DEC-006 — Server actions, unlike providers, throw on purpose

- **Decision:** Unlike the provider layer, `src/lib/actions/*.ts`
  functions **do** throw (`Error` with a user-readable message) on
  auth failure or missing DB config, rather than returning a fallback
  value.
- **Reasoning:** **Inferred** — no comment states this design contrast
  explicitly, but it's consistent: every action's `requireUser()` throws
  a specific, user-facing sentence ("Sign in to save titles to your
  list.", "Lists aren't available yet — DATABASE_URL isn't configured
  for this deployment.") clearly meant to be caught and displayed by
  the calling client component (which `AddToListButton`/`RemindMeButton`
  both do, via try/catch around their `useTransition` callback).
- **Verification:** Verified as the current, consistent behavior across
  all 5 action files; the *design rationale* (server actions are
  user-initiated and should surface errors, vs. providers which back
  passive rendering and should never break a page) is inferred.

### DEC-007 — Never fabricate video IDs, streaming links, or MAL data

- **Decision:** `YouTubeProvider` never invents a video ID; when no
  `YOUTUBE_API_KEY` is set, it returns `[]` rather than guessing.
  `MusicProvider`'s curated entries link to a YouTube *search* URL, not
  a specific (potentially wrong) video ID. `StreamingProvider` only
  surfaces platforms AniList itself already lists as `externalLinks`
  (official/licensed data), never a scraped or guessed source.
  `MyAnimeListProvider` returns `null` rather than a fabricated ranking.
- **Reasoning:** **Verified** — explicit comments in all three files:
  `youtube/index.ts` ("We never fabricate a video ID or embed an
  unverified one, since a wrong ID silently plays the wrong (or no)
  content"), `music/index.ts` ("Listen links point to a YouTube
  *search* for the track rather than a guessed video ID, since linking
  to an unverified ID risks pointing at the wrong (or no) video"),
  `streaming/index.ts` ("this is real, licensed-source data, not
  scraped or guessed").
- **Verification:** Verified (in-repo comments, consistent behavior).

### DEC-008 — Shared TypeScript types (`src/lib/types/*`) and the Drizzle
DB schema are two independently-maintained shapes, not generated from
one source of truth

- **Decision (as observed):** `src/lib/types/userList.ts` defines
  `AnimeListStatus`/`MangaListStatus`/`AlertType`/`AlertFrequency` as
  TypeScript string-literal unions. `src/lib/db/schema/lists.ts` and
  `alerts.ts` store the equivalent columns as plain `text()` with a
  comment noting the intended enum (e.g. `status: text("status")...  //
  AnimeListStatus`) rather than importing/deriving from the TS type or
  using a Postgres `enum`.
- **Reasoning:** **Inferred** — no comment explains why these weren't
  unified (e.g. via `drizzle-zod` or a shared const array). Plausible
  reasons (Drizzle's HTTP/Neon driver ergonomics, avoiding a Postgres
  `ALTER TYPE` migration cost for future enum changes) are **not**
  confirmed anywhere in the repo.
- **Verification:** Verified as the current state (direct comparison of
  the type files and schema files); reasoning is unconfirmed.
- **Risk this creates:** a future edit to one union without the other
  would compile fine (Drizzle's `text()` accepts any string) and only
  fail at runtime/in the database — see `ARCHITECTURE.md`'s "Major
  architectural risks" and `SECURITY.md`.

### DEC-009 — `zod` and `resend` are installed but unused

- **Decision (as observed):** Both packages are declared dependencies
  in `package.json` with zero import/usage anywhere in `src/`.
- **Reasoning:** **Inferred** — most likely these are intended for
  future work (runtime validation; email digest sending, matching the
  `profiles.emailDigestEnabled` column and the `daily-brief` cron in
  `vercel.json`) that simply hasn't been written yet. Nothing in the
  repo confirms this beyond circumstantial fit.
- **Verification:** Verified that they're unused (repo-wide search,
  zero matches for `from "zod"` or `from "resend"` outside
  `package.json`/`package-lock.json`); reasoning for keeping them
  installed unconfirmed.

### DEC-010 — App Router file conventions used for all generated images
(icons, OG image, PWA icons) instead of static files in `public/`

- **Decision:** `icon.tsx`, `apple-icon.tsx`, `opengraph-image.tsx`, and
  `pwa-icon/{192,512}/route.tsx` all use `next/og`'s `ImageResponse` to
  render JSX-as-PNG at request time, rather than shipping static image
  files. `public/` is entirely empty.
- **Reasoning:** **Inferred** — likely to keep the brand mark defined
  once (as SVG-shaped JSX matching `components/brand/Mark.tsx`'s
  geometry) rather than exporting and maintaining multiple static PNG
  sizes by hand. Not confirmed by any comment.
- **Verification:** Verified as the current state; reasoning inferred.
