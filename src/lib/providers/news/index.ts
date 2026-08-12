import "server-only";
import Parser from "rss-parser";
import { createHash } from "node:crypto";
import { withRetry } from "@/lib/utils/retry";
import { classifyReliability, looksLikeRumor } from "@/lib/providers/news/reliability";
import { logger } from "@/lib/utils/logger";
import type { NewsArticle, NewsCategory } from "@/lib/types/news";

interface FeedItem {
  title?: string;
  link?: string;
  pubDate?: string;
  contentSnippet?: string;
  isoDate?: string;
}

const REVALIDATE_SECONDS = 172800; // 2 days
const parser = new Parser<unknown, FeedItem>();

// Source registry, stored here (not hardcoded per-call) so categories can be
// enabled/disabled/replaced without touching calling code, per spec §5. A
// future admin-managed table (see `data_sources` in the schema) can replace
// this in-code registry without changing the provider's public interface.
const CATEGORY_QUERIES: Record<Exclude<NewsCategory, "rumor">, string[]> = {
  anime: ["anime series announcement OR anime season", "anime episode reaction OR anime review"],
  manga: ["manga chapter OR manga volume", "manga series announcement"],
  music: ["anime opening theme OR anime ending theme", "anime soundtrack OR anime composer"],
  industry: ["anime studio OR anime production committee", "anime licensing OR anime distribution deal"],
  streaming: ["Crunchyroll OR anime streaming service", "anime dub release"],
  games: ["anime video game OR anime mobile game"],
  movies: ["anime movie release OR anime film"],
  people: ["voice actor anime OR seiyuu news", "anime director OR anime creator interview"],
};

function normalizeItem(item: FeedItem, category: NewsCategory): NewsArticle | null {
  if (!item.title || !item.link) return null;

  const separatorIndex = item.title.lastIndexOf(" - ");
  const headline = separatorIndex > 0 ? item.title.slice(0, separatorIndex) : item.title;
  const publisher = separatorIndex > 0 ? item.title.slice(separatorIndex + 3) : "Google News";
  const publishedAt = item.isoDate ?? (item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString());

  return {
    id: createHash("sha1").update(item.link).digest("hex").slice(0, 16),
    headline,
    publisher,
    publishedAt,
    url: item.link,
    image: null,
    category,
    summary: item.contentSnippet?.trim() ?? "",
    isRumor: looksLikeRumor(headline),
    relatedTitles: [],
    clusterId: null,
  };
}

async function fetchFeed(query: string): Promise<FeedItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const feed = await withRetry(async () => {
    const res = await fetch(url, {
      headers: { "User-Agent": "AniBriefBot/0.1 (+https://github.com)" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) throw new Error(`News RSS request failed: ${res.status} ${res.statusText}`);
    return parser.parseString(await res.text());
  });
  return feed.items ?? [];
}

export const NewsFeedProvider = {
  configured: true, // Google News RSS needs no key

  async fetchCategory(category: Exclude<NewsCategory, "rumor">, maxItems = 60): Promise<NewsArticle[]> {
    const queries = CATEGORY_QUERIES[category];
    try {
      const results = await Promise.all(queries.map((q) => fetchFeed(q)));
      const seen = new Set<string>();
      const articles: NewsArticle[] = [];
      for (const item of results.flat()) {
        const mapped = normalizeItem(item, category);
        if (!mapped || seen.has(mapped.url)) continue;
        seen.add(mapped.url);
        articles.push(mapped);
      }
      return articles
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, maxItems);
    } catch (error) {
      logger.error("NewsFeedProvider.fetchCategory failed", {
        category,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  },

  async fetchAll(maxPerCategory = 30): Promise<NewsArticle[]> {
    const categories = Object.keys(CATEGORY_QUERIES) as Exclude<NewsCategory, "rumor">[];
    const results = await Promise.all(categories.map((c) => this.fetchCategory(c, maxPerCategory)));
    return results.flat().sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  },

  async searchNews(query: string, maxItems = 40): Promise<NewsArticle[]> {
    try {
      const items = await fetchFeed(`${query} anime OR manga`);
      return items
        .map((item) => normalizeItem(item, "anime"))
        .filter((a): a is NewsArticle => a !== null)
        .slice(0, maxItems);
    } catch (error) {
      logger.error("NewsFeedProvider.searchNews failed", {
        query,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  },
};

export { classifyReliability };
