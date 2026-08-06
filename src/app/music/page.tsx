import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Disc3, ExternalLink, ListMusic, Sparkles } from "lucide-react";
import { MusicProvider } from "@/lib/providers/music";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import type { MusicRelease, ThemeType } from "@/lib/types/music";

export const metadata: Metadata = { title: "Music" };
export const revalidate = 3600;

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

function playlistSearchUrl(releases: MusicRelease[], limit = 5): string {
  const query = releases
    .slice(0, limit)
    .map((r) => `${r.title} ${r.artist}`)
    .join(" | ");
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export default async function MusicPage() {
  const releases = await MusicProvider.getCuratedReleases();

  const byTheme = new Map<ThemeType, MusicRelease[]>();
  for (const release of releases) {
    const bucket = byTheme.get(release.themeType) ?? [];
    bucket.push(release);
    byTheme.set(release.themeType, bucket);
  }
  const sections = THEME_ORDER.map((theme) => ({ theme, items: byTheme.get(theme) ?? [] })).filter(
    (s) => s.items.length > 0
  );

  // "Generate a playlist" only offers a mix for theme groups that actually have curated
  // tracks in them right now (openings, endings, etc.) — not framed as "current season"
  // since these curated credits aren't tagged with an airing season, and claiming a
  // season on data that doesn't carry one would be inventing a fact this deployment
  // can't verify.
  const playlistSections = sections.filter((s) => s.items.length >= 2);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Music</h1>
        <p className="mt-1 text-sm text-muted">Anime opening, ending, and score credits.</p>
      </div>

      {!MusicProvider.configured && (
        <ErrorState
          reason="not_configured"
          message="This deployment has no live Spotify, MusicBrainz, or YouTube Music API key configured, so there's no real-time music sync. What's below is a small hand-curated reference set of real, publicly-documented OP/ED song and artist credits — not a live catalog. Listen links open a YouTube search for the track rather than a guessed video, since we can't verify a specific video ID without a real API."
        />
      )}

      {playlistSections.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-accent" /> Generate a playlist
          </h2>
          <p className="mb-2 text-xs text-muted">
            Opens a YouTube search combining titles from the curated set below — not a real playlist file, and not
            connected to any streaming account.
          </p>
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
        </section>
      )}

      {sections.length === 0 ? (
        <EmptyState icon={Disc3} title="No curated tracks yet" description="No music credits are available in this deployment's reference set." />
      ) : (
        sections.map((s) => (
          <section key={s.theme}>
            <h2 className="mb-2 text-sm font-semibold">{THEME_LABELS[s.theme]}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {s.items.map((release) => (
                <MusicReleaseCard key={release.id} release={release} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
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
