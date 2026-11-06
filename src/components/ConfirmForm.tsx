"use client";
import { ArrowLeft, MagnifyingGlass } from "@phosphor-icons/react";
import type { Dict, Lang } from "@/lib/i18n";
import type { LetterFields } from "@/lib/letter";
import { REASONS, REASON_IDS } from "@/lib/reasons";
import { STATES } from "@/lib/ombudsman/offices";
import type { Situation } from "./types";

type Props = {
  t: Dict; lang: Lang; fields: LetterFields; situation: Situation;
  onFields: (f: LetterFields) => void; onSituation: (s: Situation) => void;
  onBack: () => void; onSubmit: () => void;
};

/** Facts that change the rule check for this reason. */
function important(f: LetterFields): (keyof LetterFields)[] {
  const k: (keyof LetterFields)[] = ["letterDate"];
  if (["ped", "non_disclosure", "waiting_period"].includes(f.reasonId)) k.push("coverStartDate", "admissionDate");
  if (f.claimType === "reimbursement") k.push("claimSubmittedDate");
  return k;
}

export function ConfirmForm({ t, lang, fields: f, situation: s, onFields, onSituation, onBack, onSubmit }: Props) {
  const need = important(f);
  const set = <K extends keyof LetterFields>(k: K, v: LetterFields[K]) => onFields({ ...f, [k]: v });
  const miss = (k: keyof LetterFields) => (need.includes(k) && (f[k] === null || f[k] === "") ? "missing" : "");
  const text = (k: keyof LetterFields, label: string, type = "text", hint?: string) => (
    <div className={`field ${miss(k)}`}>
      <label htmlFor={k}>{label}</label>
      <input id={k} type={type} inputMode={type === "number" ? "numeric" : undefined}
        value={(f[k] as string | number | null) ?? ""}
        onChange={(e) => set(k, (e.target.value === "" ? null : type === "number" ? Number(e.target.value) : e.target.value) as never)} />
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
  const yesNo = (k: "fraudAlleged" | "accident", label: string) => (
    <fieldset className="field">
      <legend className="text-[15px] font-medium text-muted">{label}</legend>
      <div className="flex gap-2">
        {[true, false].map((v) => (
          <button type="button" key={String(v)} onClick={() => set(k, v)} aria-pressed={f[k] === v}
            className={`min-h-[44px] flex-1 rounded border-[1.5px] px-3 ${f[k] === v ? "border-accent bg-accent-soft font-bold" : "border-line bg-paper-2"}`}>
            {v ? t.yes : t.no}
          </button>
        ))}
      </div>
    </fieldset>
  );

  return (
    <form className="py-8 md:py-12" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <button type="button" onClick={onBack} className="mb-6 inline-flex min-h-[44px] items-center gap-2 text-[16px] text-muted hover:text-ink">
        <ArrowLeft size={18} /> {t.back}
      </button>
      <h2 className="font-serif text-[36px] leading-tight md:text-[44px]">{t.confirmTitle}</h2>
      <p className="mt-2 max-w-[40em] text-muted">{t.confirmLede}</p>

      <div className="mt-8 grid gap-10 md:grid-cols-[1.2fr_.8fr]">
        <div className="sheet relative grid gap-5 p-6 md:p-8">
          <span className="tab-label">{lang === "hi" ? "पत्र" : "LETTER"}</span>
          <div className="field">
            <label htmlFor="reasonText">{t.reasonText}</label>
            <textarea id="reasonText" rows={3} value={f.reasonText} onChange={(e) => set("reasonText", e.target.value)} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="reasonId">{t.reasonId}</label>
              <select id="reasonId" value={f.reasonId} onChange={(e) => set("reasonId", e.target.value)}>
                {REASON_IDS.map((r) => <option key={r} value={r}>{REASONS[r][lang]}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="claimType">{t.claimType}</label>
              <select id="claimType" value={f.claimType} onChange={(e) => set("claimType", e.target.value as LetterFields["claimType"])}>
                {(["reimbursement", "cashless", "unknown"] as const).map((c) => <option key={c} value={c}>{t[c]}</option>)}
              </select>
            </div>
            {text("insurer", t.insurer)}
            {text("diagnosis", t.diagnosis)}
            {text("policyNumber", t.policyNumber)}
            {text("claimNumber", t.claimNumber)}
            {text("patientName", t.patientName)}
            {text("letterDate", t.letterDate, "date")}
            {text("admissionDate", t.admissionDate, "date")}
            {text("claimSubmittedDate", t.claimSubmittedDate, "date")}
            {text("policyStartDate", t.policyStartDate, "date")}
            {text("claimAmount", t.claimAmount, "number")}
            {text("approvedAmount", t.approvedAmount, "number")}
            {text("waitingMonthsStated", t.waitingMonthsStated, "number")}
          </div>
          {text("coverStartDate", t.coverStartDate, "date", t.coverStartHint)}
          <div className="field">
            <label htmlFor="clauses">{t.clausesCited}</label>
            <input id="clauses" value={f.clausesCited.join(", ")}
              onChange={(e) => set("clausesCited", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} />
            <span className="hint">{t.clausesHint}</span>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {yesNo("fraudAlleged", t.fraudAlleged)}
            {yesNo("accident", t.accident)}
          </div>
        </div>

        <div className="grid content-start gap-5">
          <h3 className="font-serif text-[26px]">{t.whereTitle}</h3>
          <div className="field">
            <label htmlFor="state">{t.state}</label>
            <select id="state" value={s.state} onChange={(e) => onSituation({ ...s, state: e.target.value })}>
              <option value="">—</option>
              {STATES.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="district">{t.district}</label>
            <input id="district" value={s.district} onChange={(e) => onSituation({ ...s, district: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="gs">{t.grievanceSentDate}</label>
            <input id="gs" type="date" value={s.grievanceSentDate} onChange={(e) => onSituation({ ...s, grievanceSentDate: e.target.value, grievanceReplyDate: e.target.value ? s.grievanceReplyDate : "" })} />
            <span className="hint">{t.optional}</span>
          </div>
          {s.grievanceSentDate && (
            <div className="field">
              <label htmlFor="gr">{t.grievanceReplyDate}</label>
              <input id="gr" type="date" min={s.grievanceSentDate} value={s.grievanceReplyDate} onChange={(e) => onSituation({ ...s, grievanceReplyDate: e.target.value })} />
              <span className="hint">{t.optional}</span>
            </div>
          )}
          <button className="btn mt-4 w-full" type="submit" disabled={!f.reasonText}>
            <MagnifyingGlass size={20} weight="bold" /> {t.runCheck}
          </button>
        </div>
      </div>
    </form>
  );
}
