/**
 * Chat model for letter reading and the agent, on Cloudflare Workers AI (OpenAI-style chat endpoint).
 * Qwen 3.8 27B won our bench (scripts/bench-models.mts): best letter reading, and the only model that
 * called every tool and used the tool numbers in both runs. Thinking is off: with it on, the model
 * ran out of tokens before writing the JSON.
 */
export const CHAT_MODEL = process.env.CHAT_MODEL ?? "@cf/qwen/qwen3.8-27b";

export type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };
export type ChatMessage =
  | { role: "system" | "user"; content: string | ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } })[] }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };
export type ToolDef = { type: "function"; function: { name: string; description: string; parameters: object } };
export type ChatResult = { content: string; toolCalls: ToolCall[]; message: ChatMessage };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function chat(opts: {
  messages: ChatMessage[];
  tools?: ToolDef[];
  temperature?: number;
  maxTokens?: number;
}): Promise<ChatResult> {
  const id = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!id || !token) throw new Error("CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must be set");
  const url = `https://api.cloudflare.com/client/v4/accounts/${id}/ai/v1/chat/completions`;
  const body = JSON.stringify({
    model: CHAT_MODEL,
    messages: opts.messages,
    ...(opts.tools?.length ? { tools: opts.tools } : {}),
    temperature: opts.temperature ?? 0,
    max_tokens: opts.maxTokens ?? 3000,
    chat_template_kwargs: { enable_thinking: false },
  });

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body, signal: AbortSignal.timeout(25_000) });
    if (res.ok) {
      const json = (await res.json()) as { choices?: { message?: { content?: string | null; tool_calls?: ToolCall[] } }[] };
      const msg = json.choices?.[0]?.message;
      if (!msg) throw new Error("Workers AI chat: empty response");
      const toolCalls = msg.tool_calls ?? [];
      return {
        content: msg.content ?? "",
        toolCalls,
        message: { role: "assistant", content: msg.content ?? null, ...(toolCalls.length ? { tool_calls: toolCalls } : {}) },
      };
    }
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= 3) throw new Error(`Workers AI chat failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
    await sleep(2000 * 2 ** attempt);
  }
}
