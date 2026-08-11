import type { MetadataRoute } from "next";

// No sitemap is declared here on purpose: a sitemap enumerating every
// AniList anime/manga/character/staff id would hand crawlers exactly the
// kind of exhaustive id list that drove the image/render cost incident this
// file exists to prevent. Discovery stays link-based, which naturally caps
// how deep a well-behaved crawler goes.
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
  };
}
