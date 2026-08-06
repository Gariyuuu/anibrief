import { test } from "node:test";
import assert from "node:assert/strict";
import { jaccardSimilarity, normalizeText } from "@/lib/dedup/textSimilarity";

test("normalizeText lowercases and strips punctuation", () => {
  assert.equal(normalizeText("Attack on Titan: Season 4!"), "attack on titan season 4");
});

test("jaccardSimilarity is 1 for identical headlines", () => {
  assert.equal(jaccardSimilarity("Studio announces new anime", "Studio announces new anime"), 1);
});

test("jaccardSimilarity is high for near-duplicate headlines", () => {
  const score = jaccardSimilarity(
    "Crunchyroll announces new dub for Frieren season 2",
    "Crunchyroll reveals new dub cast for Frieren season 2"
  );
  assert.ok(score > 0.4, `expected similarity > 0.4, got ${score}`);
});

test("jaccardSimilarity is low for unrelated headlines", () => {
  const score = jaccardSimilarity("New manga volume ships next month", "Voice actor announces solo album");
  assert.ok(score < 0.2, `expected similarity < 0.2, got ${score}`);
});

test("jaccardSimilarity handles empty strings without throwing", () => {
  assert.equal(jaccardSimilarity("", "something"), 0);
});
