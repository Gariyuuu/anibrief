import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Show, SignInButton } from "@clerk/nextjs";
import { CheckCircle2, Disc3, ExternalLink, ListMusic, LogIn, Music2, Sparkles, TrendingUp } from "lucide-react";
import { MusicProvider } from "@/lib/providers/music";
import { YouTubeProvider } from "@/lib/providers/youtube";
import { SpotifyProvider } from "@/lib/providers/spotify";
import { getSpotifyConnectionStatus } from "@/lib/actions/spotify";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { MusicRelease, SelectableTrack, ThemeType } from "@/lib/types/music";
import { currentSeason, seasonLabel } from "@/lib/utils/season";
import { youtubeVideoToSelectable, spotifyTrackToSelectable } from "@/lib/utils/musicSelection";
import { MusicSelectionProvider } from "@/components/music/MusicSelectionProvider";
import { SelectionBar } from "@/components/music/SelectionBar";
import { SelectableTrackCard } from "@/components/music/SelectableTrackCard";
import { SpotifyConnectionCard } from "@/components/music/SpotifyConnectionCard";

export const metadata: Metadata = { title: "Music" };
export const revalidate = 172800; // 2 days

const THEME_ORDER: ThemeType[] = ["opening", "ending", "insert", "ost", "character_song", "single", "album"];
const THEME_LABELS: Record<ThemeType, string> = {
  opening: "Openings",
  ending: "Endings",
  insert: "Insert songs",
  ost: "OST",
  character_song: "Character songs",
  single: "Singles",
  album: "Albums",
};

const SPOTIFY_ERROR_MESSAGES: Record<string, string> = {
  not_configured: "Spotify isn't configured for this deployment yet (SPOTIFY_CLIENT_ID/SPOTIFY_CLIENT_SECRET missing).",
  state_mismatch: "Spotify sign-in failed a security check — please try connecting again.",
  db_not_configured: "Spotify connections can't be saved yet — DATABASE_URL isn't configured for this deployment.",
  exchange_failed: "Spotify sign-in failed — please try connecting again.",
  access_denied: "Spotify connection was cancelled.",
};

function playlistSearchUrl(releases: MusicRelease[], limit = 5): string {
  const query = releases
    .slice(0, limit)
    .map((r) => `${r.title} ${r.artist}`)
    .join(" | ");
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function TrackGrid({ tracks }: { tracks: SelectableTrack[] }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {tracks.map((t) => (
        <SelectableTrackCard key={t.key} track={t} />
      ))}
    </div>
  );
}

