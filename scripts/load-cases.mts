/**
 * Join awards + Gemini labels, embed the neutral summary, and upsert into Neon `cases`.
 * Only health claims are loaded. Safe to re-run (skips rows that already have embeddings).
 *
 *   node --network-family-autoselection-attempt-timeout=2000 --import tsx scripts/load-cases.mts
 */
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { EMBED_MODEL, embed } from "../src/lib/embed.ts";
import { neutralFacts, searchText } from "../src/lib/cases/neutral.ts";

config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!);

const read = (p: string) => readFileSync(p, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
const awards = new Map(read("data/processed/gic-awards.jsonl").map((a: any) => [a.id, a]));
const labels = read("data/processed/gic-labels.jsonl").filter((l: any) => l.is_health_claim && awards.has(l.id));

// Vectors from different models are not comparable, so only rows made by the current model count as done.
const have = new Set(
  (await sql.query("select id from cases where embedding is not null and embed_model = $1", [EMBED_MODEL])).map((r: any) => r.id),
);
// Cases with no facts left after the decision is removed stay in the table but are not searchable.
const todo = labels.filter((l: any) => !have.has(`gic-${l.id}`) && neutralFacts(l.facts));
console.log(`${labels.length} health awards labelled, ${todo.length} to embed with ${EMBED_MODEL}`);

for (let i = 0; i < todo.length; i += 50) {
  const batch = todo.slice(i, i + 50);
  const vecs = await embed(batch.map((l: any) => searchText(l.reason, l.facts)));
  for (const [k, l] of batch.entries()) {
    const a: any = awards.get(l.id);
    await sql.query(
      `insert into cases (id, corpus, forum, decided_on, year, insurer, policy_type, reason, facts, outcome,
         amount_claimed, amount_awarded, source_url, source_ref, raw_text, label_source, embedding, embed_model)
       values ($1,'gic',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::vector,$17)
       on conflict (id) do update set reason=excluded.reason, facts=excluded.facts, outcome=excluded.outcome,
         embedding=excluded.embedding, embed_model=excluded.embed_model, label_source=excluded.label_source`,
      [
        `gic-${l.id}`, a.centre ? `Ombudsman ${a.centre}` : "Insurance Ombudsman", a.award_date, a.year,
        l.insurer, l.policy_type, l.reason, l.facts, l.outcome, l.amount_claimed ?? null, l.amount_awarded ?? null,
        `https://cioins.co.in/GIC/mediclaim/Mediclaim-Book${a.book.slice(2)}.pdf`, `${a.book} ${a.case_no ?? ""}`.trim(),
        a.text, l.label_source, JSON.stringify(vecs[k]), EMBED_MODEL,
      ],
    );
  }
  console.log(`${Math.min(i + 50, todo.length)}/${todo.length}`);
}
