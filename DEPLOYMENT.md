# Deployment

AniBrief targets **Vercel** (same as its sibling MarketBrief project), with **Clerk** for auth
and **Neon** for the database.

## 1. Create the Vercel project

```bash
npm install -g vercel   # if you don't already have it
vercel login
vercel link              # run from the anibrief/ directory
```

## 2. Provision Clerk

If you haven't already (see `CONTRIBUTING.md`/`clerk-setup`):

```bash
clerk init --framework next -y
```

This creates a Clerk application and writes `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` /
`CLERK_SECRET_KEY` to `.env.local` for local dev. For production, either promote that same
Clerk app to production mode in the Clerk Dashboard, or create a separate production app —
either way, add its keys to Vercel (step 4).

## 3. Provision Neon (optional but recommended)

Two paths:

- **Via Vercel (simplest if the project is already linked):** Project → Storage tab → Create
  Database → "Postgres" (powered by Neon). This automatically sets `DATABASE_URL` in your
  Vercel environment variables.
- **Directly via Neon:** create a project at https://neon.tech, copy its connection string into
  `DATABASE_URL`.

Then apply the schema (see `DATABASE.md`):

```bash
DATABASE_URL="<your-connection-string>" npm run db:push
```

Skipping this step is fine — the app still deploys and runs; personalization features degrade
to a clear "not configured" state instead of erroring (see `ENVIRONMENT_VARIABLES.md`).

## 4. Set environment variables

Add every variable you want live from `.env.example` (see `ENVIRONMENT_VARIABLES.md` for what
each one unlocks):

```bash
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
vercel env add CLERK_SECRET_KEY production
vercel env add DATABASE_URL production
vercel env add ADMIN_USER_IDS production
vercel env add CRON_SECRET production
vercel env add NEXT_PUBLIC_APP_URL production   # e.g. https://your-app.vercel.app
# Optional:
vercel env add YOUTUBE_API_KEY production
vercel env add AI_PROVIDER production
vercel env add ANTHROPIC_API_KEY production   # or OPENAI_API_KEY
```

## 5. Deploy

```bash
vercel --prod
```

`vercel.json` already registers every scheduled job (airing/news/seasonal refresh, birthdays,
trend snapshots, daily-brief pre-generation, notification dispatch) — Vercel Cron picks them up
automatically on deploy and sends `CRON_SECRET` as a Bearer token to each `/api/cron/*` route.

## Vercel plan note: Cron frequency

`vercel.json`'s 7 scheduled jobs currently run **once daily, staggered across the day**
(`birthdays` 00:00 UTC, `refresh-airing` 01:00, `refresh-news` 03:00, `refresh-seasonal` 05:00,
`notifications` 09:00, `trend-snapshot` 12:00, `daily-brief` 13:00) — this is what's actually
live in production. **Vercel's free Hobby plan restricts cron jobs to a maximum of once per
day**, so this schedule was deliberately chosen to deploy cleanly on Hobby; the original design
intent (airing/news refreshed every 20–30 minutes, notifications every 30) needs a **Pro** plan.
If you upgrade, restore the tighter schedule in `vercel.json` — the routes themselves work at
any frequency (each has its own idempotency lock), this is purely a Vercel plan limit.

## 6. New-project checklist (Vercel-specific gotchas)

- New Vercel projects sometimes default to an SSO/Vercel-auth wall in front of the deployment —
  disable that in Project Settings → Deployment Protection if you want the app publicly
  reachable.
- Confirm the production URL matches `NEXT_PUBLIC_APP_URL` (used in share links, email links,
  and Open Graph metadata) — mismatches don't break the app, but share links will point at the
  wrong host.
- Clerk's dashboard needs your production domain added under its instance settings before
  sign-in will work on the live URL (dev-mode Clerk apps only trust localhost + their own
  `*.clerk.accounts.dev` preview domain).

## Post-deploy verification

1. Load `/` — the Home dashboard should render live AniList data (today's episode count,
   trending titles) even with zero other env vars set.
2. Load `/sign-in` and complete a real sign-up — confirms Clerk is wired correctly.
3. Add a title to My List while signed in — confirms `DATABASE_URL` and the server actions work
   end-to-end (skip this check if you intentionally deployed without a database).
4. Load `/admin` signed in as an `ADMIN_USER_IDS` account — confirms admin gating.
5. `curl -H "Authorization: Bearer $CRON_SECRET" https://<your-url>/api/cron/daily-brief` —
   confirms the scheduled jobs are reachable and authorized correctly ahead of their first
   real Vercel Cron trigger.
