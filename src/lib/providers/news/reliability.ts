// Heuristic allowlist of established anime/manga/entertainment news outlets.
// Anything not listed is still shown (Google News aggregates broadly) but
// ranks lower and isn't treated as a "confirmed" source for filtering.
const REPUTABLE_SOURCES = [
  "anime news network",
  "crunchyroll news",
  "myanimelist news",
  "anime corner",
  "otaku usa",
  "polygon",
  "ign",
  "the verge",
  "variety",
  "hollywood reporter",
  "comicbook.com",
  "siliconera",
  "anitrendz",
  "natalie",
  "oricon",
  "nhk",
  "kotaku",
  "gamesradar",
  "screen rant",
  "cbr",
  "sportskeeda",
  "gizmodo",
];

const RUMOR_KEYWORDS = [
  "reportedly",
  "rumor",
  "rumour",
  "sources say",
  "sources close to",
  "unconfirmed",
  "leaked",
  "leak suggests",
  "according to insiders",
  "allegedly",
];

export function classifyReliability(sourceName: string): "reputable" | "unverified" {
  const normalized = sourceName.trim().toLowerCase();
  return REPUTABLE_SOURCES.some((known) => normalized.includes(known)) ? "reputable" : "unverified";
}

export function reliabilityRank(sourceName: string): number {
  return classifyReliability(sourceName) === "reputable" ? 1 : 0;
}

export function looksLikeRumor(headline: string): boolean {
  const normalized = headline.toLowerCase();
  return RUMOR_KEYWORDS.some((kw) => normalized.includes(kw));
}
