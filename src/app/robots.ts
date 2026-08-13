import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://anibrief.vercel.app";

// sitemap.ts intentionally lists ONLY the bounded browse pages below (13 URLs) — never
// the AniList id space. That distinction, not "no sitemap at all," is what actually
// prevents the render-cost incident this file was written to guard against: a crawler
// enumerating every anime/manga/character/staff id, each a guaranteed cache-miss. See
// ANIBRIEF_VERCEL_COST_AUDIT.md and sitemap.ts's own comment for the full rationale.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin",
        "/my-list",
        "/profile",
        "/settings",
        "/alerts",
        // Per-id detail pages (and all their tab subroutes) sit behind an
        // effectively unbounded AniList id space — tens of thousands of
        // anime/manga/characters/staff, each with unique art. A crawler
        // walking these mints a guaranteed cache-miss, AniList-hitting
        // render for every previously-unseen id it reaches (this drove a
        // real cost incident — see ANIBRIEF_VERCEL_COST_AUDIT.md). Blocking
        // the whole `/anime/*`, `/manga/*`, `/people/*`, `/characters/*`
        // subtrees (not just the tabs) is what actually caps that cost; the
        // bounded, genuinely-cacheable browse/list pages below stay
        // crawlable (`/anime`, `/manga`, `/people`, `/discover`,
        // `/seasonal`, `/news`, `/airing`, `/calendar`, `/music`, `/`).
        "/anime/*",
        "/manga/*",
        "/people/*",
        "/characters/*",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
