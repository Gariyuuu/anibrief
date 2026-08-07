import "server-only";
import { logger } from "@/lib/utils/logger";
import { withRetry } from "@/lib/utils/retry";
import { getAppAccessToken, spotifyCredentialsConfigured } from "@/lib/providers/spotify/client";
import type { SpotifyCuratedFeed, SpotifyPlaylistInfo, SpotifyTrack } from "@/lib/types/music";

const API_BASE = "https://api.spotify.com/v1";

interface RawSpotifyArtist {
  name: string;
}
interface RawSpotifyImage {
  url: string;
}
interface RawSpotifyTrack {
  id: string;
  uri: string;
  name: string;
  artists: RawSpotifyArtist[];
  album: { images: RawSpotifyImage[] };
  external_urls: { spotify: string };
  preview_url: string | null;
  type?: string;
}
interface RawSpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  owner: { display_name: string | null };
  images: RawSpotifyImage[] | null;
  external_urls: { spotify: string };
  // Spotify's search endpoint names this field "items" (not "tracks") on the
  // simplified playlist objects it returns — confirmed against a live
  // response; using "tracks" here (an easy assumption from older docs/other
  // Spotify object shapes) silently threw inside mapPlaylist() and made
  // every playlist search look empty.
  items: { total: number };
}

function mapTrack(raw: RawSpotifyTrack): SpotifyTrack {
  return {
    id: raw.id,
    uri: raw.uri,
    title: raw.name,
    artists: raw.artists.map((a) => a.name),
    albumArt: raw.album.images[0]?.url ?? null,
    externalUrl: raw.external_urls.spotify,
    previewUrl: raw.preview_url,
  };
}

function mapPlaylist(raw: RawSpotifyPlaylist): SpotifyPlaylistInfo {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    ownerName: raw.owner.display_name ?? "Spotify user",
    imageUrl: raw.images?.[0]?.url ?? null,
    externalUrl: raw.external_urls.spotify,
    trackCount: raw.items.total,
    followers: null, // populated later by getCuratedFeed once a follow-up lookup runs, not available on search results
  };
}

async function authedFetch(url: URL): Promise<Response | null> {
  const token = await getAppAccessToken();
  if (!token) return null;
  return withRetry(() =>
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    })
  );
}

// Spotify's /v1/search endpoint documents `limit` up to 50, but this app's
// tier (Client Credentials, not Extended Quota Mode) actually rejects any
// limit above 10 with a 400 "Invalid limit" — confirmed empirically (11+
// fails, 10 succeeds) rather than assumed from docs. Paginating via
// `offset` in steps of 10 still works, so every search goes through this
// helper instead of requesting more than 10 at a time.
const SPOTIFY_MAX_PAGE_SIZE = 10;

async function paginatedSearch<TRaw, TMapped>(
  type: "track" | "playlist",
  query: string,
  desiredTotal: number,
  extractItems: (json: unknown) => (TRaw | null)[] | undefined,
  mapItem: (raw: TRaw) => TMapped
): Promise<TMapped[]> {
  const results: TMapped[] = [];
  let offset = 0;

  while (results.length < desiredTotal) {
    const url = new URL(`${API_BASE}/search`);
    url.searchParams.set("q", query);
    url.searchParams.set("type", type);
    url.searchParams.set("limit", String(SPOTIFY_MAX_PAGE_SIZE));
    url.searchParams.set("offset", String(offset));

    const res = await authedFetch(url);
    if (!res || !res.ok) throw new Error(`Spotify ${type} search failed: ${res?.status ?? "no token"}`);
    const json = await res.json();
    const items = (extractItems(json) ?? []).filter((i): i is TRaw => i != null);
    if (items.length === 0) break; // no more results

    results.push(...items.map(mapItem));
    offset += SPOTIFY_MAX_PAGE_SIZE;
    if (items.length < SPOTIFY_MAX_PAGE_SIZE) break; // last page
  }

  return results.slice(0, desiredTotal);
}

/**
 * Real Spotify Web API client, gated on SPOTIFY_CLIENT_ID/SPOTIFY_CLIENT_SECRET
 * (Client Credentials flow — see client.ts). Every method here reads public
 * data only (search, playlist contents) and never throws — failures are
 * logged and callers get `[]`/`null` so the UI can render an honest empty
 * state instead of crashing, matching every other provider in this repo.
 */
