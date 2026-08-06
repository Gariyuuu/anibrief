import { test } from "node:test";
import assert from "node:assert/strict";
import { adjacentSeason, currentSeason, seasonLabel } from "@/lib/utils/season";

test("currentSeason maps months to the right AniList season", () => {
  assert.deepEqual(currentSeason(new Date(Date.UTC(2026, 0, 15))), { season: "WINTER", year: 2026 });
  assert.deepEqual(currentSeason(new Date(Date.UTC(2026, 3, 15))), { season: "SPRING", year: 2026 });
  assert.deepEqual(currentSeason(new Date(Date.UTC(2026, 6, 15))), { season: "SUMMER", year: 2026 });
  assert.deepEqual(currentSeason(new Date(Date.UTC(2026, 9, 15))), { season: "FALL", year: 2026 });
});

test("currentSeason rolls December into next year's Winter", () => {
  assert.deepEqual(currentSeason(new Date(Date.UTC(2026, 11, 20))), { season: "WINTER", year: 2027 });
});

test("adjacentSeason steps forward and backward, rolling the year at the boundaries", () => {
  assert.deepEqual(adjacentSeason("FALL", 2026, 1), { season: "WINTER", year: 2027 });
  assert.deepEqual(adjacentSeason("WINTER", 2026, -1), { season: "FALL", year: 2025 });
  assert.deepEqual(adjacentSeason("SPRING", 2026, 1), { season: "SUMMER", year: 2026 });
});

test("seasonLabel title-cases the season name", () => {
  assert.equal(seasonLabel("WINTER", 2026), "Winter 2026");
});
