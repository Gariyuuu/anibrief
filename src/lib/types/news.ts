export type NewsCategory =
  | "anime"
  | "manga"
  | "music"
  | "industry"
  | "streaming"
  | "games"
  | "movies"
  | "people"
  | "rumor";

export interface NewsArticle {
  id: string;
  headline: string;
  publisher: string;
  publishedAt: string; // ISO
  url: string;
  image: string | null;
  category: NewsCategory;
  summary: string;
  isRumor: boolean;
  relatedTitles: string[];
  clusterId: string | null;
}

export interface NewsCluster {
  id: string;
  headline: string;
  category: NewsCategory;
  articles: NewsArticle[];
  firstSeenAt: string;
  lastUpdatedAt: string;
}
