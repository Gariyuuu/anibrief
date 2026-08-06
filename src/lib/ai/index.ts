import "server-only";
import { AnthropicProvider } from "@/lib/ai/anthropic";
import { OpenAIProvider } from "@/lib/ai/openai";
import type { AIProvider } from "@/lib/ai/types";
import { logger } from "@/lib/utils/logger";

let cached: AIProvider | null | undefined;

/**
 * Returns `null` (never throws) when no AI key is configured, so every
 * caller falls back to a deterministic template instead of the page
 * crashing — spec §22/§42 requires the app work with zero AI key set.
 */
export function getAIProvider(): AIProvider | null {
  if (cached !== undefined) return cached;

  const providerName = process.env.AI_PROVIDER ?? "anthropic";

  if (providerName === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    cached = new AnthropicProvider();
  } else if (providerName === "openai" && process.env.OPENAI_API_KEY) {
    cached = new OpenAIProvider();
  } else {
    logger.info("getAIProvider: no AI key configured, using template fallback", { providerName });
    cached = null;
  }

  return cached;
}
