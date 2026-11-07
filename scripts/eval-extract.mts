// Reads each sample letter image with the real extractor and compares the result
// field by field with samples/letters/*.expected.json.
// Run: node --import tsx scripts/eval-extract.mts
import "dotenv/config";
import { config } from "dotenv";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { extractLetter } from "../src/lib/extract";

config({ path: ".env.local" });

const EXACT = [
  "policyNumber", "claimNumber", "letterDate", "coverStartDate", "policyStartDate", "admissionDate",
  "claimSubmittedDate", "claimAmount", "approvedAmount", "claimType", "reasonId", "waitingMonthsStated",
  "fraudAlleged",
] as const;

const norm = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, "").toLowerCase() : v);

const rows: { sample: string; field: string; expected: unknown; got: unknown; ok: boolean }[] = [];
for (const f of readdirSync("samples/letters").filter((f) => f.endsWith(".expected.json")).sort()) {
  const name = f.replace(".expected.json", "");
  const expected = JSON.parse(readFileSync(`samples/letters/${f}`, "utf8"));
  const data = readFileSync(`public/samples/${name}.png`).toString("base64");
  const t = Date.now();
  const res = await extractLetter({ data, mimeType: "image/png" });
  if (!res.ok) {
    console.log(`${name}: FAILED ${res.error}`);
    for (const field of EXACT) rows.push({ sample: name, field, expected: expected[field], got: null, ok: false });
    continue;
  }
  const got = res.fields as Record<string, unknown>;
  const misses: string[] = [];
  for (const field of EXACT) {
    const ok = norm(got[field]) === norm(expected[field]);
    rows.push({ sample: name, field, expected: expected[field], got: got[field], ok });
    if (!ok) misses.push(`${field}: want ${JSON.stringify(expected[field])} got ${JSON.stringify(got[field])}`);
  }
  console.log(`${name} (${Date.now() - t} ms): ${EXACT.length - misses.length}/${EXACT.length}${misses.length ? "\n  " + misses.join("\n  ") : ""}`);
}

const ok = rows.filter((r) => r.ok).length;
const reasonRows = rows.filter((r) => r.field === "reasonId");
console.log(`\nfields correct: ${ok}/${rows.length} (${((100 * ok) / rows.length).toFixed(1)}%)`);
console.log(`reason correct: ${reasonRows.filter((r) => r.ok).length}/${reasonRows.length}`);
writeFileSync("data/processed/eval-extract.json", JSON.stringify({ ranAt: new Date().toISOString(), ok, total: rows.length, rows }, null, 1));
