# SECURITY.md — Defensive Security Review

> Re-synced 2026-08-06 ~15:35 MST against the actual current git state (commit
> `1d1eef9`). This remains a **defensive, read-only review** — no destructive
> testing, no exploit attempts, no fuzzing, no live queries against the production
> or local database. The previous version of this file was written against a
> pre-deployment snapshot with no reachable pages and no admin surface; both have
> changed materially and are re-assessed below.

## Security headers — new section, previously never inventoried by any documentation pass

`next.config.ts`'s `headers()` sets, on every route: a Content-Security-Policy
scoped to exactly the hosts the app talks to (`'self'`, Clerk's domains, AniList,
Jikan, Google News, Google APIs, and — as of commit `91b23c4` — Cloudflare
Turnstile), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`, and
`Permissions-Policy: camera=(), microphone=(), geolocation=()`.

**This existed since the initial release but was omitted from every prior version
of this file** — a real gap in the previous documentation passes' coverage, not a
new addition to the app. It was surfaced this pass by investigating a real bug: a
separate, concurrent process fixed a production sign-up failure (commit `91b23c4`,
landed live during this very documentation pass) caused by the CSP not
allowlisting `challenges.cloudflare.com`, which Clerk's Cloudflare-Turnstile
bot-protection CAPTCHA loads its script/iframe from — the CSP was silently
blocking it for every visitor. This is a good-faith demonstration that the CSP is
real and enforced (a too-narrow policy actually broke a feature), not decorative
— but also a reminder that **a narrow CSP is a real deployment risk whenever a new
third-party script/iframe host is introduced** (e.g. by upgrading Clerk, adding a
new provider, etc.) and nothing currently tests for that class of regression
automatically. See `TASKS.md` T-107.

## Authentication boundaries

Clerk (`@clerk/nextjs`) end-to-end: `src/proxy.ts` runs `clerkMiddleware()` on all
non-static routes; `ClerkProvider` wraps the app; server actions call `auth()`
directly. **Not independently re-verified in a browser this pass** — no dev server
was started, no real sign-in flow was exercised. The app is, however, confirmed
deployed and live (https://anibrief.vercel.app), which is a meaningfully stronger
signal than the previous pass had (an unexercised, undeployed scaffold).

## Authorization boundaries — materially changed since the previous pass

**A real admin auth-bypass bug existed in production and was fixed in commit
`1d1eef9`.** `/admin` originally relied solely on a `redirect()` inside its
Server-Component layout to send non-admins away. In this Next.js version, a
sibling page's render could apparently still be serialized into the response
before that `redirect()` took effect (an RSC-streaming timing quirk, per the
in-code comment and `CHANGELOG.md`'s account of it) — meaning a signed-out request
could, under that timing window, receive the full rendered admin dashboard
(provider health, sync-job log) with a `200` instead of being redirected.

**The fix:** `src/proxy.ts` (middleware) now independently blocks `/admin(.*)` for
any request where `isAdminUser(userId)` is false, **before any rendering starts**.
The layout-level `redirect()` in `src/app/admin/layout.tsx` remains as
defense-in-depth for client-side navigations. Both were re-read directly this pass
and confirmed to use the same `isAdminUser()` check
(`src/lib/utils/adminAccess.ts`), so there's no drift between the two gates today.

Beyond admin: still binary signed-in vs. signed-out for everything else, enforced
per-action via `requireUser()`. `profiles.isAdmin` is now a real, read gate (not
dead schema, as the previous pass found) — it's one of two paths `isAdminUser()`
checks, alongside the `ADMIN_USER_IDS` env allowlist.

## Protected routes

`/admin/*` is now genuinely protected (see above) — this is new since the previous
pass, which found no protected routes existed at all because no content routes
existed. Every other route in `nav.ts` is intentionally public (browsing, search,
news, daily brief) per the product's own design — personalization actions
(add-to-list, alerts, follows, profile writes) are gated inside the server action
itself, not at the routing layer, which is a deliberate, documented pattern (see
`ARCHITECTURE.md`), not a gap.

## Secret handling

- `.env.local` in this local environment holds Clerk keys (1 secret:
  `CLERK_SECRET_KEY`) **and now a real `DATABASE_URL`** plus the full set of
  Neon/Vercel-integration Postgres variables (`PGHOST`, `PGPASSWORD`,
  `POSTGRES_URL`, etc.) — this is new since the previous pass, which found only 6
  Clerk variables and no database configured at all. This pass only ever read
  **redacted variable names** (`grep -oE '^[A-Z_]+=' .env.local`), never values.
- `.gitignore` correctly ignores `.env*` with a `!.env.example` exception — and
  **`.env.example` now actually exists**, is comprehensive, and contains only
  placeholder values (re-verified this pass by reading the full file).
- No hardcoded API keys, tokens, or credentials found anywhere in `src/` this pass.
- **No secrets were written into any documentation file by this pass** — confirmed
  by construction (redacted-only reads of `.env.local`) and by a closing grep pass
  across every `.md` file in the repo root for secret-shaped strings
  (`sk-ant-...`, `sk_live_...`, `AIza...`, `postgres://user:pass@host/...` with a
  real-looking host, Clerk `user_...`/`pk_test_...`/`sk_test_...` ids) — zero
  matches beyond documented placeholders.

## Environment variables — client-exposed vs. server-only

Unchanged split from the previous pass, re-verified: client-exposed
(`NEXT_PUBLIC_*`): Clerk publishable key + routing overrides, `NEXT_PUBLIC_APP_URL`.
Server-only (every consuming module marked `import "server-only"` where
applicable): `CLERK_SECRET_KEY`, `DATABASE_URL`, `ANTHROPIC_API_KEY`,
`OPENAI_API_KEY`, `YOUTUBE_API_KEY`, `MAL_CLIENT_ID`, `MAL_CLIENT_SECRET`,
`ADMIN_USER_IDS`, `CRON_SECRET`, `RESEND_API_KEY`. This split is correctly
maintained everywhere checked this pass.

## Input validation

**Still a significant, unchanged gap.** `zod` remains an installed dependency with
**zero usages** anywhere in `src/` (re-verified: `grep -r 'from "zod"' src/` → no
matches). Every server action and every real API route (`/api/search`,
`/api/calendar/ics`, all 7 `/api/cron/*`) trust their input at the boundary with no
runtime schema validation. This is now a slightly higher-stakes gap than the
previous pass found it to be, because **these code paths are now live in
production and reachable from real UI**, not unreached scaffolding. See `TASKS.md`
T-101.

**The caller-supplied-`userId` pattern — status changed from "latent, zero
callers" to "latent, real callers, all currently correct":**
`getUserAnimeList(userId)`, `getUserMangaList(userId)`, `getUserAlerts(userId)`,
`getUserNotifications(userId)`, `getUserFollows(userId)`, `getUserReminders(userId)`,
and `getOrCreateProfile(userId)` all still take a **caller-supplied `userId`**
rather than deriving it from `auth()` internally. The previous pass flagged this as
a latent IDOR risk with zero active callers. **This pass re-checked every current
caller by reading the page source directly**
(`src/app/my-list/page.tsx`, `src/app/profile/page.tsx`, `src/app/alerts/page.tsx`,
`src/app/settings/page.tsx`, `GET /api/calendar/ics`) — every one of them passes the
current session's own `auth()`-derived `userId`, never a caller-controlled or
URL-derived one. **Still not an active vulnerability today, but the risk surface
grew from zero real call sites to several**, all of which are currently correct by
convention rather than by an enforced contract. Any new caller that gets this wrong
(e.g. a future admin "view any user's list" feature, or a route that reads `userId`
from a query param) would introduce a real IDOR. **Recommend addressing before
adding the next caller** — see `TASKS.md` T-103.

## Output encoding / XSS risk

Unchanged assessment from the previous pass, spot-re-verified: no
`dangerouslySetInnerHTML` found except the layout's fixed-template theme-init
script; AniList `description` HTML-stripping in `mappers.ts` is regex-based, not a
full sanitizer, but rendered as a plain-text React child either way (low severity,
unchanged finding).

## SQL injection risk

None found — 100% of DB access goes through Drizzle's query builder. Re-verified:
no raw SQL string concatenation found in the new files added since the previous
pass either (`admin.ts`, `calendarReminders.ts`, `listImport.ts`, the 7 cron
routes).

## CSRF protections

Relies on Next.js Server Actions' built-in CSRF protection. Unchanged.

## File upload risks

None — no file upload functionality exists. The CSV import feature
(`/settings/import`, new since the previous pass) accepts pasted/typed CSV text
via a client component, not a file upload — not independently re-verified whether
a `<input type="file">` exists anywhere in `ImportWizard.tsx`; if one does, it was
not flagged as a distinct risk this pass and should be checked before relying on
this line.

## Webhook verification

None — no webhook endpoints exist. Unchanged from the previous pass.

## Rate limiting

**Still none found anywhere** — not on `/api/search`, not on `/api/calendar/ics`,
not on any server action, not on the 7 cron routes beyond the optional
`CRON_SECRET` bearer check (which, when unset, explicitly allows unauthenticated
triggering — see `API_REFERENCE.md`). **This is now a higher-priority gap than the
previous pass found it to be**, since the app is deployed and publicly reachable
today, not an undeployed scaffold. See `TASKS.md` T-102.

## Admin access — materially changed since the previous pass

A real admin surface now exists (`/admin`), gated by two independent checks
(`proxy.ts` middleware + `admin/layout.tsx`), both using the same
`isAdminUser()` helper (`ADMIN_USER_IDS` env allowlist, falling back to
`profiles.isAdmin`). Every admin server action (`src/lib/actions/admin.ts`)
independently re-checks `requireAdmin()` rather than trusting the page-level gate
alone — correct, since Server Actions are directly callable regardless of which
page rendered the triggering button. All 4 admin actions write an audit-log row
(`admin_audit_logs`) via a shared `logAudit()` helper. **This closes the previous
pass's top-listed production security gap** ("No admin permission check exists
anywhere despite an `is_admin` column already being in the schema").

**In this local environment, `ADMIN_USER_IDS` is unset**, so `/admin` is
unreachable here unless a `profiles.isAdmin = true` row exists — not tested this
pass (would require a DB write).

## Database policies

No RLS (Neon accessed only via server-side Drizzle). Authorization is 100%
application-level. **Unchanged headline risk, now higher-stakes**: a bug in any
single server action's or route's auth check is a full bypass for that table, and
the schema is now pushed to a **real, live database** rather than an unprovisioned
one.

## Logging of sensitive data

Unchanged assessment: `src/lib/utils/logger.ts` logs structured JSON; reviewed
call sites (including the new cron/admin files) log
`error instanceof Error ? error.message : String(error)`, not full request bodies
or credentials. Not re-triggered against a live failure this pass.

## Dependency concerns

- Same package set as the previous pass (`@anthropic-ai/sdk`, `openai`,
  `@clerk/nextjs`, `@neondatabase/serverless`, `drizzle-orm`) — no `npm audit` run
  this pass (out of scope, requires network access this pass didn't exercise for
  that purpose).
- `resend` and `zod` remain installed and unused (re-verified).
- **New this pass:** `.claude/skills/{neon,neon-postgres}` and
  `.agents/skills/{neon,neon-postgres}` (skill packages, not application
  dependencies) were added in commit `1d1eef9` — not a runtime dependency-surface
  concern, but worth knowing they're present if auditing what's in the repo.

## Production security gaps (headline list, re-prioritized)

1. **No rate limiting anywhere** — higher priority now that the app is live and
   public (was theoretical in the previous pass; is real exposure now).
2. **No runtime input validation** (`zod` installed, unused) — same higher-priority
   reasoning.
3. **Caller-supplied-`userId` functions now have real callers** (all currently
   correct, but unenforced) — see "Input validation" above and `TASKS.md` T-103.
4. **`CRON_SECRET` is optional and, when unset, cron routes run unauthenticated**
   with only a log warning — confirm it's set in the production Vercel environment
   (not independently verified this pass; only this local environment's absence of
   it was confirmed).
5. No webhook signature verification infrastructure (none needed yet).
6. **Resolved since the previous pass:** admin permission check now exists and is
   independently re-verified this pass (see "Admin access" above) — was gap #5 in
   the previous version of this file.
7. **Resolved since the previous pass:** `.env.example` now exists with placeholder
   values — was gap #6 in the previous version of this file.
8. **No automated CSP/security-header regression coverage** — the sign-up CAPTCHA
   bug (commit `91b23c4`) is a real, concrete example of what happens without it.
   See "Security headers" above and `TASKS.md` T-107.

## Recommended fixes (priority order)

1. Add `auth()`-derived `userId` checks (or explicit ownership comparisons) to the
   7 caller-supplied-`userId` functions — see `TASKS.md` T-103.
2. Add `zod` schemas to every server action's input and to `/api/search`'s query
   param — see `TASKS.md` T-101.
3. Add rate limiting to `/api/search`, `/api/calendar/ics`, and the server actions
   — see `TASKS.md` T-102.
4. Confirm `CRON_SECRET` is actually set in the production Vercel environment (not
   verifiable from this local session).
5. Consider whether the CSV import path in `/settings/import` needs additional
   validation on row content before it reaches `commitImport` — not independently
   audited line-by-line this pass.
