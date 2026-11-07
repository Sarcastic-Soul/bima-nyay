"use client";
import { useEffect, useState } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import type { Dict, Lang } from "@/lib/i18n";
import { track } from "./track";

const KEY = "bima-nyay:outcome";

export function DidItWork({ t, lang, reasonId }: { t: Dict; lang: Lang; reasonId: string }) {
  const [sent, setSent] = useState(false);
  useEffect(() => {
    try { if (localStorage.getItem(KEY)) setSent(true); } catch {}
  }, []);

  function answer(event: "outcome_ok" | "outcome_no" | "outcome_wait") {
    track(event, lang, reasonId);
    try { localStorage.setItem(KEY, event); } catch {}
    setSent(true);
  }

  return (
    <section className="no-print mt-14 border-t border-ink pt-8">
      <h2 className="font-serif text-[34px] md:text-[40px]">{t.outcomeTitle}</h2>
      <p className="mt-2 max-w-[40em] text-[17px] text-muted">{t.outcomeLede}</p>
      {sent ? (
        <p role="status" className="mt-5 flex items-center gap-2 font-medium"><CheckCircle size={22} weight="fill" className="text-accent" />{t.outcomeThanks}</p>
      ) : (
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="btn" onClick={() => answer("outcome_ok")}>{t.outcomeOk}</button>
          <button className="btn btn-ghost" onClick={() => answer("outcome_no")}>{t.outcomeNo}</button>
          <button className="btn btn-ghost" onClick={() => answer("outcome_wait")}>{t.outcomeWait}</button>
        </div>
      )}
    </section>
  );
}
