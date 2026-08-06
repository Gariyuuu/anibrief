import type { DataSource } from "@/lib/types/media";

export type PersonRole =
  | "voice_actor"
  | "author"
  | "artist"
  | "director"
  | "producer"
  | "composer"
  | "studio";

export interface NormalizedPerson {
  id: string;
  source: DataSource;
  sourceId: string;
  sourceUrl: string;
  name: string;
  nativeName: string | null;
  alternateNames: string[];
  image: string | null;
  primaryRole: PersonRole;
  dateOfBirth: { year: number | null; month: number | null; day: number | null } | null;
  description: string | null;
  homeTown: string | null;
  notableRoles: { mediaId: string; mediaTitle: string; character?: string }[];
  lastUpdated: string;
}
