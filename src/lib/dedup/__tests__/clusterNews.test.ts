import { test } from "node:test";
import assert from "node:assert/strict";
import { clusterNews } from "@/lib/dedup/clusterNews";
import type { NewsArticle } from "@/lib/types/news";

function article(overrides: Partial<NewsArticle>): NewsArticle {
  return {
    id: Math.random().toString(36).slice(2),
    headline: "Studio announces new anime adaptation",
    publisher: "Anime News Network",
    publishedAt: new Date().toISOString(),
    url: `https://example.com/${Math.random()}`,
    image: null,
    category: "anime",
    summary: "",
    isRumor: false,
    relatedTitles: [],
    clusterId: null,
    ...overrides,
  };
}

test("clusterNews groups near-identical headlines from different sources into one cluster", () => {
  const articles = [
    article({ headline: "Studio X announces new anime adaptation of Y", publisher: "Anime News Network" }),
    article({ headline: "Studio X reveals new anime adaptation of Y", publisher: "Otaku USA" }),
    article({ headline: "Completely unrelated voice actor casting news", publisher: "Siliconera" }),
  ];

  const clusters = clusterNews(articles);
  assert.equal(clusters.length, 2);
  const bigCluster = clusters.find((c) => c.articles.length > 1);
  assert.ok(bigCluster, "expected one multi-source cluster");
  assert.equal(bigCluster!.articles.length, 2);
});

test("clusterNews treats an exact-duplicate URL as the same story even with a different headline case", () => {
  const url = "https://example.com/story-1?utm_source=twitter";
  const articles = [
    article({ url, headline: "Headline A" }),
    article({ url: "https://example.com/story-1", headline: "Headline A (updated)" }),
  ];
  const clusters = clusterNews(articles);
  assert.equal(clusters.length, 1);
});

test("clusterNews prefers a reputable source as the cluster's canonical id/headline", () => {
  const blogPost = article({
    headline: "Anime studio confirms new sequel is in production",
    publisher: "Random Blog",
    isRumor: true,
  });
  const reportedStory = article({
    headline: "Anime studio confirms new sequel is in production",
    publisher: "Anime News Network",
  });

  const clusters = clusterNews([blogPost, reportedStory]);
  assert.equal(clusters.length, 1);
  // The cluster's identifying id/headline should come from pickHeadline()'s
  // reputable-source choice, regardless of which article was inserted first
  // or which has the (near-identical) later timestamp.
  assert.equal(clusters[0].id, reportedStory.id);
  assert.equal(clusters[0].articles.length, 2);
});
