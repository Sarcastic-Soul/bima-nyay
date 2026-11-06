"use client";
import { useRef, useState } from "react";
import { Camera, FileText, SpinnerGap } from "@phosphor-icons/react";
import type { Dict } from "@/lib/i18n";

export const SAMPLES = [
  { file: "1-non_disclosure.png", en: "Hidden BP, 6 years of cover", hi: "BP छिपाया, 6 साल का बीमा" },
  { file: "3-documents.png", en: "Papers sent late", hi: "कागज़ देर से भेजे" },
  { file: "2-ped.png", en: "48-month waiting period", hi: "48 महीने की प्रतीक्षा" },
  { file: "4-waiting_period.png", en: "Cataract in year 2", hi: "दूसरे साल में मोतियाबिंद" },
  { file: "6-not_necessary.png", en: "Hindi letter: OPD case", hi: "हिंदी पत्र: OPD मामला" },
];

export function Landing({
  t, lang, busy, error, onFile, onManual,
}: {
  t: Dict; lang: "en" | "hi"; busy: boolean; error?: string;
  onFile: (f: File, sample?: boolean) => void; onManual: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  async function pickSample(file: string) {
    const blob = await fetch(`/samples/${file}`).then((r) => r.blob());
    onFile(new File([blob], file, { type: "image/png" }), true);
  }

  return (
    <>
      <section className="grid gap-12 py-10 md:grid-cols-[1.1fr_.9fr] md:gap-14 md:py-16">
        <div>
          <h1 className="font-serif text-[42px] leading-[1.03] tracking-[-0.02em] md:text-[64px]">
            {t.heroA} <em className="text-accent">{t.heroB}</em>
          </h1>
          <p className="mt-5 max-w-[32em] text-[19px] text-muted md:text-[20px]">{t.lede}</p>

          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
            className={`mt-9 flex flex-col gap-4 rounded-md border-2 border-dashed border-accent p-6 sm:flex-row sm:items-center ${drag ? "bg-accent-soft" : "bg-paper-2"}`}
          >
            <div className="flex-1">
              <b className="block text-[20px]">{busy ? t.reading : t.uploadTitle}</b>
              <span className="text-[16px] text-muted">{t.uploadHint}</span>
            </div>
            <input ref={input} type="file" accept="image/*,application/pdf" className="sr-only" id="letter"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
            <button className="btn" disabled={busy} onClick={() => input.current?.click()}>
              {busy ? <SpinnerGap size={20} className="animate-spin" /> : <Camera size={20} weight="bold" />}
              {t.takePhoto}
            </button>
          </div>
          {error && <p role="alert" className="mt-3 border-l-4 border-warn bg-warn-soft px-4 py-3 text-[16px]">{error} <button className="font-bold underline" onClick={onManual}>{t.fillManually}</button></p>}

          <p className="mt-5 text-[16px] text-muted">{t.trySample}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {SAMPLES.map((s) => (
              <li key={s.file}>
                <button disabled={busy} onClick={() => pickSample(s.file)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line bg-sheet px-4 text-[15px] hover:border-accent disabled:opacity-50">
                  <FileText size={16} /> {s[lang]}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <aside className="sheet relative self-start p-6 md:p-7" aria-label="Example result">
          <span className="tab-label">{t.yourCase}</span>
          <h3 className="mt-1 font-serif text-[24px] font-semibold">{lang === "hi" ? "हाई BP छिपाने का आरोप" : "Non-disclosure of hypertension"}</h3>
          <p className="text-[15px] text-muted">{lang === "hi" ? "क्लेम रु 1,85,000 · 01/10/2026 को रिजेक्ट" : "Claim Rs 1,85,000 · rejected 01/10/2026"}</p>
          <div className="mt-4 grid grid-cols-[110px_1fr] gap-3 border-t border-line py-4">
            <span className="verdict text-warn">{t.v_rule_broken}</span>
            <div>{lang === "hi" ? "बीमा 90 महीने से चालू है। 60 महीने बाद धोखाधड़ी साबित किए बिना 'जानकारी छिपाने' पर क्लेम रिजेक्ट नहीं हो सकता।" : "Cover has run 90 months. After 60 months, non-disclosure cannot be used unless fraud is proven."}
              <div className="mt-1 text-[14px] text-muted">IRDAI Master Circular on Health Insurance 2024, para 13</div></div>
          </div>
          <div className="grid grid-cols-[110px_1fr] gap-3 border-t border-line py-4">
            <span className="verdict text-accent">{lang === "hi" ? "पुराने फ़ैसले" : "Past cases"}</span>
            <div className="text-[15px] text-muted">{lang === "hi" ? "मिलते-जुलते लोकपाल फ़ैसलों की गिनती, या साफ़ 'पता नहीं'।" : "Counts from similar Ombudsman decisions, or a plain 'we don't know'."}</div>
          </div>
          <div className="grid grid-cols-[110px_1fr] gap-3 border-t border-line pt-4">
            <span className="verdict">{lang === "hi" ? "समय-सीमा" : "Deadline"}</span>
            <div>{lang === "hi" ? "आज ही कंपनी को शिकायत भेजें। जवाब 14 दिन में।" : "Send grievance to insurer now. Reply due in 14 days."}</div>
          </div>
        </aside>
      </section>

      <section className="grid grid-cols-1 gap-6 border-t border-ink pb-14 pt-7 sm:grid-cols-2 md:grid-cols-4">
        {([[t.step1, t.step1d], [t.step2, t.step2d], [t.step3, t.step3d], [t.step4, t.step4d]] as const).map(([h, d], i) => (
          <div key={h} className="text-[16px]"><b className="mb-1 block font-serif text-[22px] font-semibold">{i + 1}. {h}</b>{d}</div>
        ))}
      </section>
    </>
  );
}
