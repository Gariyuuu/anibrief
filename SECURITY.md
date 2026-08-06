# SECURITY.md — Defensive Security Review

> Snapshot: 2026-08-06 05:59:28 MST. This is a **defensive read-only
> review** — no destructive testing, no exploit attempts, no fuzzing was
> performed against any endpoint or the (unconfigured) database.

## Authentication boundaries

Clerk (`@clerk/nextjs`) end-to-end: `src/proxy.ts` runs
`clerkMiddleware()` on all non-static routes; `ClerkProvider` wraps the
app; server actions call `auth()` directly. **Not independently
verified this session** — no dev server was started, so no real
sign-in flow was exercised, and the Clerk keys in `.env.local` were
never validated against Clerk's API (only their key *names* were
observed).

## Authorization boundaries

Binary only: signed-in vs. signed-out, enforced per-action via
`requireUser()`. **No role/permission system exists.**
`profiles.is_admin` is a schema column with zero code reading it —
there is no admin gate anywhere, meaning if an admin UI is ever built
without first wiring a real check, it would be fully open to any signed-in
user by default unless someone remembers to add the check.

## Protected routes

No route-level protection exists yet because no content routes exist
(see `FEATURES.md`). `src/proxy.ts`'s matcher runs Clerk's middleware
broadly but `clerkMiddleware()` with no explicit `auth.protect()` calls
does **not** itself block unauthenticated access to any route — it only
makes auth *state* available. Authorization is enforced entirely inside
server actions, not at the routing layer. **When pages are built, each
one that should require sign-in will need its own explicit check** (Next
doesn't currently error out for unauthenticated visitors on any route).

## Secret handling

- `.env.local` holds 6 Clerk-related values (1 secret:
  `CLERK_SECRET_KEY`; 5 client-exposed `NEXT_PUBLIC_*` values). This
  audit only ever read **redacted key names**, never values.
- `.gitignore` correctly ignores `.env*` (with a `!.env.example`
  exception for a file that doesn't currently exist).
- No hardcoded API keys, tokens, or credentials were found anywhere in
  `src/` during this review (every secret-consuming call reads from
  `process.env`).
- **No secrets were written into any of this audit's documentation
  files** — confirmed by construction (redacted-only reads) and by a
  final grep pass (see the audit's closing report).

## Environment variables — client-exposed vs. server-only

Client-exposed (`NEXT_PUBLIC_*`, bundled into client JS, visible to
anyone): `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (safe by design — Clerk
publishable keys are meant to be public), `NEXT_PUBLIC_CLERK_SIGN_IN_URL`,
`NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`,
`NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`, `NEXT_PUBLIC_APP_URL`.
Server-only (never bundled, every consuming module marked
`import "server-only"`): `CLERK_SECRET_KEY`, `DATABASE_URL`,
`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `YOUTUBE_API_KEY`,
`MAL_CLIENT_ID`. This split is correctly maintained everywhere it was
checked.

## Input validation

**Significant gap.** `zod` is an installed dependency with **zero
usages** anywhere in `src/`. Every server action and the one API route
(`/api/search`) trust their TypeScript-typed input at the boundary with
no runtime schema validation. In practice today the risk is low (no
client-facing form posts arbitrary JSON to these actions — inputs come
from typed component props), but this is a real gap the moment any
action becomes reachable from less-trusted input (e.g. a future public
API, a bulk-import feature, or if `getUserAnimeList(userId)`/similar
`userId`-parameter functions are ever exposed to caller-controlled
input — see below).

**Specific latent issue:** `getUserAnimeList(userId)`,
`getUserMangaList(userId)`, `getUserAlerts(userId)`,
`getUserNotifications(userId)`, `getUserFollows(userId)`, and
`getOrCreateProfile(userId)` all take a **caller-supplied `userId`**
rather than deriving it from the current session via `auth()`. None of
them currently have a UI caller, so there is no active exploit path
today — but the moment one of these is wired into a component without
also passing `auth()`'s own `userId` (or without an explicit
"does the caller's session match `userId`" check), it becomes an
insecure direct object reference (IDOR): any signed-in user could read
any other user's list/alerts/notifications/follows/profile by passing
their id. **Flag this for review before wiring any of these six
functions to UI.**

## Output encoding / XSS risk

No `dangerouslySetInnerHTML` found except the one, narrow,
non-user-controlled case: `layout.tsx`'s inline theme-init `<script>`,
whose content is a fixed template string with one interpolated value
(`defaultAccent`, a constant from `src/lib/theme.ts`, not user input) —
low risk. News article summaries/headlines (external, untrusted RSS
content) are rendered as plain React children (auto-escaped), not
`dangerouslySetInnerHTML` — correct. AniList `description` fields are
stripped of HTML tags in `mappers.ts` (`.replace(/<br\s*\/?>/g, "
").replace(/<[^>]+>/g, "")`) before being stored as plain strings —
reasonable mitigation, though it's a regex-based strip, not a proper
HTML sanitizer, so unusual/malformed tag syntax could theoretically slip
through (low severity, since it's rendered as a plain-text React child
either way, not injected as HTML).

## SQL injection risk

None found — 100% of DB access goes through Drizzle's query builder
(parameterized queries), no raw SQL string concatenation anywhere in
`src/`.

## CSRF protections

Relies on Next.js Server Actions' built-in CSRF protection (origin
checking on the action POST) — no custom CSRF token handling found, none
appears necessary given no traditional form posts exist.

## File upload risks

None — no file upload functionality exists anywhere in the repo.

## Webhook verification

None — no webhook endpoints exist (no Clerk webhook handler despite
Clerk being the auth provider; if user-lifecycle events are ever needed
server-side — e.g. to auto-create a `profiles` row — a
signature-verified webhook route would need to be added).

## Rate limiting

**None found anywhere** — not on `/api/search`, not on any server
action. The AniList/Jikan/YouTube provider layer self-throttles
*outbound* calls to respect those services' own rate limits, but there
is nothing preventing a client from hammering `/api/search` (or, once
built, any future public route) with requests. Low risk today given
minimal surface area; worth adding before any public deploy.

## Admin access

No admin surface exists (see "Authorization boundaries" above and
`FEATURES.md`'s "Admin surface" entry) — nothing to review yet, but
flagged so a future admin build starts with a real permission check
from day one rather than retrofitting one.

## Database policies

No RLS (Neon accessed only via server-side Drizzle, never a
client-exposed connection) — see `DATABASE.md`. Authorization is
100% application-level (`requireUser()` in each server action). This
means **a bug in any single server action's auth check is a full
bypass for that table** — there is no database-level backstop.

## Logging of sensitive data

`src/lib/utils/logger.ts` logs structured JSON including an `error`
message field on failures. Reviewed call sites do not log full request
bodies, tokens, or user PII — errors are logged as
`error instanceof Error ? error.message : String(error)`, which is
reasonably safe, though a sufficiently detailed underlying error message
(e.g. from a DB driver) could theoretically leak connection-string
fragments in an extreme case — not observed in practice, since
`DATABASE_URL` is unset and no such error was triggered this session.

## Dependency concerns

- `@anthropic-ai/sdk`, `openai`, `@clerk/nextjs`,
  `@neondatabase/serverless`, `drizzle-orm` are all recent-looking
  major/minor versions per `package.json` — no way to check for known
  CVEs without running `npm audit` against a network, which was not
  done this session (out of scope for a read-only audit, and would
  require network access this environment may not have available for
  that purpose).
- `resend` and `zod` are installed but unused — unused dependencies
  aren't a direct security risk, but they do expand the supply-chain
  surface for no current benefit.

## Production security gaps (headline list)

1. No rate limiting anywhere.
2. No runtime input validation (`zod` installed, unused).
3. IDOR-shaped `userId`-parameter functions with no internal auth check
   (see "Input validation" above) — safe only because nothing calls them
   yet.
4. No webhook signature verification infrastructure (none needed yet,
   but will be if Clerk webhooks are added).
5. No admin permission check exists anywhere despite an `is_admin`
   column already being in the schema — a future admin page must not
   assume the column alone provides protection.
6. No `.env.example` — increases the chance of a future contributor
   mis-configuring or accidentally committing a real `.env.local`.

## Recommended fixes (priority order)

1. Add `auth()`-derived `userId` checks (or explicit "does this match
   the caller's session" comparisons) to the 6 caller-supplied-`userId`
   functions before wiring any of them to UI.
2. Add `zod` schemas to every server action's input and to
   `/api/search`'s query param.
3. Add basic rate limiting to `/api/search` before any public deploy
   (even a simple in-memory or edge-based limiter).
4. Add `.env.example` with placeholder values for every variable listed
   in `CLAUDE.md`'s environment table.
5. Before building any admin UI, add an explicit `is_admin`-checking
   helper (e.g. mirroring `requireUser()`) and use it from the very
   first admin route.
