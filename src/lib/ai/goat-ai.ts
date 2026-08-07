import "server-only";
import OpenAI from "openai";
import type { AIProvider } from "@/lib/ai/types";

/**
 * Model name is fixed by the platform (self-hosted, OpenAI-compatible) — not
 * overridable via env var, unlike ANTHROPIC_MODEL/OPENAI_MODEL, since this
 * deployment only serves one model.
 */
const GOAT_AI_MODEL = "Yuu no Sekai";
const GOAT_AI_DEFAULT_BASE_URL = "https://api.gariyuuu.com/v1";

/**
 * Talks to a self-hosted, OpenAI-compatible inference platform via the
 * official `openai` SDK pointed at a custom `baseURL`. See AI_PROVIDER=goat-ai
 * in .env.example / CLAUDE.md's env var table.
 */
export class GoatAIProvider implements AIProvider {
  name = "goat-ai" as const;
  private client = new OpenAI({
    apiKey: process.env.AI_PLATFORM_API_KEY,
    baseURL: process.env.AI_PLATFORM_BASE_URL ?? GOAT_AI_DEFAULT_BASE_URL,
  });

  async complete(prompt: string, { maxTokens = 400 }: { maxTokens?: number } = {}): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: GOAT_AI_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
      // Disables the underlying Qwen3 model's default "thinking mode" — verified to
      // drop output tokens ~10x. Platform-specific field, not in the SDK's request types.
      // @ts-expect-error - `reasoning` is a platform-specific extension, not part of the openai SDK's types
      reasoning: { enabled: false },
    });
    return completion.choices[0]?.message?.content?.trim() ?? "";
  }
}
