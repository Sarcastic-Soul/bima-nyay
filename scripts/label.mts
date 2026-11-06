/**
 * Label each Ombudsman award with Gemini: is it a health claim, why was it
 * rejected, what did the Ombudsman decide, amounts, and a short neutral summary.
 * Resumable: appends to data/processed/gic-labels.jsonl and skips done ids.
 *
 *   node --import tsx scripts/label.mts [--limit 200]
 */
import { config } from "dotenv";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { GoogleGenAI, Type } from "@google/genai";
import { REASON_IDS, OUTCOMES } from "../src/lib/reasons.ts";

config({ path: ".env.local" });
const key = process.env.GEMINI_API_KEY;
if (!key) throw new Error("GEMINI_API_KEY missing in .env.local");
const ai = new GoogleGenAI({ apiKey: key });
const MODEL = process.env.GEMINI_LABEL_MODEL ?? "gemini-3.5-flash-lite";
const BATCH = Number(process.env.GEMINI_BATCH ?? 20);
const RPM = Number(process.env.GEMINI_RPM ?? 6);

const IN = "data/processed/gic-awards.jsonl";
const OUT = "data/processed/gic-labels.jsonl";
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg > 0 ? Number(process.argv[limitArg + 1]) : Infinity;

type Award = { id: string; text: string };
const awards: Award[] = readFileSync(IN, "utf8").trim().split("\n").map((l) => JSON.parse(l));
const done = new Set(
  existsSync(OUT) ? readFileSync(OUT, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l).id) : [],
);
const todo = awards.filter((a) => !done.has(a.id)).slice(0, LIMIT);
console.log(`${done.size} done, ${todo.length} to label with ${MODEL}`);

const schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      is_health_claim: { type: Type.BOOLEAN, description: "true for hospitalisation/mediclaim/health policy claims; false for pure personal-accident disability, travel, life etc." },
      reason: { type: Type.STRING, enum: [...REASON_IDS] },
      outcome: { type: Type.STRING, enum: [...OUTCOMES] },
      policy_type: { type: Type.STRING, enum: ["individual", "family_floater", "group", "government_scheme", "unknown"] },
      insurer: { type: Type.STRING, description: "insurer short name, e.g. 'New India Assurance'" },
      amount_claimed: { type: Type.NUMBER, nullable: true },
      amount_awarded: { type: Type.NUMBER, nullable: true },
      facts: { type: Type.STRING, description: "neutral summary, max 60 words, no personal names" },
    },
    required: ["id", "is_health_claim", "reason", "outcome", "policy_type", "insurer", "facts"],
  },
};

const PROMPT = `You label Indian Insurance Ombudsman awards about health insurance claims.
For each award return one object.
reason = the insurer's main ground for rejecting or cutting the claim:
ped (pre-existing disease), non_disclosure (hid facts in proposal), waiting_period (first 30 days / 1-2-4 year waiting list),
exclusion (excluded treatment/condition), not_necessary (no need to be admitted, OPD, only investigation),
documents (missing papers, late intimation/submission), room_rent (room-rent cap or proportionate deduction),
non_payable (non-medical items, reasonable & customary cut, partial settlement for amounts), cashless_denied,
lapsed (policy break/not in force), other.
outcome from the complainant's view: allowed (full claim ordered), partly_allowed (some amount or ex-gratia ordered),
dismissed (insurer's decision upheld), settled (insurer agreed/paid during process, or complaint withdrawn), other.
Amounts in rupees as numbers, null if not stated.`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function labelBatch(batch: Award[], attempt = 0): Promise<unknown[]> {
  try {
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: PROMPT + "\n\n" + batch.map((a) => `### id=${a.id}\n${a.text.slice(0, 5000)}`).join("\n\n"),
      config: { responseMimeType: "application/json", responseSchema: schema, temperature: 0 },
    });
    return JSON.parse(res.text ?? "[]");
  } catch (e) {
    if (attempt >= 4) throw e;
    const wait = 15000 * 2 ** attempt;
    console.warn(`retry in ${wait / 1000}s: ${(e as Error).message.slice(0, 120)}`);
    await sleep(wait);
    return labelBatch(batch, attempt + 1);
  }
}

for (let i = 0; i < todo.length; i += BATCH) {
  const started = Date.now();
  const batch = todo.slice(i, i + BATCH);
  const ids = new Set(batch.map((a) => a.id));
  const rows = (await labelBatch(batch)).filter((r: any) => ids.has(r.id));
  if (rows.length) appendFileSync(OUT, rows.map((r) => JSON.stringify({ ...(r as object), label_source: MODEL })).join("\n") + "\n");
  console.log(`${Math.min(i + BATCH, todo.length)}/${todo.length} (+${rows.length})`);
  await sleep(Math.max(0, 60000 / RPM - (Date.now() - started)));
}
