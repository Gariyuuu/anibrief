import "server-only";
import { AniListProvider } from "@/lib/providers/anilist";
import { mapMedia } from "@/lib/providers/anilist/mappers";
import { parseInternalId } from "@/lib/utils/mediaId";

/** Shared by every /anime/[id]/* tab page — Next's fetch cache dedupes the underlying request, so calling this from multiple tab pages in one revalidate window is cheap. */
export async function getAnimeDetail(id: string) {
  const { numericId } = parseInternalId(id);
  const raw = await AniListProvider.getMediaDetailRaw(numericId);
  if (!raw) return null;
  return { media: mapMedia(raw), raw };
}
