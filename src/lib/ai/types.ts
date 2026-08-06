export interface AIProvider {
  name: "anthropic" | "openai";
  complete(prompt: string, opts?: { maxTokens?: number }): Promise<string>;
}
