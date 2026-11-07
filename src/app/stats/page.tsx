import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { REASONS } from "@/lib/reasons";

export const metadata: Metadata = { title: "Usage | Bima Nyay", description: "Anonymous usage counts for Bima Nyay." };
export const revalidate = 300;

type Count = { event: string; n: number };
type ReasonCount = { reason_id: string; n: number };

const LABELS: Record<string, string> = {
  letter_read: "Letters read",
  sample_used: "Sample letters tried",
  report_shown: "Reports shown",
  letter_copied: "Complaint letters copied",
  letter_downloaded: "Complaint letters downloaded",
};

async function load() {
  try {
    const sql = db();
    const [events, reasons, langs, first] = await Promise.all([
      sql.query("select event, count(*)::int as n from events group by event") as unknown as Promise<Count[]>,
      sql.query("select reason_id, count(*)::int as n from events where event in ('letter_read','sample_used') and reason_id is not null group by reason_id order by n desc") as unknown as Promise<ReasonCount[]>,
      sql.query("select lang, count(*)::int as n from events where lang is not null group by lang") as unknown as Promise<{ lang: string; n: number }[]>,
      sql.query("select min(day)::text as day from events") as unknown as Promise<{ day: string | null }[]>,
    ]);
    return { events, reasons, langs, since: first[0]?.day ?? null };
  } catch {
    return null;
  }
}

export default async function Stats() {
  const d = await load();
  const get = (e: string) => d?.events.find((x) => x.event === e)?.n ?? 0;
  const hi = d?.langs.find((l) => l.lang === "hi")?.n ?? 0;
  const total = d?.langs.reduce((a, l) => a + l.n, 0) ?? 0;

  return (
    <div className="mx-auto max-w-[920px] px-4 sm:px-5">
      <nav className="flex items-center justify-between border-b border-line py-5">
        <Link href="/" className="font-serif text-[24px] font-semibold">
          Bima Nyay <small className="ml-1 font-sans text-[15px] font-medium text-muted">बीमा न्याय</small>
        </Link>
        <Link href="/evidence" className="text-[16px] font-medium underline underline-offset-4">Evidence</Link>
      </nav>
      <main className="py-10 md:py-14">
        <h1 className="font-serif text-[40px] leading-[1.1] md:text-[56px]">Usage</h1>
        <p className="mt-4 max-w-[640px] text-[19px] text-muted">
          Live counts. No names, letters or images are stored: only which step was reached, the language, and the rejection
          reason.{d?.since ? ` Counting since ${d.since}.` : ""}
        </p>
        {!d ? (
          <p className="mt-10">Counts are not available right now.</p>
        ) : (
          <>
            <div className="mt-10 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2">
              {Object.keys(LABELS).map((e) => (
                <div key={e} className="bg-sheet p-6">
                  <div className="font-serif text-[48px] leading-none tabular-nums">{get(e).toLocaleString("en-IN")}</div>
                  <div className="mt-3 font-semibold">{LABELS[e]}</div>
                </div>
              ))}
              <div className="bg-sheet p-6">
                <div className="font-serif text-[48px] leading-none tabular-nums">{total ? Math.round((100 * hi) / total) : 0}%</div>
                <div className="mt-3 font-semibold">Actions in Hindi</div>
              </div>
            </div>
            {d.reasons.length > 0 && (
              <>
                <h2 className="mt-12 font-serif text-[28px]">Rejection reasons seen</h2>
                <table className="mt-4 w-full border-collapse text-left text-[16px]">
                  <tbody>
                    {d.reasons.map((r) => (
                      <tr key={r.reason_id} className="border-b border-line">
                        <td className="py-2 pr-4">{REASONS[r.reason_id as keyof typeof REASONS]?.en ?? r.reason_id}</td>
                        <td className="py-2 text-right tabular-nums">{r.n}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
