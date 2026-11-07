"use client";
import { useEffect, useState } from "react";
import { ArrowCounterClockwise, GithubLogo } from "@phosphor-icons/react";
import { DICT, type Lang } from "@/lib/i18n";
import { LetterFields as LetterFieldsSchema, type LetterFields } from "@/lib/letter";
import { Landing } from "./Landing";
import { ConfirmForm } from "./ConfirmForm";
import { Report } from "./Report";
import { Letters } from "./Letters";
import { DidItWork } from "./DidItWork";
import { track } from "./track";
import type { ReportState, Situation } from "./types";

const EMPTY: LetterFields = {
  insurer: null, policyNumber: null, claimNumber: null, patientName: null, letterDate: null, coverStartDate: null,
  policyStartDate: null, admissionDate: null, claimSubmittedDate: null, claimAmount: null, approvedAmount: null,
  claimType: "reimbursement", diagnosis: null, reasonText: "", reasonId: "other", clausesCited: [],
  waitingMonthsStated: null, fraudAlleged: false, accident: null,
};

type Stage = "upload" | "confirm" | "report";

export function BimaApp() {
  const [lang, setLang] = useState<Lang>("en");
  const t = DICT[lang];
  const [stage, setStage] = useState<Stage>("upload");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [fields, setFields] = useState<LetterFields>(EMPTY);
  const [situation, setSituation] = useState<Situation>({ state: "", district: "", grievanceSentDate: "", grievanceReplyDate: "" });
  const [report, setReport] = useState<ReportState>({ steps: [], done: false });
  const [today, setToday] = useState("");
  const [savedNote, setSavedNote] = useState(false);

  useEffect(() => {
    try { const l = localStorage.getItem("bima-nyay:lang"); if (l === "hi" || l === "en") setLang(l); } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem("bima-nyay:lang", lang); } catch {}
  }, [lang]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [stage]);

  async function onFile(file: File, sample = false, saved?: unknown) {
    setBusy(true);
    setError(undefined);
    setSavedNote(false);
    // Sample letters are made up and come with known answers. If the reader is down, use those answers and say so.
    const loadSaved = () => {
      const ok = sample ? LetterFieldsSchema.safeParse(saved) : null;
      if (!ok?.success) return false;
      setFields(ok.data);
      setSavedNote(true);
      setStage("confirm");
      track("sample_used", lang, ok.data.reasonId);
      return true;
    };
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body });
      const j = await res.json();
      if (j.ok) {
        setFields(j.fields);
        setStage("confirm");
        track(sample ? "sample_used" : "letter_read", lang, j.fields.reasonId);
      } else if (!loadSaved()) setError(res.status === 503 || res.status === 429 ? t.busy : t.readFail);
    } catch {
      if (!loadSaved()) setError(t.busy);
    } finally {
      setBusy(false);
    }
  }

  async function runReport() {
    setStage("report");
    const r: ReportState = { steps: [], done: false };
    setReport({ ...r });
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fields,
          state: situation.state || undefined,
          district: situation.district || undefined,
          grievanceSentDate: situation.grievanceSentDate || undefined,
          grievanceReplyDate: situation.grievanceReplyDate || undefined,
        }),
      });
      if (!res.ok || !res.body) throw new Error(String(res.status));
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line);
          if (ev.type === "start") setToday(ev.today);
          else if (ev.type === "tool") r.steps = [...r.steps, ev.name];
          else if (ev.type === "findings") r.findings = ev.findings;
          else if (ev.type === "cases") r.cases = { hits: ev.hits, outcomes: ev.outcomes };
          else if (ev.type === "deadlines") r.deadlines = ev.steps;
          else if (ev.type === "office") r.office = ev.office;
          else if (ev.type === "summary") r.summary = ev.summary;
          else if (ev.type === "error") r.error = ev.message;
          setReport({ ...r });
        }
      }
      if (r.summary) track("report_shown", lang, fields.reasonId);
    } catch {
      r.error = "service_busy";
    }
    r.done = true;
    setReport({ ...r });
  }

  function restart() {
    setStage("upload");
    setFields(EMPTY);
    setReport({ steps: [], done: false });
    setError(undefined);
    setSavedNote(false);
  }

  return (
    <div className="mx-auto max-w-[1180px] px-4 sm:px-5">
      <nav className="no-print flex items-center justify-between border-b border-line py-5">
        <button onClick={restart} className="font-serif text-[24px] font-semibold">
          Bima Nyay <small className="ml-1 font-sans text-[15px] font-medium text-muted">बीमा न्याय</small>
        </button>
        <button onClick={() => setLang(lang === "en" ? "hi" : "en")} lang={lang === "en" ? "hi" : "en"}
          className="min-h-[44px] rounded-full border border-ink px-4 text-[15px] font-medium hover:bg-paper-2">
          {t.switchLang}
        </button>
      </nav>

      <main>
        {stage === "upload" && (
          <Landing t={t} lang={lang} busy={busy} error={error} onFile={onFile}
            onManual={() => { setFields(EMPTY); setStage("confirm"); }} />
        )}
        {stage === "confirm" && savedNote && (
          <p role="status" className="mt-6 border-l-4 border-accent bg-accent-soft px-4 py-3 text-[16px]">{t.sampleSaved}</p>
        )}
        {stage === "confirm" && (
          <ConfirmForm t={t} lang={lang} fields={fields} situation={situation} onFields={setFields}
            onSituation={setSituation} onBack={() => setStage("upload")} onSubmit={runReport} />
        )}
        {stage === "report" && (
          <div className="py-8 md:py-12">
            <Report t={t} lang={lang} fields={fields} r={report} />
            {report.findings && today && (
              <Letters t={t} uiLang={lang} fields={fields} findings={report.findings} office={report.office?.office}
                grievanceSentDate={situation.grievanceSentDate || undefined}
                grievanceReplyDate={situation.grievanceReplyDate || undefined} today={today} />
            )}
            {report.findings && <DidItWork t={t} lang={lang} reasonId={fields.reasonId} />}
            <button onClick={restart} className="btn btn-ghost no-print mt-10"><ArrowCounterClockwise size={20} />{t.startOver}</button>
          </div>
        )}
      </main>

      <footer className="no-print mt-6 flex flex-col gap-3 border-t border-line py-8 text-[15px] text-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[42em]">{t.disclaimer}</p>
        <div className="flex gap-5">
          <a className="underline" href="/evidence">{t.evidence}</a>
          <a className="inline-flex items-center gap-1 underline" href="https://github.com/Sarcastic-Soul/bima-nyay"><GithubLogo size={16} />{t.github}</a>
        </div>
      </footer>
    </div>
  );
}
