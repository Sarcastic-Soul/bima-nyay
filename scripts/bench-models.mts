/**
 * Compare Cloudflare Workers AI chat models on the two jobs the app needs:
 *   extract  read the 6 sample letters (vision) and compare with samples/letters/*.expected.json
 *   agent    run the tool-calling loop on a fixed case and check tools, JSON, Hindi and numbers
 *
 *   node --import tsx scripts/bench-models.mts extract <model-id> [--no-think]
 *   node --import tsx scripts/bench-models.mts agent <model-id> [--no-think]
 * Prints one JSON line with the result so runs can be collected.
 */
import { config } from "dotenv";
import { readFileSync, readdirSync } from "node:fs";
config({ path: ".env.local", quiet: true });
const { checkRules } = await import("../src/lib/rules/check.ts");
const { computeDeadlines } = await import("../src/lib/deadlines/index.ts");
const { summarise } = await import("../src/lib/cases/stats.ts");

const [mode, model] = process.argv.slice(2);
const noThink = process.argv.includes("--no-think");
const ACC = process.env.CLOUDFLARE_ACCOUNT_ID, TOK = process.env.CLOUDFLARE_API_TOKEN;
const URL = `https://api.cloudflare.com/client/v4/accounts/${ACC}/ai/v1/chat/completions`;

// Neurons per million tokens (input, output) from the Workers AI pricing page.
const RATE: Record<string, [number, number]> = {
  "@cf/meta/llama-4-scout-17b-16e-instruct": [24545, 77273],
  "@cf/google/gemma-4-26b-a4b-it": [9091, 27273],
  "@cf/qwen/qwen3.8-27b": [40909, 290909],
  "@cf/meta/llama-3.2-11b-vision-instruct": [4410, 61493],
  "@cf/openai/gpt-oss-120b": [31818, 68182],
  "@cf/openai/gpt-oss-20b": [18182, 27273],
  "@cf/zai-org/glm-4.7-flash": [5500, 36400],
  "@cf/mistralai/mistral-small-3.1-24b-instruct": [31876, 50488],
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast": [26668, 204805],
};
const neurons = (inTok: number, outTok: number) => {
  const r = RATE[model] ?? [0, 0];
  return (inTok * r[0] + outTok * r[1]) / 1e6;
};

