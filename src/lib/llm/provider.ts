export interface ChatTurn { role: "user" | "assistant"; content: string }

export interface LlmRequest {
  system: string;
  messages: ChatTurn[];
  temperature?: number;
  maxTokens?: number;
}

/** Small provider interface so Anthropic (or anything else) can be dropped in later. */
export interface LlmProvider {
  readonly name: string;
  complete(req: LlmRequest): Promise<string>;
}

// --- OpenAI -------------------------------------------------------------
export class OpenAiProvider implements LlmProvider {
  readonly name = "openai";
  constructor(
    private apiKey: string,
    private model = process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  ) {}

  async complete(req: LlmRequest): Promise<string> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${this.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        temperature: req.temperature ?? 0.4,
        max_tokens: req.maxTokens ?? 220,
        messages: [{ role: "system", content: req.system }, ...req.messages],
      }),
    });
    if (!res.ok) throw new Error(`openai ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as { choices: { message: { content: string } }[] };
    return json.choices[0].message.content.trim();
  }
}

// --- Anthropic (not wired up by default; shown so the seam is obvious) --
export class AnthropicProvider implements LlmProvider {
  readonly name = "anthropic";
  constructor(private apiKey: string, private model = "claude-3-5-haiku-latest") {}

  async complete(req: LlmRequest): Promise<string> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: req.maxTokens ?? 220,
        system: req.system,
        messages: req.messages,
      }),
    });
    if (!res.ok) throw new Error(`anthropic ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as { content: { text: string }[] };
    return json.content.map((c) => c.text).join("").trim();
  }
}

// --- Mock: deterministic, and deliberately risky on some prompts ---------
export class MockProvider implements LlmProvider {
  readonly name = "mock";
  constructor(private reply: (req: LlmRequest) => string) {}
  async complete(req: LlmRequest): Promise<string> {
    return this.reply(req);
  }
}
