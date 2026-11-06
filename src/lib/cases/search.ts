import { db } from "../db";
import { embed } from "../gemini";
import type { CaseHit } from "./stats";

export type SearchOpts = { reason?: string | null; beforeYear?: number; excludeId?: string; k?: number };

export async function searchByVector(vec: number[], opts: SearchOpts = {}): Promise<CaseHit[]> {
  const rows = (await db().query(
    `select id, forum, year, insurer, reason, facts, outcome, amount_claimed::float, amount_awarded::float,
            source_url, source_ref, 1 - (embedding <=> $1::vector) as similarity
       from cases
      where embedding is not null
        and ($2::text is null or reason = $2)
        and ($3::int is null or year < $3)
        and ($4::text is null or id <> $4)
      order by embedding <=> $1::vector
      limit $5`,
    [JSON.stringify(vec), opts.reason ?? null, opts.beforeYear ?? null, opts.excludeId ?? null, opts.k ?? 25],
  )) as CaseHit[];
  return rows.map((r) => ({ ...r, similarity: Number(r.similarity) }));
}

/** Same text shape as the loader embeds: "<reason>: <facts>". */
export async function searchSimilar(reason: string, facts: string, opts: Omit<SearchOpts, "reason"> & { sameReason?: boolean } = {}) {
  const [vec] = await embed([`${reason}: ${facts}`]);
  return searchByVector(vec, { ...opts, reason: opts.sameReason === false ? null : reason });
}