async function chat(body: Record<string, unknown>) {
  const payload = { model, temperature: 0, ...(noThink ? { chat_template_kwargs: { enable_thinking: false }, reasoning_effort: "low" } : {}), ...body };
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(URL, { method: "POST", headers: { Authorization: `Bearer ${TOK}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const text = await res.text();
    if (res.ok) return JSON.parse(text);
    if ((res.status === 429 || res.status >= 500) && attempt < 3) { await new Promise((r) => setTimeout(r, 4000 * (attempt + 1))); continue; }
    throw new Error(`${res.status} ${text.slice(0, 200)}`);
  }
}

if (mode === "extract") {
  const keys = ["policyNumber", "claimNumber", "letterDate", "coverStartDate", "policyStartDate", "admissionDate", "claimSubmittedDate", "claimAmount", "approvedAmount", "claimType", "reasonId", "waitingMonthsStated", "fraudAlleged"];
  const prompt = `This is a photo or scan of an Indian health insurance claim rejection letter. Read it and return ONLY a JSON object with keys: ${keys.join(", ")}.
Copy numbers exactly. Dates as YYYY-MM-DD (Indian letters use DD/MM/YYYY). Amounts in rupees as plain numbers. claimType: cashless|reimbursement|unknown.
reasonId = the insurer's stated ground: ped (pre-existing disease), non_disclosure (facts hidden in proposal form), waiting_period (initial 30 days or specific-disease waiting), exclusion, not_necessary (hospitalisation not required / OPD / investigation only), documents (documents not submitted, late intimation or submission), room_rent, non_payable, cashless_denied, lapsed, other.
waitingMonthsStated = waiting period in months the letter says applies (years x 12), else null. fraudAlleged is true or false. Use null when a field is not in the letter.`;
  const names = readdirSync("samples/letters").filter((f) => f.endsWith(".expected.json")).map((f) => f.replace(".expected.json", "")).sort();
  let ok = 0, total = 0, reasonOk = 0, ms = 0, inTok = 0, outTok = 0, bad = 0;
  const misses: string[] = [];
  for (const n of names) {
    const img = readFileSync(`public/samples/${n}.png`).toString("base64");
    const exp = JSON.parse(readFileSync(`samples/letters/${n}.expected.json`, "utf8"));
    const t = Date.now();
    let got: any = {};
    try {
      const j = await chat({ max_tokens: 3000, messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: `data:image/png;base64,${img}` } }] }] });
      ms += Date.now() - t; inTok += j.usage?.prompt_tokens ?? 0; outTok += j.usage?.completion_tokens ?? 0;
      const txt: string = j.choices?.[0]?.message?.content ?? "";
      const m = txt.match(/\{[\s\S]*\}/);
      got = m ? JSON.parse(m[0]) : {};
      if (!m) bad++;
    } catch (e) { bad++; ms += Date.now() - t; misses.push(`${n}: ${(e as Error).message.slice(0, 80)}`); }
    for (const k of keys) {
      total++;
      const same = String(got[k] ?? null).replace(/\s/g, "").toLowerCase() === String(exp[k] ?? null).replace(/\s/g, "").toLowerCase();
      if (same) { ok++; if (k === "reasonId") reasonOk++; } else misses.push(`${n}.${k}: want ${exp[k]} got ${got[k]}`);
    }
  }
  console.log(JSON.stringify({ mode, model, noThink, fields: `${ok}/${total}`, reason: `${reasonOk}/${names.length}`, unparseable: bad, avgSec: +(ms / names.length / 1000).toFixed(1), neuronsPerLetter: Math.round(neurons(inTok, outTok) / names.length), misses: misses.slice(0, 8) }));
}

if (mode === "agent") {
  const fields: any = {
    insurer: "Example General Insurance", policyNumber: "P-123", claimNumber: "C-9", patientName: null,
    letterDate: "2026-10-01", coverStartDate: "2019-04-01", policyStartDate: "2026-04-01", admissionDate: "2026-09-10",
    claimSubmittedDate: null, claimAmount: 185000, approvedAmount: 0, claimType: "reimbursement", diagnosis: "Gallbladder removal (cholecystitis)",
    reasonText: "Non-disclosure of hypertension at proposal stage", reasonId: "non_disclosure", clausesCited: ["7.1"], waitingMonthsStated: null, fraudAlleged: false, accident: null,
  };
  const hit = (o: string, i: number) => ({ id: "x" + i, forum: "Ombudsman Delhi", year: 2012, insurer: "X", reason: "non_disclosure", facts: "Claim rejected for non-disclosure of hypertension, long-running policy.", outcome: o, amount_claimed: null, amount_awarded: null, source_url: null, source_ref: null, similarity: 0.85 });
  const hits: any[] = [...Array(9)].map((_, i) => hit("allowed", i)).concat([...Array(4)].map((_, i) => hit("dismissed", 20 + i)));
  const prop = (type: string, description?: string) => ({ type, ...(description ? { description } : {}) });
  const fn = (name: string, description: string, properties: object = {}, required: string[] = []) => ({ type: "function", function: { name, description, parameters: { type: "object", properties, required } } });
  const tools = [
    fn("check_rules", "Check the rejection against IRDAI rules (moratorium, waiting periods, documents, letter requirements). Returns findings with rule citations."),
    fn("find_similar_cases", "Search ~4,000 past Insurance Ombudsman decisions for cases like this one and count how they ended. Write facts_summary as a neutral 1-3 sentence description of the medical facts and the insurer's ground, no names.", { facts_summary: prop("string"), same_reason_only: prop("boolean") }, ["facts_summary"]),
    fn("compute_deadlines", "Work out the grievance and Ombudsman deadlines from the dates known so far."),
    fn("find_ombudsman_office", "Find which Insurance Ombudsman office handles the user's area.", { state: prop("string"), district: prop("string") }, ["state"]),
  ];
  const SYSTEM = `You help an Indian policyholder whose health insurance claim was rejected. You are not a lawyer; give information, not legal advice.
Always call check_rules, find_similar_cases and compute_deadlines (you may call them together). Call find_ombudsman_office if the user's state is known.
If find_similar_cases abstains, say plainly that there are too few similar past decisions; never invent odds.
Then reply with ONLY a JSON object:
{"strength":"strong|mixed|weak|unclear","summary_en":"...","summary_hi":"...","next_step_en":"...","next_step_hi":"..."}
strength: strong if a rule is clearly broken; mixed if some grounds or past cases favour the user; weak if rules and past cases favour the insurer; unclear if facts are missing.
summary: 3-5 short sentences a person with Class 8 schooling can follow. Mention the strongest rule ground and what past cases show (numbers from the tool). Hindi must be simple everyday Hindi in Devanagari.
next_step: one concrete action with its date.`;
  const user = `Insurer: Example General Insurance\nReason given: "${fields.reasonText}" (category: non_disclosure)\nDiagnosis: ${fields.diagnosis}; claim type: reimbursement; amount: 185000; approved: 0\nLetter date: 2026-10-01; cover since: 2019-04-01; admission: 2026-09-10\nGrievance sent: not yet; insurer reply: none\nUser location: Bihar\nToday: 2026-11-07`;
  const exec = (name: string, args: any) => {
    if (name === "check_rules") return checkRules(fields, "2026-11-07").map(({ id, verdict, title, why }: any) => ({ id, verdict, title, why }));
    if (name === "find_similar_cases") return { outcomes: summarise(hits), examples: hits.slice(0, 5).map((h) => ({ year: h.year, outcome: h.outcome, facts: h.facts })) };
    if (name === "compute_deadlines") return computeDeadlines({ rejectionDate: fields.letterDate, today: "2026-11-07" });
    if (name === "find_ombudsman_office") return { city: "Patna", state: args.state };
    return { error: "unknown tool" };
  };

  const RUNS = 2;
  const results: any[] = [];
  for (let run = 0; run < RUNS; run++) {
    const messages: any[] = [{ role: "system", content: SYSTEM }, { role: "user", content: user }];
    const called = new Set<string>();
    let inTok = 0, outTok = 0, summary: any = null, err = "";
    const t = Date.now();
    try {
      for (let turn = 0; turn < 6 && !summary; turn++) {
        const j = await chat({ max_tokens: 3000, messages, tools, temperature: 0.2 });
        inTok += j.usage?.prompt_tokens ?? 0; outTok += j.usage?.completion_tokens ?? 0;
        const msg = j.choices?.[0]?.message ?? {};
        const calls = msg.tool_calls ?? [];
        if (calls.length) {
          messages.push({ role: "assistant", content: msg.content ?? null, tool_calls: calls });
          for (const c of calls) {
            called.add(c.function.name);
            let args: any = {};
            try { args = JSON.parse(c.function.arguments || "{}"); } catch {}
            messages.push({ role: "tool", tool_call_id: c.id, content: JSON.stringify(exec(c.function.name, args)) });
          }
          continue;
        }
        const m = String(msg.content ?? "").match(/\{[\s\S]*\}/);
        if (m) { try { const s = JSON.parse(m[0]); if (typeof s.summary_en === "string") summary = s; } catch {} }
        if (!summary) { messages.push({ role: "assistant", content: msg.content ?? "" }, { role: "user", content: "Now reply with only the JSON object described in your instructions." }); }
      }
    } catch (e) { err = (e as Error).message.slice(0, 120); }
    const dev = (s: string) => ((s.match(/[\u0900-\u097F]/g) ?? []).length / Math.max(1, s.replace(/\s/g, "").length));
    results.push({
      tools: ["check_rules", "find_similar_cases", "compute_deadlines"].every((x) => called.has(x)),
      json: !!summary,
      strong: summary?.strength === "strong",
      hindi: summary ? dev(String(summary.summary_hi)) > 0.5 : false,
      numbers: summary ? /\b9\b/.test(summary.summary_en) && /\b13\b/.test(summary.summary_en) : false,
      sec: +((Date.now() - t) / 1000).toFixed(1), neurons: Math.round(neurons(inTok, outTok)), err,
      sample: summary ? String(summary.summary_hi).slice(0, 110) : "",
    });
  }
  console.log(JSON.stringify({ mode, model, noThink, results }));
}
