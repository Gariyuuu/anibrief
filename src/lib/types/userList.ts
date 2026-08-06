export type AnimeListStatus = "planning" | "watching" | "completed" | "paused" | "dropped" | "rewatching";
export type MangaListStatus = "planning" | "reading" | "completed" | "paused" | "dropped" | "rereading";

export interface UserAnimeListEntry {
  id: string;
  userId: string;
  mediaId: string;
  status: AnimeListStatus;
  progress: number;
  score: number | null;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  isPublic: boolean;
  rewatchCount: number;
  isFavorite: boolean;
  updatedAt: string;
}

export interface UserMangaListEntry {
  id: string;
  userId: string;
  mediaId: string;
  status: MangaListStatus;
  progressChapters: number;
  score: number | null;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  isPublic: boolean;
  isFavorite: boolean;
  updatedAt: string;
}

export type AlertType =
  | "new_episode"
  | "season_premiere"
  | "finale"
  | "movie_release"
  | "sequel_announcement"
  | "adaptation_announcement"
  | "trailer_release"
  | "streaming_availability"
  | "manga_volume"
  | "ost_release"
  | "voice_actor_news"
  | "studio_news"
  | "schedule_delay"
  | "birthday"
  | "anniversary";

export type AlertFrequency = "immediate" | "daily_digest" | "weekly_digest" | "off";

export interface UserAlert {
  id: string;
  userId: string;
  type: AlertType;
  targetId: string; // mediaId, personId, or studio name depending on type
  targetLabel: string;
  frequency: AlertFrequency;
  createdAt: string;
}
