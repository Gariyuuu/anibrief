import { test } from "node:test";
import assert from "node:assert/strict";
import { mapMedia } from "@/lib/providers/anilist/mappers";
import type { RawMedia } from "@/lib/providers/anilist/rawTypes";

function rawMedia(overrides: Partial<RawMedia> = {}): RawMedia {
  return {
    id: 16498,
    idMal: 16498,
    type: "ANIME",
    format: "TV",
    status: "FINISHED",
    title: { romaji: "Shingeki no Kyojin", english: "Attack on Titan", native: "進撃の巨人" },
    description: "Humanity fights back<br>against titans.",
    coverImage: { large: "https://example.com/cover.jpg", color: null },
    bannerImage: null,
    genres: ["Action", "Drama"],
    tags: [{ name: "Gore", isMediaSpoiler: false }, { name: "Final Boss Reveal", isMediaSpoiler: true }],
    studios: { nodes: [{ name: "Wit Studio" }] },
    episodes: 25,
    duration: 24,
    chapters: null,
    volumes: null,
    season: "SPRING",
    seasonYear: 2013,
    startDate: { year: 2013, month: 4, day: 7 },
    endDate: { year: 2013, month: 9, day: 29 },
    averageScore: 84,
    popularity: 500000,
    favourites: 90000,
    trailer: null,
    siteUrl: "https://anilist.co/anime/16498",
    source: "MANGA",
    nextAiringEpisode: null,
    externalLinks: [],
    relations: { edges: [] },
    ...overrides,
  };
}

test("mapMedia prefers english title, falls back through romaji/native", () => {
  const media = mapMedia(rawMedia());
  assert.equal(media.titles.preferred, "Attack on Titan");

  const noEnglish = mapMedia(rawMedia({ title: { romaji: "Foo", english: null, native: "バー" } }));
  assert.equal(noEnglish.titles.preferred, "Foo");

  const onlyNative = mapMedia(rawMedia({ title: { romaji: null, english: null, native: "バー" } }));
  assert.equal(onlyNative.titles.preferred, "バー");
});

test("mapMedia strips HTML from description", () => {
  const media = mapMedia(rawMedia());
  assert.ok(!media.description?.includes("<br>"));
  assert.ok(media.description?.includes("Humanity fights back"));
});

test("mapMedia filters out spoiler tags", () => {
  const media = mapMedia(rawMedia());
  assert.deepEqual(media.tags, ["Gore"]);
});

test("mapMedia builds a stable internal id namespaced by source", () => {
  const media = mapMedia(rawMedia());
  assert.equal(media.id, "anilist:16498");
  assert.equal(media.source, "anilist");
});

test("mapMedia carries the MAL external id when idMal is present", () => {
  const media = mapMedia(rawMedia());
  const malLink = media.externalIds.find((e) => e.source === "myanimelist");
  assert.ok(malLink);
  assert.equal(malLink!.sourceId, "16498");
});

test("mapMedia omits the MAL external id when idMal is null", () => {
  const media = mapMedia(rawMedia({ idMal: null }));
  assert.equal(media.externalIds.length, 1);
});
