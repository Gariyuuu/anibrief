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
        // Per-id tab routes (characters/staff/relations/statistics/news/music)
        // multiply the crawlable surface of every single anime/manga id
        // several times over for near-duplicate content of low standalone
        // SEO value — keep only the main /anime/[id] and /manga/[id]
        // overview pages indexable.
        "/anime/*/characters",
        "/anime/*/staff",
        "/anime/*/relations",
        "/anime/*/statistics",
        "/anime/*/news",
        "/anime/*/music",
        "/manga/*/characters",
        "/manga/*/relations",
        "/manga/*/news",
      ],
    },
  };
}
