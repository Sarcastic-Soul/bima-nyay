/**
 * Split the GIC Ombudsman "Mediclaim" award books (pdftotext -layout output)
 * into one record per award. Output: data/processed/gic-awards.jsonl
 *
 * Layouts differ between books, so we look for "header anchors": a line that is
 * only "Vs"/"Vrs"/"Versus", an "Award dated" line, or a "Case/Complaint No" line.
 * Anchors that sit close together form one award header. Each award runs from
 * its header to the next header.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RAW = join(process.cwd(), "data/raw/ombudsman-gic");
const OUT = join(process.cwd(), "data/processed/gic-awards.jsonl");

const VS = /^\s*(vrs?\.?|versus|vs\.?|v\/s\.?)\s*$/i;
const AWARD = /a\s?w\s?ard\s+dated|date\s+of\s+award/i;
const CASENO = /(case|complaint)\s*no\b/i;
const CENTRE = /ombudsman\s+cent(re|er)/i;
const STARS = /^\s*\*{5,}\s*$/;

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

export function parseAwardDate(line: string): string | null {
  const s = line
    .replace(/\s+/g, " ")
    .replace(/(\d)\s*([./-])\s*(\d)/g, "$1$2$3")
    .replace(/(\d)\s+(st|nd|rd|th)\b/gi, "$1$2");
  let m = s.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (m) {
    let y = Number(m[3]);
    if (y < 100) y += 2000;
    const mo = Number(m[2]);
    const d = Number(m[1]);
    if (y >= 2000 && y <= 2016 && mo >= 1 && mo <= 12 && d >= 1 && d <= 31)
      return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  m = s.match(/(\d{1,2})\s*(?:st|nd|rd|th)?\s*,?\s*([A-Za-z]{3,})\.?,?\s*(\d{4})/);
  if (m) {
    const mo = MONTHS[m[2].slice(0, 3).toLowerCase()];
    const y = Number(m[3]);
    if (mo && y >= 2000 && y <= 2016)
      return `${y}-${String(mo).padStart(2, "0")}-${String(Number(m[1])).padStart(2, "0")}`;
  }
  m = s.match(/([A-Za-z]{3,})\.?\s*,?\s*(\d{4})/);
  if (m) {
    const mo = MONTHS[m[1].slice(0, 3).toLowerCase()];
    const y = Number(m[2]);
    if (mo && y >= 2000 && y <= 2016) return `${y}-${String(mo).padStart(2, "0")}-01`;
  }
  return null;
}

type Award = {
  id: string;
  book: string;
  centre: string | null;
  case_no: string | null;
  complainant: string | null;
  insurer: string | null;
  award_date: string | null;
  year: number | null;
  text: string;
};

function clean(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function splitBook(book: string, text: string): Award[] {
  const lines = text.split("\n");
  const isAnchor = (i: number) =>
    VS.test(lines[i]) || AWARD.test(lines[i]) || (CASENO.test(lines[i]) && lines[i].trim().length < 90);

  // Group anchors into headers (anchors within 10 lines of each other).
  const headers: { start: number; end: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (!isAnchor(i)) continue;
    const last = headers[headers.length - 1];
    if (last && i - last.end <= 10) last.end = i;
    else headers.push({ start: i, end: i });
  }
  // Pull each header start back to a nearby "Ombudsman Centre" / case line.
  for (const h of headers) {
    for (let j = h.start - 1; j >= Math.max(0, h.start - 6); j--) {
      if (STARS.test(lines[j])) break;
      if (CENTRE.test(lines[j]) || CASENO.test(lines[j]) || /in the matter of/i.test(lines[j])) h.start = j;
    }
  }

  const out: Award[] = [];
  headers.forEach((h, k) => {
    const stop = k + 1 < headers.length ? headers[k + 1].start : lines.length;
    const chunk = lines.slice(h.start, stop).filter((l) => !STARS.test(l));
    const head = lines.slice(h.start, h.end + 1);
    const vsIdx = head.findIndex((l) => VS.test(l));
    const awardLine = head.find((l) => AWARD.test(l)) ?? chunk.slice(0, 15).find((l) => AWARD.test(l)) ?? "";
    const caseLine = head.find((l) => CASENO.test(l)) ?? "";
    const centreLine = lines.slice(Math.max(0, h.start - 1), h.end + 1).find((l) => CENTRE.test(l));
    const nonEmpty = (arr: string[]) => arr.map((l) => l.trim()).filter(Boolean);
    let complainant: string | null = null;
    let insurer: string | null = null;
    if (vsIdx >= 0) {
      const before = nonEmpty(head.slice(0, vsIdx)).filter((l) => !CASENO.test(l) && !CENTRE.test(l));
      complainant = before.length ? clean(before[before.length - 1].replace(/in the matter of/i, "")) : null;
      const after = nonEmpty(lines.slice(h.start + vsIdx + 1, h.start + vsIdx + 4)).filter((l) => !AWARD.test(l));
      insurer = after.length ? clean(after[0]) : null;
    }
    const body = clean(chunk.join("\n"));
    let award_date = awardLine ? parseAwardDate(awardLine) : null;
    if (!award_date) {
      // Other wordings: "Order Dated", "Date of Order", "Award No. X dated ..."
      const m = body.slice(0, 700).match(/(?:dated|date of (?:order|award)|order dt\.?)\s*:?\s*(.{0,40})/i);
      if (m) award_date = parseAwardDate(m[1]);
    }
    if (body.length < 400) return; // index lines, cover pages, broken fragments
    if (!/award|repudiat|claim/i.test(body)) return;
    out.push({
      id: `${book}-${String(out.length + 1).padStart(4, "0")}`,
      book,
      centre: centreLine ? clean(centreLine.replace(/ombudsman\s+cent(re|er)/i, "")) || null : null,
      case_no: caseLine ? clean(caseLine.replace(/.*(case|complaint)\s*no\.?\s*:?/i, "")) || null : null,
      complainant,
      insurer,
      award_date,
      year: award_date ? Number(award_date.slice(0, 4)) : null,
      text: body.slice(0, 12000),
    });
  });
  return out;
}

function main() {
  const books = readdirSync(RAW).filter((f) => /^bk\d+\.txt$/.test(f)).sort((a, b) => parseInt(a.slice(2)) - parseInt(b.slice(2)));
  const all: Award[] = [];
  for (const f of books) {
    const awards = splitBook(f.replace(".txt", ""), readFileSync(join(RAW, f), "utf8"));
    const dated = awards.filter((a) => a.year).length;
    console.log(`${f}: ${awards.length} awards, ${dated} dated`);
    all.push(...awards);
  }
  // Drop exact duplicates (same case number + date + start of text).
  const seen = new Set<string>();
  const uniq = all.filter((a) => {
    const key = `${a.case_no}|${a.award_date}|${a.text.slice(0, 200)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  writeFileSync(OUT, uniq.map((a) => JSON.stringify(a)).join("\n") + "\n");
  const byYear: Record<string, number> = {};
  for (const a of uniq) byYear[a.year ?? "none"] = (byYear[a.year ?? "none"] ?? 0) + 1;
  console.log(`total ${uniq.length} (dupes dropped ${all.length - uniq.length})`, byYear);
}

if (process.argv[1]?.endsWith("ingest-gic.ts")) main();
