"use client";
import { ArrowSquareOut, CheckCircle, Circle, SpinnerGap, WarningOctagon } from "@phosphor-icons/react";
import { fmtDate, type Dict, type Lang } from "@/lib/i18n";
import type { LetterFields } from "@/lib/letter";
import { REASONS, type ReasonId } from "@/lib/reasons";
import { RULES } from "@/lib/rules/sources";
import { FINDING_HI } from "@/lib/rules/hi";
import { COMPLAINT_CHANNELS } from "@/lib/ombudsman/offices";
import type { DeadlineStep } from "@/lib/deadlines";
import type { ReportState } from "./types";

const ruleById = new Map(RULES.map((r) => [r.id, r]));
const TOOL_ORDER = ["check_rules", "find_similar_cases", "compute_deadlines", "find_ombudsman_office"];

function Progress({ t, steps, done }: { t: Dict; steps: string[]; done: boolean }) {
  return (
    <ol className="grid gap-2" aria-live="polite">
      {TOOL_ORDER.filter((s) => steps.includes(s) || !done).map((s) => {
        const started = steps.includes(s);
        return (
          <li key={s} className={`flex items-center gap-3 text-[16px] ${started ? "" : "text-muted"}`}>
            {started ? <CheckCircle size={20} weight="fill" className="text-accent" /> : <Circle size={20} />}
            {t[`tool${s}` as keyof Dict] as string}
          </li>
        );
      })}
      {!done && <li className="flex items-center gap-3 text-[16px] text-muted"><SpinnerGap size={20} className="animate-spin" />{t.working}</li>}
    </ol>
  );
}

function deadlineText(t: Dict, d: DeadlineStep) {
  const f = fmtDate;
  if (d.id === "grievance") return d.status === "done" ? t.dl_grievance_done(f(d.from)) : t.dl_grievance_todo;
  if (d.id === "insurer_reply")
    return d.status === "done" ? t.dl_insurer_reply_done(f(d.from)) : d.status === "missed" ? t.dl_insurer_reply_missed(f(d.until)) : t.dl_insurer_reply_waiting(f(d.until));
  if (!d.until) return t.dl_ombudsman_waiting_nogrievance;
  if (d.status === "waiting") return t.dl_ombudsman_waiting(f(d.from), f(d.until));
  if (d.status === "missed") return t.dl_ombudsman_missed(f(d.until));
  if (d.status === "closing_soon") return t.dl_ombudsman_closing_soon(f(d.until), d.daysLeft ?? 0);
  return t.dl_ombudsman_open(f(d.until), d.daysLeft ?? 0);
}

