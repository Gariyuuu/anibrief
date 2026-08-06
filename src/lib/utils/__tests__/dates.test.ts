import { test } from "node:test";
import assert from "node:assert/strict";
import { formatCountdown } from "@/lib/utils/dates";

test("formatCountdown reports 'airing now' once the time has passed", () => {
  assert.equal(formatCountdown(new Date(Date.now() - 1000).toISOString()), "airing now");
});

test("formatCountdown reports minutes for near-term airings", () => {
  const soon = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  assert.equal(formatCountdown(soon), "in 5m");
});

test("formatCountdown reports days+hours for far-out airings", () => {
  const later = new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString(); // 2d 2h
  assert.equal(formatCountdown(later), "in 2d 2h");
});
