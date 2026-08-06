import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider } from "@/lib/ai/types";

export class AnthropicProvider implements AIProvider {
  name = "anthropic" as const;
  private client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  async complete(prompt: string, { maxTokens = 400 }: { maxTokens?: number } = {}): Promise<string> {
    const message = await this.client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    });
    const block = message.content.find((b) => b.type === "text");
    return block && block.type === "text" ? block.text.trim() : "";
  }
}
