import { NextResponse, type NextRequest } from "next/server";
import { AniListProvider } from "@/lib/providers/anilist";

// Server-side proxy so the AniList client (server-only) can be called from
// the client-side command palette without exposing provider internals.
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ anime: [], manga: [] });

  const [anime, manga] = await Promise.all([
    AniListProvider.searchMedia(q, "ANIME", { perPage: 6 }),
    AniListProvider.searchMedia(q, "MANGA", { perPage: 4 }),
  ]);

  return NextResponse.json({
    anime: anime.items.map((m) => ({ id: m.id, title: m.titles.preferred, image: m.coverImage, kind: m.kind })),
    manga: manga.items.map((m) => ({ id: m.id, title: m.titles.preferred, image: m.coverImage, kind: m.kind })),
  });
}
