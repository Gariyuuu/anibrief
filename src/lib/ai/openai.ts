import "server-only";
import OpenAI from "openai";
import type { AIProvider } from "@/lib/ai/types";

export class OpenAIProvider implements AIProvider {
  name = "openai" as const;
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async complete(prompt: string, { maxTokens = 400 }: { maxTokens?: number } = {}): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    });
    return completion.choices[0]?.message?.content?.trim() ?? "";
  }
}
