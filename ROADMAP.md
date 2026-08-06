# ROADMAP.md — Product Roadmap

> Snapshot: 2026-08-06 05:59:28 MST. No time estimates are given
> anywhere below — none exist in the repo, and none are invented here.

## Current milestone

**Reach a visitable home page.** Everything needed already exists in
code except the page itself.

- **Objective:** `src/app/page.tsx` renders the daily briefing (see
  `TASKS.md` T-002) using already-built components and data functions.
- **Priority:** High.
- **Status:** Not started.
- **Dependencies:** none blocking — works with zero configured env vars
  (falls back to template summary + in-memory briefing cache).
- **Difficulty:** Low — this is wiring, not new logic.
- **Risk:** Low.
- **Definition of done:** `/` loads in a browser without a runtime
  error and shows real AniList/news data (or their empty states).

## Next milestone

**A minimally-navigable app.** Home page reachable, plus at least one
detail route and one list-management route, so the command palette's
search results and the "Add to list"/"Remind me" buttons actually go
somewhere.

- **Objective:** `/anime/[id]`, `/manga/[id]`, `/my-list` pages.
- **Priority:** High.
- **Status:** Not started.
- **Dependencies:** Current milestone (establishes the page-authoring
  pattern); `DATABASE_URL` configured to exercise `/my-list`'s
  read/write path meaningfully (it degrades gracefully without one, but
  would show nothing).
- **Difficulty:** Medium — `/anime/[id]` needs to consume
  `AniListProvider.getMediaDetailRaw`/`getMediaById` and design a detail
  layout that doesn't exist yet in any component file.
- **Risk:** Low-medium (first "real" content page, sets patterns others
  will copy).
- **Definition of done:** a user can search → view a title → add it to
  their list, all without a 404 or thrown error, when signed in with a
  configured database.

## MVP completion

Based on `src/lib/nav.ts`'s declared 15 routes and the schema/provider
layer already built, a reasonable MVP bar (inferred from what's already
built, not from any written spec — the referenced `spec §NN` document
was not found in the repo):

- **Objective:** Home, News, Airing, Anime, Manga, My List, Alerts,
  Profile, Settings all have real pages; the 7 cron routes exist (or
  the unused ones are removed from `vercel.json`); `npm run lint` and
  `npm run typecheck` both pass; a real `DATABASE_URL` has been
  provisioned and the migration applied at least once.
- **Priority:** High (this is "the product exists and basically works").
- **Status:** Far from complete — roughly a third of the listed routes
  have any supporting UI at all, and none have a page.
- **Dependencies:** all of the above milestones.
- **Difficulty:** Medium-high in aggregate, though each individual page
  is low-medium given the existing provider/component/action layer.
- **Risk:** Medium — the biggest unknown is whether the AI/DB layers
  work against real credentials, since neither has been exercised yet.
- **Definition of done:** every route in `nav.ts` resolves to a real
  page (not a 404); core flows (browse → view → list → alert) work
  signed-in; `npm run build` succeeds; deployed and smoke-tested on
  Vercel.

## Post-MVP

- **Seasonal/Discover browse pages** — `AniListProvider.browse()`
  already supports the filtering needed; just needs UI.
  Priority: Medium. Status: Planned (provider ready, no UI).
- **Calendar page** — broader than episode airing (manga volumes, music
  releases, birthdays, user reminders per `CalendarEvent`'s type union)
  — no provider/query exists yet for the non-episode event types.
  Priority: Medium. Status: Planned (type exists, nothing else does).
- **Wire `clusterNews` into the news feed** so multi-source coverage of
  one story collapses into one card. Priority: Low-medium. Status:
  code exists, unused.
- **Wire `JikanProvider`/`YouTubeProvider`/`MusicProvider`** into
  relevant detail pages (MAL ranking badge, trailer embed, OP/ED
  section). Priority: Low-medium. Status: providers implemented, zero
  UI consumers.
- **Real MyAnimeList integration** (replace the stub) — needs a
  registered MAL OAuth client per the code's own comment. Priority:
  Low. Status: stub only.
- **Admin surface** (feature flags, announcement banner, audit log,
  provider health dashboard) — schema exists (7 tables), zero code
  reads/writes any of it. Priority: Low. Status: schema-only.

## Long-term ideas

No explicit long-term ideas are recorded anywhere in the repo (no
brainstorm doc, no far-future comments found beyond the `spec §NN`
references, which point to an external document this audit could not
locate). Nothing invented here.

## Optional improvements

- Add `.env.example` (referenced implicitly by `.gitignore`'s
  `!.env.example` exception, but the file itself doesn't exist).
- Add runtime validation (`zod`, already a dependency) to every server
  action's input.
- Sync theme/accent preference to `profiles` for signed-in users instead
  of `localStorage`-only.
- Add a CI workflow (none found — no `.github/workflows/`).
- `git init` this project on its own (currently has no independent git
  history at all — see `PROJECT_STATE.md`), or confirm the intent to
  keep relying on the parent `~/Projects` repo.

## Out of scope

- Anything requiring the external `spec §NN` document this audit
  couldn't locate — no claims are made here about what it specifies
  beyond what's directly inferable from in-repo comments that cite it.
- Real payment/monetization — no trace of any payment integration
  anywhere in the repo.
