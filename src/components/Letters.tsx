"use client";
import { useEffect, useMemo, useState } from "react";
import { Copy, Check, DownloadSimple, Printer, WhatsappLogo } from "@phosphor-icons/react";
import type { Dict, Lang } from "@/lib/i18n";
import type { LetterFields } from "@/lib/letter";
import type { Finding } from "@/lib/rules/check";
import { grievanceLetter, ombudsmanComplaint, type Complainant } from "@/lib/letters";
import type { OmbudsmanOffice } from "@/lib/ombudsman/offices";
import { track } from "./track";

const KEY = "bima-nyay:complainant";

export function Letters({
  t, uiLang, fields, findings, office, grievanceSentDate, grievanceReplyDate, today,
}: {
  t: Dict; uiLang: Lang; fields: LetterFields; findings: Finding[]; office?: OmbudsmanOffice;
  grievanceSentDate?: string; grievanceReplyDate?: string; today: string;
}) {
  const [who, setWho] = useState<Complainant>({});
  const [kind, setKind] = useState<"grievance" | "ombudsman">(grievanceSentDate ? "ombudsman" : "grievance");
  const [lang, setLang] = useState<Lang>(uiLang);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try { const v = localStorage.getItem(KEY); if (v) setWho(JSON.parse(v)); } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(who)); } catch {}
  }, [who]);

  const text = useMemo(() => {
    const input = { fields, findings, complainant: who, today, grievanceSentDate, grievanceReplyDate, ombudsmanOffice: office };
    return kind === "grievance" ? grievanceLetter(input, lang) : ombudsmanComplaint(input, lang);
  }, [fields, findings, who, today, grievanceSentDate, grievanceReplyDate, office, kind, lang]);

  async function copy() {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); track("letter_copied", lang, fields.reasonId); } catch {}
  }
  function download() {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `bima-nyay-${kind}-${lang}.txt` });
    a.click();
    URL.revokeObjectURL(url);
    track("letter_downloaded", lang, fields.reasonId);
  }

  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    track("whatsapp_shared", lang, fields.reasonId);
  }

  const input = (k: keyof Complainant, label: string, type = "text") => (
    <div className="field">
      <label htmlFor={`c-${k}`}>{label}</label>
      <input id={`c-${k}`} type={type} autoComplete={k === "name" ? "name" : k === "phone" ? "tel" : k === "email" ? "email" : "street-address"}
        value={who[k] ?? ""} onChange={(e) => setWho({ ...who, [k]: e.target.value || undefined })} />
    </div>
  );

  return (
    <section className="mt-14 border-t border-ink pt-8">
      <h2 className="font-serif text-[34px] md:text-[40px]">{t.lettersTitle}</h2>
      <div className="mt-6 grid gap-8 md:grid-cols-[.7fr_1.3fr]">
        <div className="no-print grid content-start gap-4">
          {input("name", t.yourName)}
          {input("address", t.yourAddress)}
          {input("phone", t.yourPhone, "tel")}
          {input("email", t.yourEmail, "email")}
          <p className="text-[14px] text-muted">{t.detailsHint}</p>
        </div>
        <div>
          <div className="no-print flex flex-wrap items-center gap-2" role="tablist">
            {(["grievance", "ombudsman"] as const).map((k) => (
              <button key={k} role="tab" aria-selected={kind === k} onClick={() => setKind(k)}
                className={`min-h-[44px] rounded-t border-b-[3px] px-4 font-medium ${kind === k ? "border-accent text-ink" : "border-transparent text-muted"}`}>
                {k === "grievance" ? t.grievanceLetter : t.ombudsmanLetter}
              </button>
            ))}
            <span className="ml-auto flex items-center gap-1 text-[15px] text-muted">
              {t.letterLang}:
              {(["en", "hi"] as const).map((l) => (
                <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l}
                  className={`min-h-[44px] min-w-[44px] rounded px-2 ${lang === l ? "font-bold text-ink underline" : ""}`}>
                  {l === "en" ? "English" : "हिंदी"}
                </button>
              ))}
            </span>
          </div>
          <pre className="sheet mt-2 max-h-[560px] overflow-auto whitespace-pre-wrap p-6 font-sans text-[16px] leading-relaxed print:max-h-none print:shadow-none">{text}</pre>
          <div className="no-print mt-4 flex flex-wrap gap-3">
            <button className="btn" onClick={copy}>{copied ? <Check size={20} weight="bold" /> : <Copy size={20} />}{copied ? t.copied : t.copy}</button>
            <button className="btn btn-ghost" onClick={download}><DownloadSimple size={20} />{t.download}</button>
            <button className="btn btn-ghost" onClick={() => window.print()}><Printer size={20} />{t.print}</button>
            <button className="btn btn-ghost" onClick={shareWhatsApp}><WhatsappLogo size={20} />{t.shareWhatsApp}</button>
          </div>
        </div>
      </div>
    </section>
  );
}
