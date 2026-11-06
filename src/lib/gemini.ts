import { GoogleGenAI } from "@google/genai";

/** One Flash-Lite model for everything: free tier, enough for extraction and tool use. */
export const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";
export const EMBED_MODEL = "gemini-embedding-001";
export const EMBED_DIM = 768;

let client: GoogleGenAI | null = null;
export function gemini(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export async function embed(texts: string[]): Promise<number[][]> {
  const res = await gemini().models.embedContent({
    model: EMBED_MODEL,
    contents: texts,
    config: { outputDimensionality: EMBED_DIM, taskType: "SEMANTIC_SIMILARITY" },
  });
  return res.embeddings!.map((e) => e.values!);
}

/** Retry on 429/503 with backoff; Flash-Lite free tier sees both. */
export async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e) {
      const msg = String((e as Error).message ?? e);
      if (i >= tries - 1 || !/429|503|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand/i.test(msg)) throw e;
      await new Promise((r) => setTimeout(r, 2000 * 2 ** i));
    }
  }
}
