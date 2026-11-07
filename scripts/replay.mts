// Time-split replay: for every decided case from TEST_FROM onwards, look only at cases
// decided in earlier years, run the same search + summary the app uses, and check the
// estimate against what the Ombudsman actually decided.
// No Gemini calls: uses the embeddings already stored in Neon.
// Run: node --import tsx scripts/replay.mts
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
const { writeFileSync } = await import("node:fs");
const { db } = await import("../src/lib/db/index.ts");
const { searchByVector } = await import("../src/lib/cases/search.ts");
const { EMBED_MODEL } = await import("../src/lib/embed.ts");
const { summarise, isFavourable, MIN_CASES, MIN_SIMILARITY } = await import("../src/lib/cases/stats.ts");

const TEST_FROM = Number(process.env.TEST_FROM ?? 2011);

type Row = { id: string; year: number; reason: string; outcome: string; embedding: string };
const all = (await db().query(
  `select id, year, reason, outcome, embedding::text from cases
    where embedding is not null and embed_model = $1 and year is not null and outcome <> 'other' order by year, id`,
  [EMBED_MODEL],
)) as Row[];
const test = all.filter((r) => r.year >= TEST_FROM);
const train = all.filter((r) => r.year < TEST_FROM);
console.log(`${all.length} cases with outcome; ${train.length} before ${TEST_FROM}, ${test.length} to replay`);

type Result = { id: string; year: number; reason: string; actual: boolean; abstain: boolean; p: number | null; low: number | null; high: number | null; n: number; baseReason: number };
const results: Result[] = [];

// Baseline: share favourable for the same reason in all earlier years, no similarity search.
function baseRate(reason: string, year: number) {
  const past = all.filter((r) => r.year < year && r.reason === reason);
  const pastAll = all.filter((r) => r.year < year);
  const pool = past.length >= MIN_CASES ? past : pastAll;
  return pool.filter((r) => isFavourable(r.outcome as never)).length / Math.max(1, pool.length);
}

const POOL = 6;
for (let i = 0; i < test.length; i += POOL) {
  await Promise.all(
    test.slice(i, i + POOL).map(async (c) => {
      const vec = JSON.parse(c.embedding) as number[];
      const hits = await searchByVector(vec, { reason: c.reason, beforeYear: c.year, excludeId: c.id, k: 25 });
      const s = summarise(hits);
      results.push({
        id: c.id, year: c.year, reason: c.reason, actual: isFavourable(c.outcome as never),
        abstain: s.abstain, p: s.abstain ? null : s.favourable, low: s.abstain ? null : s.low, high: s.abstain ? null : s.high,
        n: s.n, baseReason: baseRate(c.reason, c.year),
      });
    }),
  );
  if (i % 120 === 0) console.log(`${Math.min(i + POOL, test.length)}/${test.length}`);
}

const answered = results.filter((r) => !r.abstain);
const acc = (xs: Result[], pred: (r: Result) => boolean) => xs.filter((r) => pred(r) === r.actual).length / Math.max(1, xs.length);
const brier = (xs: Result[], p: (r: Result) => number) => xs.reduce((a, r) => a + (p(r) - (r.actual ? 1 : 0)) ** 2, 0) / Math.max(1, xs.length);
const trainFav = train.filter((r) => isFavourable(r.outcome as never)).length / Math.max(1, train.length);

const bins = [0, 0.2, 0.4, 0.6, 0.8, 1.0001].slice(0, -1).map((lo, i, arr) => {
  const hi = i === arr.length - 1 ? 1.0001 : arr[i + 1];
  const xs = answered.filter((r) => r.p! >= lo && r.p! < hi);
  return { from: lo, to: Math.min(1, hi), n: xs.length, predicted: xs.reduce((a, r) => a + r.p!, 0) / Math.max(1, xs.length), actual: xs.filter((r) => r.actual).length / Math.max(1, xs.length) };
});

const byReason = Object.entries(
  results.reduce<Record<string, Result[]>>((m, r) => ((m[r.reason] ??= []).push(r), m), {}),
).map(([reason, xs]) => {
  const a = xs.filter((r) => !r.abstain);
  return { reason, n: xs.length, answered: a.length, accuracy: a.length ? acc(a, (r) => r.p! >= 0.5) : null, favourableActual: xs.filter((r) => r.actual).length / xs.length };
}).sort((a, b) => b.n - a.n);

const report = {
  ranAt: new Date().toISOString(),
  settings: { testFrom: TEST_FROM, minCases: MIN_CASES, minSimilarity: MIN_SIMILARITY, k: 25 },
  corpus: { total: all.length, train: train.length, test: test.length, years: [all[0]?.year, all.at(-1)?.year] },
  answeredShare: answered.length / Math.max(1, results.length),
  answered: answered.length,
  abstained: results.length - answered.length,
  accuracy: {
    app: acc(answered, (r) => r.p! >= 0.5),
    sameReasonBaseRate: acc(answered, (r) => r.baseReason >= 0.5),
    majorityAllYears: acc(answered, () => trainFav >= 0.5),
  },
  brier: { app: brier(answered, (r) => r.p!), sameReasonBaseRate: brier(answered, (r) => r.baseReason), constant: brier(answered, () => trainFav) },
  calibration: bins,
  byReason,
  favourableActual: results.filter((r) => r.actual).length / Math.max(1, results.length),
};
console.log(JSON.stringify({ ...report, calibration: undefined, byReason: undefined }, null, 1));
console.table(bins);
console.table(byReason);
writeFileSync("data/processed/replay.json", JSON.stringify(report, null, 1));
