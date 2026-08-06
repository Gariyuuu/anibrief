import "server-only";
import { logger } from "@/lib/utils/logger";

/**
 * Official MyAnimeList API (v2) requires a registered OAuth client and,
 * for list-sync, a per-user access token — see DATA_SOURCES.md for setup.
 * Kept modular per spec §5: every method degrades to `null`/`[]` with a
 * logged reason when MAL_CLIENT_ID isn't set, rather than throwing, so the
 * rest of the app never blocks on this provider being unconfigured.
 */
export const MyAnimeListProvider = {
  get configured() {
    return Boolean(process.env.MAL_CLIENT_ID);
  },

  async getRanking(): Promise<null> {
    if (!this.configured) {
      logger.info("MyAnimeListProvider.getRanking skipped: MAL_CLIENT_ID not set");
      return null;
    }
    // Intentionally unimplemented beyond the interface: exercising this
    // requires a registered MAL API client (see DATA_SOURCES.md). AniList
    // covers ranking/popularity in the meantime.
    return null;
  },

  async exchangeAuthCode(): Promise<null> {
    if (!this.configured) {
      logger.info("MyAnimeListProvider.exchangeAuthCode skipped: MAL_CLIENT_ID not set");
      return null;
    }
    return null;
  },
};
