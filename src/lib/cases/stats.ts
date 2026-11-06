import type { Outcome } from "../reasons";

export type CaseHit = {
  id: string;
  forum: string | null;
  year: number | null;
  insurer: string | null;
  reason: string | null;
  facts: string | null;
  outcome: Outcome;
  amount_claimed: number | null;
  amount_awarded: number | null;
  source_url: string | null;
  source_ref: string | null;
  similarity: number;
};

export type OutcomeSummary =
  | { abstain: true; why: string; n: number }
  | {
      abstain: false;
      n: number;
      counts: Record<Outcome, number>;
      /** Share where the complainant got something: allowed, partly allowed, or insurer settled. */
      favourable: number;
      low: number;
      high: number;
    };

export const MIN_CASES = 8;
export const MIN_SIMILARITY = 0.72;

/** Wilson score interval, 95%. */
export function wilson(k: number, n: number, z = 1.96) {
  if (n === 0) return { p: 0, low: 0, high: 1 };
  const p = k / n;
  const d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n);
  const r = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return { p, low: Math.max(0, (c - r) / d), high: Math.min(1, (c + r) / d) };
}

export const isFavourable = (o: Outcome) => o === "allowed" || o === "partly_allowed" || o === "settled";

/** Count outcomes among close matches; abstain when evidence is thin. */
export function summarise(hits: CaseHit[], minSim = MIN_SIMILARITY, minCases = MIN_CASES): OutcomeSummary {
  const close = hits.filter((h) => h.similarity >= minSim && h.outcome !== "other");
  if (close.length < minCases)
    return {
      abstain: true,
      n: close.length,
      why: `Only ${close.length} closely matching past decisions (need ${minCases}). Too few to estimate your chances.`,
    };
  const counts = { allowed: 0, partly_allowed: 0, dismissed: 0, settled: 0, other: 0 } as Record<Outcome, number>;
  for (const h of close) counts[h.outcome]++;
  const k = close.filter((h) => isFavourable(h.outcome)).length;
  const w = wilson(k, close.length);
  return { abstain: false, n: close.length, counts, favourable: w.p, low: w.low, high: w.high };
}
