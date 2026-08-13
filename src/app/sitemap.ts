import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://anibrief.vercel.app";

// Only the bounded, genuinely-cacheable browse pages — matches robots.ts's disallow
// list exactly. Never add /anime/*, /manga/*, /people/*, /characters/* here: that
// unbounded AniList id space is what drove the render-cost incident documented in
// ANIBRIEF_VERCEL_COST_AUDIT.md. See robots.ts's comment for the full rationale.
const PUBLIC_PATHS = [
  "",
  "/airing",
  "/anime",
  "/manga",
  "/people",
  "/discover",
  "/seasonal",
  "/calendar",
  "/music",
  "/news",
  "/daily-brief",
  "/daily-brief/archive",
  "/whats-new",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.6,
  }));
}
