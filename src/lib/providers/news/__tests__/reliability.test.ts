import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyReliability, looksLikeRumor } from "@/lib/providers/news/reliability";

test("classifyReliability recognizes known outlets case-insensitively", () => {
  assert.equal(classifyReliability("Anime News Network"), "reputable");
  assert.equal(classifyReliability("anime news network"), "reputable");
});

test("classifyReliability defaults unknown sources to unverified", () => {
  assert.equal(classifyReliability("Random Anonymous Blog"), "unverified");
});

test("looksLikeRumor flags common rumor language", () => {
  assert.equal(looksLikeRumor("Sequel reportedly in production, sources say"), true);
  assert.equal(looksLikeRumor("Studio officially announces sequel"), false);
});
