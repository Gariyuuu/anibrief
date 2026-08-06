# ROADMAP.md — Product Roadmap

> Re-synced 2026-08-06 ~15:35 MST against the actual current git state (commit
> `1d1eef9`). No time estimates are given anywhere below — none exist in the repo,
> and none are invented here. **The "Current milestone" and "Next milestone"
> sections below described work that has since fully shipped and deployed** (the
> home page, every detail route, `/my-list`) — corrected below; "MVP completion"
> is now largely met.

## MVP completion — status changed from "far from complete" to "substantially met"

- **Objective:** Home, News, Airing, Anime, Manga, My List, Alerts, Profile,
  Settings all have real pages; the 7 cron routes exist; `npm run lint` and
  `npm run typecheck` both pass; a real `DATABASE_URL` has been provisioned and the
  migration applied at least once.
- **Priority:** High.
- **Status:** **Met.** Every route in `nav.ts` (15 items) has a real page (34
  `page.tsx` files, 44 total build routes); all 7 cron routes exist and are
  idempotency-locked; `npm run lint`/`npm run typecheck`/`npm run test`/
  `npm run build` all pass clean; Neon has been provisioned via Vercel's
  integration and the schema pushed (per the `1d1eef9` commit message); the app is
  deployed and live at https://anibrief.vercel.app.
- **What's not yet independently confirmed:** a real browser smoke test of the
  core flows (browse → view → list → alert) has not been run by any AI session —
  see `TESTING.md`'s manual checklist. The build/route/test evidence is strong but
  is not the same claim as "verified working in a browser."
- **Definition of done:** every route in `nav.ts` resolves to a real page (met);
  core flows work signed-in (not independently browser-verified); `npm run build`
  succeeds (met); deployed and smoke-tested on Vercel (deployed — met; smoke-tested
  by an AI session — not yet).

## Post-MVP — most items below have shipped since the original snapshot; re-checked against current code

- **Seasonal/Discover browse pages** — **Done.** `/seasonal` (129 lines) and
  `/discover` (345 lines) both exist and call `AniListProvider.browse()`.
- **Calendar page** — **Done** for the episode/reminder scope. `/calendar` (105
  lines) exists, plus `GET /api/calendar/ics` export. The original note about
  no provider/query existing for non-episode event types (manga volumes, music
  releases as distinct calendar entries beyond birthdays) was not independently
  re-checked this pass — `src/lib/types/calendarEvent.ts`'s full type union vs.
  what `calendarEvents.ts` actually populates wasn't line-by-line re-verified, so
  treat that specific sub-claim as unconfirmed rather than resolved.
- **Wire `clusterNews` into the news feed** — **Done.** Called from
  `src/app/news/page.tsx` (re-verified this pass).
- **Wire `JikanProvider`/`YouTubeProvider`/`MusicProvider`** — **Partially done.**
  `YouTubeProvider`/`MusicProvider` now have real callers (the Music pages).
  `JikanProvider` has exactly one caller (the admin health check, which only
  reads `.configured`) — its actual ranking data still has zero consumers. See
  `TASKS.md` T-104.
- **Real MyAnimeList integration** (replace the stub) — **Still not done,
  unchanged.** Needs a registered MAL OAuth client. Priority: Low.
- **Admin surface** — **Done.** `/admin` is real, gated, and reads/writes 5 of
  the 7 admin schema tables (`feature_flags`, `announcement_banner`,
  `admin_audit_logs`, `sync_jobs` read, `notifications` write via the test-notify
  button) via real server actions. `data_sources`/`provider_health` tables are
  still effectively unused in favor of the live health-check approach
  `DATA_SOURCES.md` describes — not a gap, a documented design choice.

## Long-term ideas

No explicit long-term ideas are recorded anywhere in the repo (no
brainstorm doc, no far-future comments found beyond the `spec §NN`
references, which point to an external document this audit could not
locate). Nothing invented here.

## Optional improvements

- ~~Add `.env.example`~~ — **Done.** A real, comprehensive, placeholder-only
  `.env.example` exists (re-verified this pass).
- Add runtime validation (`zod`, already a dependency) to every server
  action's input — **still open**, see `TASKS.md` T-101.
- Sync theme/accent preference to `profiles` for signed-in users instead
  of `localStorage`-only — **still open**, not independently re-verified this
  pass whether `AppearanceForm.tsx` addresses this.
- Add a CI workflow (none found — no `.github/workflows/`) — **still open.**
- ~~`git init` this project on its own~~ — **Resolved differently than
  suggested**: `anibrief/` is now tracked with real commit history inside the
  parent `~/Projects` repo (2 commits on `main`), not via its own independent
  `.git`. This satisfies the underlying need (real `git log`/`git diff`/
  `git status`) without a separate repo.

## Out of scope

- Anything requiring the external `spec §NN` document this audit
  couldn't locate — no claims are made here about what it specifies
  beyond what's directly inferable from in-repo comments that cite it.
- Real payment/monetization — no trace of any payment integration
  anywhere in the repo.