export default async function MusicPage({
  searchParams,
}: {
  searchParams: Promise<{ spotify_connected?: string; spotify_error?: string }>;
}) {
  const params = await searchParams;
  const { userId } = await auth();

  const { season, year } = currentSeason();
  const seasonLbl = seasonLabel(season, year);
  const seasonQuery = `anime opening OR anime ending ${seasonLbl}`;
  const trendingQuery = "anime opening OR anime ending";

  const [releases, ytNewRaw, ytTrendingRaw, spotifyNewFeed, spotifyTopFeed, spotifyStatus] = await Promise.all([
    MusicProvider.getCuratedReleases(),
    YouTubeProvider.searchAnimeMusic({ query: seasonQuery, order: "date", maxResults: 12 }),
    YouTubeProvider.searchAnimeMusic({ query: trendingQuery, order: "viewCount", maxResults: 12 }),
    SpotifyProvider.getCuratedFeed(seasonQuery, 30),
    SpotifyProvider.getCuratedFeed(trendingQuery, 50),
    userId ? getSpotifyConnectionStatus(userId) : Promise.resolve({ connected: false, spotifyUserId: null }),
  ]);

  const ytNew = ytNewRaw.map(youtubeVideoToSelectable);
  const ytTrending = ytTrendingRaw.map(youtubeVideoToSelectable);
  const spotifyNewTracks = spotifyNewFeed ? spotifyNewFeed.tracks.map(spotifyTrackToSelectable) : [];
  const spotifyTopTracks = spotifyTopFeed ? spotifyTopFeed.tracks.map(spotifyTrackToSelectable) : [];

  const byTheme = new Map<ThemeType, MusicRelease[]>();
  for (const release of releases) {
    const bucket = byTheme.get(release.themeType) ?? [];
    bucket.push(release);
    byTheme.set(release.themeType, bucket);
  }
  const sections = THEME_ORDER.map((theme) => ({ theme, items: byTheme.get(theme) ?? [] })).filter((s) => s.items.length > 0);
  const playlistSections = sections.filter((s) => s.items.length >= 2);

  return (
    <MusicSelectionProvider>
      <div className="mx-auto flex max-w-4xl flex-col gap-8 pb-28">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Music</h1>
          <p className="mt-1 text-sm text-muted">Live anime music charts, curated OP/ED credits, and real Spotify playlist creation.</p>
        </div>

        {params.spotify_connected === "1" && (
          <Card className="flex items-center gap-2 p-3 text-sm text-positive">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> Spotify connected. You can now save selections as a real playlist.
          </Card>
        )}
        {params.spotify_error && (
          <ErrorState
            reason="fetch_failed"
            message={SPOTIFY_ERROR_MESSAGES[params.spotify_error] ?? "Spotify connection failed. Please try again."}
          />
        )}

        {/* New this season */}
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="flex items-center gap-1.5 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-accent" /> New this season — {seasonLbl}
            </h2>
            <p className="mt-0.5 text-xs text-muted">Recently uploaded anime OP/ED music videos, and (when configured) a live Spotify curator playlist&apos;s real tracklist.</p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">YouTube</h3>
            {YouTubeProvider.configured ? (
              ytNew.length > 0 ? (
                <TrackGrid tracks={ytNew} />
              ) : (
                <ErrorState reason="fetch_failed" message="YouTube's API returned no results for this season's OP/ED search just now." />
              )
            ) : (
              <ErrorState reason="not_configured" message="YOUTUBE_API_KEY isn't set for this deployment, so live music-video search is unavailable." />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Spotify</h3>
            {SpotifyProvider.configured ? (
              spotifyNewFeed ? (
                <>
                  <p className="text-xs text-muted">
                    Real Spotify search results for this season&apos;s OP/ED tracks.
                    {spotifyNewFeed.playlist && (
                      <>
                        {" Browse the full "}
                        <a href={spotifyNewFeed.playlist.externalUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                          &ldquo;{spotifyNewFeed.playlist.name}&rdquo;
                        </a>{" "}
                        playlist by {spotifyNewFeed.playlist.ownerName}
                        {spotifyNewFeed.playlist.followers != null && ` (${spotifyNewFeed.playlist.followers.toLocaleString()} followers)`}
                        {" on Spotify."}
                      </>
                    )}
                  </p>
                  <TrackGrid tracks={spotifyNewTracks} />
                </>
              ) : (
                <ErrorState reason="fetch_failed" message="Spotify returned no track results for this season's search just now." />
              )
            ) : (
              <ErrorState reason="not_configured" message="SPOTIFY_CLIENT_ID/SPOTIFY_CLIENT_SECRET aren't set for this deployment, so live Spotify data is unavailable." />
            )}
          </div>
        </section>

        {/* Trending */}
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="flex items-center gap-1.5 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-accent" /> Trending anime songs
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Most-viewed anime OP/ED videos on YouTube, and (when configured) a live &ldquo;top anime songs&rdquo;-style Spotify playlist&apos;s real
              contents — capped at what that playlist actually has, not a guaranteed 100.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">YouTube</h3>
            {YouTubeProvider.configured ? (
              ytTrending.length > 0 ? (
                <TrackGrid tracks={ytTrending} />
              ) : (
                <ErrorState reason="fetch_failed" message="YouTube's API returned no results for this trending search just now." />
              )
            ) : (
              <ErrorState reason="not_configured" message="YOUTUBE_API_KEY isn't set for this deployment, so live music-video search is unavailable." />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Spotify</h3>
            {SpotifyProvider.configured ? (
              spotifyTopFeed ? (
                <>
                  <p className="text-xs text-muted">
                    Real Spotify search results for popular anime OP/ED tracks, Spotify&apos;s own search ranking.
                    {spotifyTopFeed.playlist && (
                      <>
                        {" Browse the full "}
                        <a href={spotifyTopFeed.playlist.externalUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                          &ldquo;{spotifyTopFeed.playlist.name}&rdquo;
                        </a>{" "}
                        playlist by {spotifyTopFeed.playlist.ownerName}
                        {spotifyTopFeed.playlist.followers != null && ` (${spotifyTopFeed.playlist.followers.toLocaleString()} followers)`}
                        {" on Spotify."}
                      </>
                    )}
                  </p>
                  <TrackGrid tracks={spotifyTopTracks} />
                </>
              ) : (
                <ErrorState reason="fetch_failed" message="Spotify returned no track results just now." />
              )
            ) : (
              <ErrorState reason="not_configured" message="SPOTIFY_CLIENT_ID/SPOTIFY_CLIENT_SECRET aren't set for this deployment, so live Spotify data is unavailable." />
            )}
          </div>
        </section>

        {/* Curated OP/ED credits (kept as the final fallback / reference set) */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-semibold">Curated OP/ED &amp; score credits</h2>
            <p className="mt-0.5 text-xs text-muted">A small hand-curated reference set of real, publicly-documented song credits — not a live catalog, but useful when a live provider above isn&apos;t configured or doesn&apos;t cover a title.</p>
          </div>

          {!MusicProvider.configured && (
            <ErrorState
              reason="not_configured"
              message="This reference set has no live backing API — listen links open a YouTube search for the track rather than a guessed video, since we can't verify a specific video ID without a real API."
            />
          )}

          {playlistSections.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                <ListMusic className="h-3.5 w-3.5" /> Generate a search playlist from the curated set
              </h3>
              <div className="flex flex-wrap gap-2">
                {playlistSections.map((s) => (
                  <a
                    key={s.theme}
                    href={playlistSearchUrl(s.items)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:border-accent/50 hover:text-accent"
                  >
                    <ListMusic className="h-3.5 w-3.5" />
                    {THEME_LABELS[s.theme]} mix
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {sections.length === 0 ? (
            <EmptyState icon={Disc3} title="No curated tracks yet" description="No music credits are available in this deployment's reference set." />
          ) : (
            sections.map((s) => (
              <div key={s.theme}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{THEME_LABELS[s.theme]}</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {s.items.map((release) => (
                    <MusicReleaseCard key={release.id} release={release} />
                  ))}
                </div>
              </div>
            ))
          )}
        </section>

        {/* Connected accounts */}
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="flex items-center gap-1.5 text-sm font-semibold">
              <Music2 className="h-4 w-4 text-accent" /> Connected accounts
            </h2>
            <p className="mt-0.5 text-xs text-muted">Connect Spotify to save your selections below as a real playlist on your own account.</p>
          </div>
          <Card className="p-4">
            <Show when="signed-in">
              <SpotifyConnectionCard status={spotifyStatus} />
            </Show>
            <Show when="signed-out">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted">Sign in to connect Spotify.</p>
                <SignInButton mode="modal">
                  <Button size="sm">
                    <LogIn className="h-3.5 w-3.5" /> Sign in
                  </Button>
                </SignInButton>
              </div>
            </Show>
          </Card>
        </section>

        <SelectionBar spotifyConnected={spotifyStatus.connected} />
      </div>
    </MusicSelectionProvider>
  );
}

function MusicReleaseCard({ release }: { release: MusicRelease }) {
  return (
    <Card className="flex gap-3 p-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-surface-raised">
        {release.coverImage ? (
          <Image src={release.coverImage} alt="" fill sizes="64px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Disc3 className="h-6 w-6 text-muted" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-sm font-medium">{release.title}</p>
        <p className="truncate text-xs text-muted">
          {release.artist}
          {release.composer && release.composer !== release.artist ? ` · comp. ${release.composer}` : ""}
        </p>
        {release.relatedAnimeTitle && (
          <p className="truncate text-xs text-muted">
            {release.relatedAnimeTitle}
            {release.episodeDebut != null ? ` · ep. ${release.episodeDebut}` : ""}
            {" · "}
            <Link href={`/anime?q=${encodeURIComponent(release.relatedAnimeTitle)}`} className="text-accent hover:underline">
              View anime
            </Link>
          </p>
        )}
        {release.releaseDate && <p className="text-[11px] text-muted">{release.releaseDate}</p>}
        {release.listenLinks.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2">
            {release.listenLinks.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
              >
                {link.platform} <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
