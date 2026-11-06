/**
 * Join awards + Gemini labels, embed the neutral summary, and upsert into Neon `cases`.
 * Only health claims are loaded. Safe to re-run (skips rows that already have embeddings).
 *
 *   node --network-family-autoselection-attempt-timeout=2000 --import tsx scripts/load-cases.mts
 */
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { GoogleGenAI } from "@google/genai";

config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const EMBED_MODEL = "gemini-embedding-001";
export const EMBED_DIM = 768;

const read = (p: string) => readFileSync(p, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
const awards = new Map(read("data/processed/gic-awards.jsonl").map((a: any) => [a.id, a]));
const labels = read("data/processed/gic-labels.jsonl").filter((l: any) => l.is_health_claim && awards.has(l.id));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const have = new Set((await sql.query("select id from cases where embedding is not null")).map((r: any) => r.id));
const todo = labels.filter((l: any) => !have.has(`gic-${l.id}`));
console.log(`${labels.length} health awards labelled, ${todo.length} to load`);

for (let i = 0; i < todo.length; i += 50) {
  const batch = todo.slice(i, i + 50);
  let res;
  for (let attempt = 0; ; attempt++) {
    try {
      res = await ai.models.embedContent({
        model: EMBED_MODEL,
        contents: batch.map((l: any) => `${l.reason}: ${l.facts}`),
        config: { outputDimensionality: EMBED_DIM, taskType: "SEMANTIC_SIMILARITY" },
      });
      break;
    } catch (e) {
      const msg = String((e as Error).message);
      if (attempt >= 5 || !/429|503/.test(msg)) throw e;
      if (/per day|PerDay/i.test(msg)) throw new Error("Daily embedding quota reached; re-run tomorrow.");
      const wait = Number(msg.match(/retry in ([\d.]+)s/)?.[1] ?? 30) * 1000 + 2000;
      console.warn(`rate limited, waiting ${Math.round(wait / 1000)}s`);
      await sleep(wait);
    }
  }
  const vecs = res.embeddings!.map((e) => e.values!);
  for (const [k, l] of batch.entries()) {
    const a: any = awards.get(l.id);
    await sql.query(
      `insert into cases (id, corpus, forum, decided_on, year, insurer, policy_type, reason, facts, outcome,
         amount_claimed, amount_awarded, source_url, source_ref, raw_text, label_source, embedding)
       values ($1,'gic',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::vector)
       on conflict (id) do update set reason=excluded.reason, facts=excluded.facts, outcome=excluded.outcome,
         embedding=excluded.embedding, label_source=excluded.label_source`,
      [
        `gic-${l.id}`, a.centre ? `Ombudsman ${a.centre}` : "Insurance Ombudsman", a.award_date, a.year,
        l.insurer, l.policy_type, l.reason, l.facts, l.outcome, l.amount_claimed ?? null, l.amount_awarded ?? null,
        `https://cioins.co.in/GIC/mediclaim/Mediclaim-Book${a.book.slice(2)}.pdf`, `${a.book} ${a.case_no ?? ""}`.trim(),
        a.text, l.label_source, JSON.stringify(vecs[k]),
      ],
    );
  }
  console.log(`${Math.min(i + 50, todo.length)}/${todo.length}`);
  await sleep(31000); // free tier: 100 embeddings per minute
}
