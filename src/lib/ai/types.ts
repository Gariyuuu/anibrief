export interface AIProvider {
  name: "anthropic" | "openai" | "goat-ai";
  complete(prompt: string, opts?: { maxTokens?: number }): Promise<string>;
}
