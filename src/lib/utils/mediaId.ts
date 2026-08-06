import type { DataSource } from "@/lib/types/media";

export function parseInternalId(id: string): { source: DataSource; numericId: number } {
  const [source, numeric] = id.split(":");
  return { source: source as DataSource, numericId: Number(numeric) };
}
