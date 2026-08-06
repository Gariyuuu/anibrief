import type { DataSource } from "@/lib/types/media";

export interface ProviderHealth {
  provider: DataSource | "news" | "youtube" | "music" | "streaming";
  configured: boolean;
  lastSuccessAt: string | null;
  lastError: string | null;
}

/** Every fetch-y helper across providers returns this shape so callers can render partial data + a clear error state instead of crashing. */
export interface ProviderResult<T> {
  data: T;
  ok: boolean;
  error?: string;
  source: DataSource | "news" | "youtube" | "music" | "streaming";
}

export function ok<T>(data: T, source: ProviderResult<T>["source"]): ProviderResult<T> {
  return { data, ok: true, source };
}

export function fail<T>(fallback: T, source: ProviderResult<T>["source"], error: string): ProviderResult<T> {
  return { data: fallback, ok: false, error, source };
}
