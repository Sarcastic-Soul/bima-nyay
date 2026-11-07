/**
 * Text embeddings from Cloudflare Workers AI (bge-m3: multilingual, so Hindi and English share one space).
 * Free tier: 10,000 Neurons a day and 3,000 requests a minute.
 */
export const EMBED_MODEL = "@cf/baai/bge-m3";
export const EMBED_DIM = 1024;
const BATCH = 50;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function embedBatch(texts: string[]): Promise<number[][]> {
  const id = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!id || !token) throw new Error("CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must be set");
  const url = `https://api.cloudflare.com/client/v4/accounts/${id}/ai/run/${EMBED_MODEL}`;

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: texts }),
    });
    if (res.ok) {
      const json = (await res.json()) as { result?: { data?: number[][] } };
      const data = json.result?.data;
      if (!data || data.length !== texts.length) throw new Error("Cloudflare embeddings: unexpected response shape");
      return data;
    }
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= 5) throw new Error(`Cloudflare embeddings failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
    await sleep(2000 * 2 ** attempt);
  }
}

export async function embed(texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH) out.push(...(await embedBatch(texts.slice(i, i + BATCH))));
  return out;
}