export const SpotifyProvider = {
  get configured() {
    return spotifyCredentialsConfigured();
  },

  async searchTracks(query: string, limit = 10): Promise<SpotifyTrack[]> {
    if (!this.configured) {
      logger.info("SpotifyProvider.searchTracks skipped: SPOTIFY_CLIENT_ID/SECRET not set");
      return [];
    }
    try {
      return await paginatedSearch<RawSpotifyTrack, SpotifyTrack>(
        "track",
        query,
        limit,
        (json) => (json as { tracks?: { items: (RawSpotifyTrack | null)[] } }).tracks?.items,
        mapTrack
      );
    } catch (error) {
      logger.error("SpotifyProvider.searchTracks failed", { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  },

  async searchPlaylists(query: string, limit = 10): Promise<SpotifyPlaylistInfo[]> {
    if (!this.configured) {
      logger.info("SpotifyProvider.searchPlaylists skipped: SPOTIFY_CLIENT_ID/SECRET not set");
      return [];
    }
    try {
      // Spotify's search occasionally returns null entries in the playlists array; paginatedSearch filters them.
      return await paginatedSearch<RawSpotifyPlaylist, SpotifyPlaylistInfo>(
        "playlist",
        query,
        limit,
        (json) => (json as { playlists?: { items: (RawSpotifyPlaylist | null)[] } }).playlists?.items,
        mapPlaylist
      );
    } catch (error) {
      logger.error("SpotifyProvider.searchPlaylists failed", { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  },

  async getPlaylistTracks(playlistId: string, limit = 100): Promise<SpotifyTrack[]> {
    if (!this.configured) {
      logger.info("SpotifyProvider.getPlaylistTracks skipped: SPOTIFY_CLIENT_ID/SECRET not set");
      return [];
    }
    try {
      const url = new URL(`${API_BASE}/playlists/${playlistId}/tracks`);
      // Spotify caps `limit` at 100 per request; this UI doesn't currently paginate further.
      url.searchParams.set("limit", String(Math.min(limit, 100)));
      url.searchParams.set(
        "fields",
        "items(track(id,uri,name,type,artists(name),album(images),external_urls,preview_url))"
      );

      const res = await authedFetch(url);
      if (!res || !res.ok) throw new Error(`Spotify playlist tracks fetch failed: ${res?.status ?? "no token"}`);
      const json = (await res.json()) as { items: { track: RawSpotifyTrack | null }[] };
      return json.items
        .map((item) => item.track)
        .filter((t): t is RawSpotifyTrack => t != null && t.type === "track")
        .map(mapTrack);
    } catch (error) {
      logger.error("SpotifyProvider.getPlaylistTracks failed", { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  },

  /**
   * Real follower count for one playlist (not exposed on search's simplified
   * playlist objects — needs a separate lookup per playlist). Returns null
   * on failure so callers can fall back rather than crash.
   */
  async getPlaylistFollowers(playlistId: string): Promise<number | null> {
    if (!this.configured) return null;
    try {
      const url = new URL(`${API_BASE}/playlists/${playlistId}`);
      url.searchParams.set("fields", "followers.total");
      const res = await authedFetch(url);
      if (!res || !res.ok) throw new Error(`Spotify playlist lookup failed: ${res?.status ?? "no token"}`);
      const json = (await res.json()) as { followers?: { total: number } };
      return json.followers?.total ?? null;
    } catch (error) {
      logger.error("SpotifyProvider.getPlaylistFollowers failed", {
        playlistId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  },

/**
   * Real anime-music tracks matching `query`, via direct track search —
   * plus, best-effort, a link to a genuinely well-followed matching
   * playlist for browsing.
   *
   * IMPORTANT (found and fixed 2026-08-07): this used to fetch a curator
   * playlist's tracklist via `GET /playlists/{id}/tracks`. That endpoint
   * returns 403 Forbidden under a Client Credentials (app-only) token as a
   * current Spotify API policy — confirmed against Spotify's OWN official
   * "Today's Top Hits" playlist, so it's not specific to any one playlist,
   * it's a blanket restriction for apps without "Extended Quota Mode"
   * approval. `getPlaylistTracks` (above) is kept intact and correct for
   * when either this app gets that approval, or a signed-in user's own
   * OAuth token (see oauth.ts) is threaded through here instead of the app
   * token — either would lift the restriction. Until then, this method
   * gets real track results from `/v1/search?type=track` (which Client
   * Credentials CAN access), ranked by Spotify's own search relevance —
   * an honest signal (it's literally what Spotify's search returns as the
   * best match for the query), not a fabricated popularity score.
   */
  async getCuratedFeed(query: string, trackLimit = 50): Promise<SpotifyCuratedFeed | null> {
    if (!this.configured) {
      logger.info("SpotifyProvider.getCuratedFeed skipped: SPOTIFY_CLIENT_ID/SECRET not set");
      return null;
    }

    const tracks = await this.searchTracks(query, trackLimit);
    if (tracks.length === 0) return null;

    // Best-effort playlist reference for "browse the full playlist" — real
    // playlist search + real follower-count ranking both still work fine
    // under Client Credentials; only the /tracks sub-resource is blocked.
    const candidates = await this.searchPlaylists(query, 5);
    let playlist: SpotifyPlaylistInfo | null = null;
    if (candidates.length > 0) {
      const withFollowers = await Promise.all(
        candidates.map(async (p) => ({ playlist: p, followers: await this.getPlaylistFollowers(p.id) }))
      );
      const ranked = withFollowers.filter((p) => p.followers != null);
      const winner =
        ranked.length > 0
          ? ranked.reduce((a, b) => (b.followers! > a.followers! ? b : a))
          : { playlist: candidates[0], followers: null };
      playlist = { ...winner.playlist, followers: winner.followers };
    }

    return { playlist, tracks };
  },
};
