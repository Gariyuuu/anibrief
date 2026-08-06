import type { NewsArticle, NewsCluster } from "@/lib/types/news";
import { jaccardSimilarity } from "@/lib/dedup/textSimilarity";
import { reliabilityRank } from "@/lib/providers/news/reliability";

const SIMILARITY_THRESHOLD = 0.55;
const TIME_WINDOW_MS = 72 * 60 * 60 * 1000;

const TRACKING_PARAMS = new Set(["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref", "fbclid", "gclid"]);

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    for (const param of TRACKING_PARAMS) parsed.searchParams.delete(param);
    parsed.searchParams.sort();
    return `${parsed.hostname.toLowerCase()}${parsed.pathname.replace(/\/$/, "")}?${parsed.searchParams.toString()}`;
  } catch {
    return url.trim().toLowerCase();
  }
}

function isSameStory(a: NewsArticle, b: NewsArticle): boolean {
  if (normalizeUrl(a.url) === normalizeUrl(b.url)) return true;
  const timeDiff = Math.abs(new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
  if (timeDiff > TIME_WINDOW_MS) return false;
  return jaccardSimilarity(a.headline, b.headline) >= SIMILARITY_THRESHOLD;
}

function pickHeadline(group: NewsArticle[]): NewsArticle {
  return [...group].sort((a, b) => {
    const rankDiff = reliabilityRank(b.publisher) - reliabilityRank(a.publisher);
    if (rankDiff !== 0) return rankDiff;
    return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
  })[0];
}

/** Groups articles covering the same underlying event (same URL, or a
 * near-identical headline within a 72-hour window) into clusters, so
 * multi-source coverage of one announcement reads as one story with all
 * original links preserved (spec §9). */
export function clusterNews(articles: NewsArticle[]): NewsCluster[] {
  const groups: NewsArticle[][] = [];

  for (const article of articles) {
    const existingGroup = groups.find((group) => group.some((member) => isSameStory(member, article)));
    if (existingGroup) {
      existingGroup.push(article);
    } else {
      groups.push([article]);
    }
  }

  return groups.map((group) => {
    const canonical = pickHeadline(group);
    const sorted = [...group].sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
    return {
      id: canonical.id,
      headline: canonical.headline,
      category: canonical.category,
      articles: [...group].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),
      firstSeenAt: sorted[0].publishedAt,
      lastUpdatedAt: sorted[sorted.length - 1].publishedAt,
    };
  });
}
