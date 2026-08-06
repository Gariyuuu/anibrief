# Environment Variables

See `.env.example` for the copy-pasteable version. This file explains what each variable
unlocks and what happens when it's left unset — every one of them is optional in the sense that
the app runs and renders real content without it; more variables just unlock more live data and
personalization.

| Variable | Required for | If unset |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Sign-in/sign-up, all personalization | The app still renders publicly, but sign-in is broken. In practice always set these — `clerk init` (see `clerk-setup`) provisions dev keys automatically. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `..._SIGN_UP_URL` / `..._SIGN_IN_FALLBACK_REDIRECT_URL` / `..._SIGN_UP_FALLBACK_REDIRECT_URL` | Clerk routing | Clerk's own defaults apply. |
| `DATABASE_URL` | Lists, favorites, follows, alerts, saved settings, briefing archive persistence | The whole public app (browse, search, news, airing, seasonal, daily brief) still works. Sign-in-gated mutation buttons show a clear "not configured" error instead of crashing; the daily-brief archive falls back to in-memory (non-persistent) storage. See `DATABASE.md`. |
| `ADMIN_USER_IDS` | `/admin` dashboard access | `/admin` redirects everyone away (except a profile with `isAdmin=true`, which nothing currently sets automatically). Find your Clerk user ID in the Clerk Dashboard → Users, then set this as a comma-separated list. |
| `MAL_CLIENT_ID`, `MAL_CLIENT_SECRET` | Official MyAnimeList API (ranking, list sync) | `MyAnimeListProvider` is a documented no-op; AniList already covers rankings/popularity. |
| `YOUTUBE_API_KEY` | Trailer/PV search | Trailer sections show an honest "not configured" state instead of guessing a video. |
| `AI_PROVIDER` + (`ANTHROPIC_API_KEY` or `OPENAI_API_KEY`) | AI-written Daily Brief executive summary | The summary falls back to a deterministic, fact-only template (no AI call) — see `src/lib/briefing/buildBriefing.ts`. |
| `ANTHROPIC_MODEL`, `OPENAI_MODEL` | Model override | Defaults to `claude-sonnet-5` / `gpt-4o-mini`. |
| `CRON_SECRET` | Protecting `/api/cron/*` from public triggering | Cron routes still run (useful for local testing) but log a warning; set this before deploying. Vercel Cron sends it automatically as a Bearer token once configured (see `vercel.json`). |
| `NEXT_PUBLIC_APP_URL` | Absolute share/email links, Open Graph metadata | Falls back to `http://localhost:3000`. |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Not currently used | Reserved for a future email-digest feature. The "Email" share action on the Daily Brief page currently uses a client-side `mailto:` link instead, which needs no key. |

## Where these are read

Every `process.env.*` read in this codebase lives inside a `server-only`-marked module (see
`src/lib/providers/*/index.ts`, `src/lib/ai/index.ts`, `src/lib/db/client.ts`) or a Server
Component/Route Handler/Server Action — never in a Client Component, so no secret ever reaches
the browser bundle. The only `NEXT_PUBLIC_*` variables (Clerk's publishable key and the app URL)
are, by Clerk's/Next's own convention, safe to expose client-side.