export function Report({ t, lang, fields, r }: { t: Dict; lang: Lang; fields: LetterFields; r: ReportState }) {
  const s = r.summary;
  const o = r.cases?.outcomes;
  return (
    <div className="grid gap-10 md:grid-cols-[1.15fr_.85fr]">
      <article className="sheet relative p-6 md:p-8">
        <span className="tab-label">{t.yourCase}</span>
        <h2 className="mt-1 font-serif text-[28px] font-semibold leading-tight md:text-[34px]">
          {REASONS[fields.reasonId as ReasonId]?.[lang] ?? fields.reasonText}
        </h2>
        <p className="text-[15px] text-muted">
          {[fields.insurer, fields.claimAmount ? `Rs ${fields.claimAmount.toLocaleString("en-IN")}` : null, fields.letterDate ? fmtDate(fields.letterDate) : null].filter(Boolean).join(" · ")}
        </p>

        {s ? (
          <div className="mt-5 border-l-4 border-accent bg-accent-soft px-5 py-4">
            <p className="verdict text-accent">{t[`strength_${s.strength}` as keyof Dict] as string}</p>
            <p className="mt-1 text-[18px]">{lang === "hi" ? s.summary_hi : s.summary_en}</p>
            <p className="mt-3 font-bold">{lang === "hi" ? s.next_step_hi : s.next_step_en}</p>
          </div>
        ) : r.error ? (
          <p role="alert" className="mt-5 flex gap-2 border-l-4 border-warn bg-warn-soft px-5 py-4"><WarningOctagon size={22} className="shrink-0 text-warn" />{t.busy}</p>
        ) : (
          <div className="mt-5"><Progress t={t} steps={r.steps} done={r.done} /></div>
        )}

        {r.findings && (
          <section className="mt-8">
            <h3 className="font-serif text-[24px]">{t.rulesTitle}</h3>
            <ul className="mt-2">
              {r.findings.map((f) => {
                const hi = lang === "hi" ? FINDING_HI[f.id] : undefined;
                return (
                  <li key={f.id} className="grid gap-2 border-t border-line py-4 sm:grid-cols-[130px_1fr] sm:gap-4">
                    <span className={`verdict ${f.verdict === "rule_broken" ? "text-warn" : f.verdict === "worth_checking" ? "text-ink" : "text-accent"}`}>
                      {t[`v_${f.verdict}` as keyof Dict] as string}
                    </span>
                    <div>
                      <b className="block">{hi?.title ?? f.title}</b>
                      <span className="text-[17px]">{hi?.why ?? f.why}</span>
                      {f.ruleIds.map((id) => {
                        const rule = ruleById.get(id);
                        return rule ? (
                          <details key={id} className="mt-1 text-[14px] text-muted">
                            <summary className="cursor-pointer">{t.source}: {rule.location}</summary>
                            <blockquote className="mt-1 border-l-2 border-line pl-3 italic">“{rule.quote}”</blockquote>
                            <a className="inline-flex items-center gap-1 underline" href={rule.url} target="_blank" rel="noreferrer">PDF <ArrowSquareOut size={14} /></a>
                          </details>
                        ) : null;
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </article>

      <div className="grid content-start gap-8">
        {s && <div className="no-print"><Progress t={t} steps={r.steps} done /></div>}
        {r.cases && o && (
          <section>
            <h3 className="font-serif text-[24px]">{t.casesTitle}</h3>
            {o.abstain ? (
              <p className="mt-2 border-l-4 border-line pl-4 text-[17px]">{t.abstain}</p>
            ) : (
              <div className="mt-2">
                <p><span className="font-serif text-[44px] font-semibold leading-none text-accent">
                  {t.casesOf(Math.round(o.favourable * o.n), o.n)}</span> {t.casesLine}</p>
                <div className="mt-3 flex h-3 w-full overflow-hidden rounded-sm bg-line" aria-hidden>
                  <span className="bg-accent" style={{ width: `${o.favourable * 100}%` }} />
                </div>
                <p className="mt-2 text-[15px] text-muted">{t.casesRange(Math.round(o.low * 100), Math.round(o.high * 100))}</p>
              </div>
            )}
            {r.cases.hits.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer font-medium">{t.closest} ({Math.min(5, r.cases.hits.length)})</summary>
                <ul className="mt-2 grid gap-3">
                  {r.cases.hits.slice(0, 5).map((h) => (
                    <li key={h.id} className="border-t border-line pt-3 text-[15px]">
                      <span className="verdict">{t[`outcome_${h.outcome}` as keyof Dict] as string}</span>
                      <span className="text-muted"> · {h.forum} · {h.year}</span>
                      <p>{h.facts}</p>
                      {h.source_url && <a className="text-[14px] text-muted underline" href={h.source_url} target="_blank" rel="noreferrer">{h.source_ref}</a>}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>
        )}

        {r.deadlines && (
          <section>
            <h3 className="font-serif text-[24px]">{t.deadlinesTitle}</h3>
            <ol className="mt-2 grid gap-3">
              {r.deadlines.map((d) => (
                <li key={d.id} className={`border-l-4 pl-4 ${d.status === "missed" || d.status === "closing_soon" ? "border-warn" : d.status === "done" ? "border-line" : "border-accent"}`}>
                  {deadlineText(t, d)}
                </li>
              ))}
            </ol>
          </section>
        )}

        {r.office?.office && (
          <section>
            <h3 className="font-serif text-[24px]">{t.officeTitle}</h3>
            <p className="mt-2 font-bold">{r.office.office.city}</p>
            <p className="text-[16px]">{r.office.office.address}</p>
            <p className="text-[16px] text-muted">{[...r.office.office.phone.slice(0, 1), ...r.office.office.email.slice(0, 1)].join(" · ")}</p>
            {!r.office.certain && <p className="mt-1 text-[14px] text-muted">{t.officeUnsure}</p>}
            <a className="mt-2 inline-flex min-h-[44px] items-center gap-1 font-medium text-accent underline" href={COMPLAINT_CHANNELS.ombudsmanOnline} target="_blank" rel="noreferrer">
              {t.fileOnline} <ArrowSquareOut size={16} />
            </a>
          </section>
        )}
      </div>
    </div>
  );
}
