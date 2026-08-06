import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Prev/Next pager driven entirely by real AniList `pageInfo.hasNextPage` —
 * never renders a "Next" link past what the API actually confirms has more
 * results, and never fabricates a total page count AniList doesn't give us.
 */
export function Pagination({
  page,
  hasNextPage,
  basePath,
  searchParams,
}: {
  page: number;
  hasNextPage: boolean;
  basePath: string;
  /** Query params to preserve across page links (e.g. { q, type, sort }) — `page` is added/overridden automatically. */
  searchParams?: Record<string, string | undefined>;
}) {
  if (page <= 1 && !hasNextPage) return null;

  function hrefFor(targetPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams ?? {})) {
      if (value) params.set(key, value);
    }
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm hover:border-accent/50"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Previous
        </Link>
      ) : (
        <span className={cn("inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-muted opacity-50")}>
          <ChevronLeft className="h-3.5 w-3.5" /> Previous
        </span>
      )}
      <span className="text-xs text-muted">Page {page}</span>
      {hasNextPage ? (
        <Link
          href={hrefFor(page + 1)}
          className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm hover:border-accent/50"
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-muted opacity-50">
          Next <ChevronRight className="h-3.5 w-3.5" />
        </span>
      )}
    </div>
  );
}
