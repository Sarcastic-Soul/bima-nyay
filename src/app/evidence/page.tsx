import type { Metadata } from "next";
import Link from "next/link";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { RULES } from "@/lib/rules/sources";
import { REASONS } from "@/lib/reasons";

export const metadata: Metadata = {
  title: "Evidence | Bima Nyay",
  description: "How well Bima Nyay's estimates matched real Insurance Ombudsman decisions, replayed in time order.",
};

type Replay = {
  ranAt: string;
  settings: { testFrom: number; minCases: number; minSimilarity: number; k: number };
  corpus: { total: number; train: number; test: number; years: [number, number] };
  answeredShare: number;
  answered: number;
  abstained: number;
  accuracy: { app: number; sameReasonBaseRate: number; majorityAllYears: number };
  brier: { app: number; sameReasonBaseRate: number; constant: number };
  calibration: { from: number; to: number; n: number; predicted: number; actual: number }[];
  byReason: { reason: string; n: number; answered: number; accuracy: number | null; favourableActual: number }[];
  favourableActual: number;
};
type Extract = { ranAt: string; ok: number; total: number; rows: { sample: string; field: string; ok: boolean }[] };

function load<T>(file: string): T | null {
  const p = path.join(process.cwd(), "data/processed", file);
  return existsSync(p) ? (JSON.parse(readFileSync(p, "utf8")) as T) : null;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const reasonLabel = (id: string) => REASONS[id as keyof typeof REASONS]?.en ?? id;

export default function Evidence() {
  const r = load<Replay>("replay.json");
  const x = load<Extract>("eval-extract.json");
  const reasonOk = x?.rows.filter((row) => row.field === "reasonId");

  return (
    <div className="mx-auto max-w-[920px] px-4 sm:px-5">
      <nav className="flex items-center justify-between border-b border-line py-5">
        <Link href="/" className="font-serif text-[24px] font-semibold">
          Bima Nyay <small className="ml-1 font-sans text-[15px] font-medium text-muted">बीमा न्याय</small>
        </Link>
        <Link href="/" className="text-[16px] font-medium underline underline-offset-4">Check a letter</Link>
      </nav>

      <main className="py-10 md:py-14">
        <h1 className="font-serif text-[40px] leading-[1.1] md:text-[56px]">Does it work?</h1>
        <p className="mt-4 max-w-[640px] text-[19px] text-muted">
          We have no field users yet, so we tested Bima Nyay on real decisions instead. Every number below comes from a
          script in the repository that anyone can re-run.
        </p>

        {r ? (
          <section className="mt-12">
            <h2 className="font-serif text-[30px]">1. Replaying {r.corpus.test.toLocaleString("en-IN")} real Ombudsman decisions</h2>
            <p className="mt-3 max-w-[680px]">
              We took {r.corpus.total.toLocaleString("en-IN")} health-insurance awards published by the Council for Insurance
              Ombudsmen ({r.corpus.years[0]} to {r.corpus.years[1]}). For each decision from {r.settings.testFrom} onwards, the
              app was only allowed to see decisions from <em>earlier years</em>, as if it were running back then. It then made
              the same estimate a user sees: &ldquo;in close past cases, the complainant got something in X%&rdquo;, or it said
              there were too few cases to tell.
            </p>

            <div className="mt-8 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-3">
              <Stat big={pct(r.accuracy.app)} label="right call when it answered" sub={`on ${r.answered.toLocaleString("en-IN")} cases`} />
              <Stat big={pct(r.accuracy.sameReasonBaseRate)} label="simple baseline" sub="same rejection reason, no case matching" />
              <Stat big={pct(1 - r.answeredShare)} label="said 'too few cases'" sub={`needs ${r.settings.minCases}+ cases at similarity ≥ ${r.settings.minSimilarity}`} />
            </div>

            <h3 className="mt-10 text-[20px] font-bold">Are the percentages honest?</h3>
            <p className="mt-2 max-w-[680px] text-muted">
              When the app says &ldquo;about 60%&rdquo;, roughly 60% of those people should have won. Lower Brier score is better:
              app {r.brier.app.toFixed(3)}, same-reason baseline {r.brier.sameReasonBaseRate.toFixed(3)}, one fixed rate for
              everyone {r.brier.constant.toFixed(3)}.
            </p>
            <table className="mt-4 w-full border-collapse text-left text-[16px]">
              <thead>
                <tr className="border-b-2 border-ink">
                  <th className="py-2 pr-4 font-semibold">App said</th>
                  <th className="py-2 pr-4 font-semibold">Cases</th>
                  <th className="py-2 pr-4 font-semibold">Average estimate</th>
                  <th className="py-2 font-semibold">Actually got something</th>
                </tr>
              </thead>
              <tbody>
                {r.calibration.filter((b) => b.n > 0).map((b) => (
                  <tr key={b.from} className="border-b border-line">
                    <td className="py-2 pr-4">{pct(b.from)} to {pct(b.to)}</td>
                    <td className="py-2 pr-4 tabular-nums">{b.n}</td>
                    <td className="py-2 pr-4 tabular-nums">{pct(b.predicted)}</td>
                    <td className="py-2 tabular-nums font-semibold">{pct(b.actual)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 className="mt-10 text-[20px] font-bold">By rejection reason</h3>
            <table className="mt-4 w-full border-collapse text-left text-[16px]">
              <thead>
                <tr className="border-b-2 border-ink">
                  <th className="py-2 pr-4 font-semibold">Reason</th>
                  <th className="py-2 pr-4 font-semibold">Decisions</th>
                  <th className="py-2 pr-4 font-semibold">Complainant got something</th>
                  <th className="py-2 font-semibold">App right</th>
                </tr>
              </thead>
              <tbody>
                {r.byReason.map((b) => (
                  <tr key={b.reason} className="border-b border-line">
                    <td className="py-2 pr-4">{reasonLabel(b.reason)}</td>
                    <td className="py-2 pr-4 tabular-nums">{b.n}</td>
                    <td className="py-2 pr-4 tabular-nums">{pct(b.favourableActual)}</td>
                    <td className="py-2 tabular-nums">{b.accuracy === null ? "too few" : `${pct(b.accuracy)} of ${b.answered}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-[15px] text-muted">
              Across all replayed decisions, the complainant got some or all of the money back in {pct(r.favourableActual)} of
              cases. Many people never complain at all, so this is the part of the problem the app is built to change.
            </p>
          </section>
        ) : (
          <p className="mt-10 text-muted">Replay results not generated yet. Run <code>scripts/replay.mts</code>.</p>
        )}

        {x && (
          <section className="mt-14">
            <h2 className="font-serif text-[30px]">2. Reading the letter</h2>
            <p className="mt-3 max-w-[680px]">
              Six made-up rejection letters (two styled to look like phone photos, one in Hindi) were read by the same code
              the app uses. {x.ok} of {x.total} key fields ({pct(x.ok / x.total)}) matched the answers we wrote down when we
              made the letters, and the rejection reason was right in {reasonOk?.filter((row) => row.ok).length} of{" "}
              {reasonOk?.length}. This is a small test on clean, synthetic images. We have not yet tested real phone photos.
              When the app is unsure it leaves a field blank and highlights it, so the user fills it in before anything else
              happens.
            </p>
          </section>
        )}

        <section className="mt-14">
          <h2 className="font-serif text-[30px]">3. Every rule is quoted, not invented</h2>
          <p className="mt-3 max-w-[680px]">
            The rule checker uses {RULES.length} rules from IRDAI and Insurance Ombudsman regulations. An automated test checks
            that each quote appears word for word in the official document and that each link points to an official site.
            Where no rule exists (for example, room-rent deductions), the app says so instead of making one up.
          </p>
        </section>

        <section className="mt-14 border-t border-line pt-8 text-[16px] text-muted">
          <h2 className="font-sans text-[18px] font-bold text-ink">Limits</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>The awards are from 2004 to 2014. Rules have become more favourable to policyholders since then, for example the 5-year moratorium from 2024.</li>
            <li>Each award was labelled (reason and outcome) by an AI model (Gemini 3.5 Flash-Lite), not by a lawyer, and the labels have not been checked by hand yet.</li>
            <li>We have no field users yet. Every number on this page comes from past decisions or made-up letters, not from people who used the app.</li>
            <li>This is not legal advice. It helps people use the free complaint routes the law already gives them.</li>
          </ul>
          {r && <p className="mt-4">Replay run on {r.ranAt.slice(0, 10)}.</p>}
        </section>
      </main>
    </div>
  );
}

function Stat({ big, label, sub }: { big: string; label: string; sub: string }) {
  return (
    <div className="bg-sheet p-6">
      <div className="font-serif text-[48px] leading-none tabular-nums">{big}</div>
      <div className="mt-3 font-semibold">{label}</div>
      <div className="mt-1 text-[15px] text-muted">{sub}</div>
    </div>
  );
}
