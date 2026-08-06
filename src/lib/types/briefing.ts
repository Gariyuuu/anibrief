export type BriefMode = "quick" | "standard" | "deep";

export interface BriefingStat {
  label: string;
  value: number;
}

export interface BriefingSection<T = unknown> {
  id: string;
  title: string;
  items: T[];
}

export interface DailyBriefing {
  date: string; // ISO date
  generatedAt: string;
  summary: string;
  summaryIsAiGenerated: boolean;
  stats: BriefingStat[];
  sections: BriefingSection[];
}
