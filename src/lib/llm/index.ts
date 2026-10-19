import { MockProvider, OpenAiProvider, type LlmProvider } from "./provider";
import { mockReply } from "./mockReplies";

export type { LlmProvider, LlmRequest } from "./provider";
export { AnthropicProvider } from "./provider";

let cached: LlmProvider | null = null;

/** OpenAI when OPENAI_API_KEY is set, otherwise the deterministic mock. */
export function getProvider(): LlmProvider {
  if (cached) return cached;
  const key = process.env.OPENAI_API_KEY;
  cached = key ? new OpenAiProvider(key) : new MockProvider(mockReply);
  return cached;
}
