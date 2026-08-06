/**
 * AniList's fixed genre list, verified live against `GenreCollection` on
 * AniList's GraphQL schema. "Hentai" is intentionally excluded — every
 * media query in this app passes `isAdult: false`. Shared by Discover's
 * genre explorer and Settings' content-preferences chips so the two never
 * drift out of sync.
 */
export const ANILIST_GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Ecchi",
  "Fantasy",
  "Horror",
  "Mahou Shoujo",
  "Mecha",
  "Music",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
] as const;
