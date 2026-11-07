/**
 * The Bima Nyay agent. The chat model decides which tools to call and writes the
 * plain-language summary; every fact it can state comes from a tool:
 * rules and dates are deterministic code, past cases come from the database.
 */
import { chat, type ChatMessage, type ToolDef } from "../llm";
import type { LetterFields } from "../letter";
import { checkRules, type Finding } from "../rules/check";
import { computeDeadlines, type DeadlineStep } from "../deadlines";
import { searchSimilar } from "../cases/search";
import { summarise, type CaseHit, type OutcomeSummary } from "../cases/stats";
import { REASONS, type ReasonId } from "../reasons";

export type AgentInput = {
  fields: LetterFields;
  today: string;
  grievanceSentDate?: string;
  grievanceReplyDate?: string;
  state?: string;
  district?: string;
};

export type Summary = {
  strength: "strong" | "mixed" | "weak" | "unclear";
  summary_en: string;
  summary_hi: string;
  next_step_en: string;
  next_step_hi: string;
};

export type AgentEvent =
  | { type: "tool"; name: string; args: Record<string, unknown> }
  | { type: "findings"; findings: Finding[] }
  | { type: "cases"; query: string; hits: CaseHit[]; outcomes: OutcomeSummary }
  | { type: "deadlines"; steps: DeadlineStep[] }
  | { type: "office"; office: unknown }
  | { type: "summary"; summary: Summary }
  | { type: "error"; message: string };

export type ToolDeps = {
  route?: (state: string, district?: string) => unknown;
  search?: typeof searchSimilar;
};

const fn = (name: string, description: string, properties: object = {}, required: string[] = []): ToolDef => ({
  type: "function",
  function: { name, description, parameters: { type: "object", properties, required } },
});

const TOOLS: ToolDef[] = [
  fn("check_rules", "Check the rejection against IRDAI rules (moratorium, waiting periods, documents, letter requirements). Returns findings with rule citations."),
  fn(
    "find_similar_cases",
    "Search ~4,000 past Insurance Ombudsman decisions for cases like this one and count how they ended. Write facts_summary as a neutral 1-3 sentence description of the medical facts and the insurer's ground, no names.",
    {
      facts_summary: { type: "string" },
      same_reason_only: { type: "boolean", description: "true to restrict to the same rejection reason (default)" },
    },
    ["facts_summary"],
  ),
  fn("compute_deadlines", "Work out the grievance and Ombudsman deadlines from the dates known so far."),
  fn(
    "find_ombudsman_office",
    "Find which Insurance Ombudsman office handles the user's area.",
    { state: { type: "string" }, district: { type: "string" } },
    ["state"],
  ),
];

const SYSTEM = `You help an Indian policyholder whose health insurance claim was rejected. You are not a lawyer; give information, not legal advice.
Always call check_rules, find_similar_cases and compute_deadlines (you may call them together). Call find_ombudsman_office if the user's state is known.
If find_similar_cases abstains, say plainly that there are too few similar past decisions; never invent odds.
Then reply with ONLY a JSON object:
{"strength":"strong|mixed|weak|unclear","summary_en":"...","summary_hi":"...","next_step_en":"...","next_step_hi":"..."}
strength: strong if a rule is clearly broken; mixed if some grounds or past cases favour the user; weak if rules and past cases favour the insurer; unclear if facts are missing.
summary: 3-5 short sentences a person with Class 8 schooling can follow. Mention the strongest rule ground and what past cases show (numbers from the tool). Hindi must be simple everyday Hindi in Devanagari.
next_step: one concrete action with its date.`;

function describe(f: LetterFields, extra: AgentInput) {
  return [
    `Insurer: ${f.insurer ?? "unknown"}`,
    `Reason given: "${f.reasonText}" (category: ${REASONS[f.reasonId as ReasonId]?.en ?? f.reasonId})`,
    `Diagnosis: ${f.diagnosis ?? "unknown"}; claim type: ${f.claimType}; amount: ${f.claimAmount ?? "unknown"}; approved: ${f.approvedAmount ?? "unknown"}`,
    `Letter date: ${f.letterDate ?? "unknown"}; cover since: ${f.coverStartDate ?? "unknown"}; admission: ${f.admissionDate ?? "unknown"}`,
    `Grievance sent: ${extra.grievanceSentDate ?? "not yet"}; insurer reply: ${extra.grievanceReplyDate ?? "none"}`,
    `User location: ${extra.state ?? "unknown"}${extra.district ? `, ${extra.district}` : ""}`,
    `Today: ${extra.today}`,
  ].join("\n");
}

function parseSummary(text: string): Summary | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[0]);
    if (typeof j.summary_en === "string" && ["strong", "mixed", "weak", "unclear"].includes(j.strength)) return j;
  } catch {}
  return null;
}

/**
 * What we can still show when the model is unavailable: rules, deadlines and the office are plain code.
 * `seen` lists event types already sent, so nothing is sent twice.
 */
export function* deterministicEvents(input: AgentInput, deps: ToolDeps = {}, seen: ReadonlySet<string> = new Set()): Generator<AgentEvent> {
  if (!seen.has("findings")) yield { type: "findings", findings: checkRules(input.fields, input.today) };
  if (!seen.has("deadlines") && input.fields.letterDate) {
    yield {
      type: "deadlines",
      steps: computeDeadlines({
        rejectionDate: input.fields.letterDate,
        grievanceSentDate: input.grievanceSentDate,
        grievanceReplyDate: input.grievanceReplyDate,
        today: input.today,
      }),
    };
  }
  if (!seen.has("office") && input.state && deps.route) {
    const office = deps.route(input.state, input.district);
    if (office) yield { type: "office", office };
  }
}

export async function* runAgent(input: AgentInput, deps: ToolDeps = {}): AsyncGenerator<AgentEvent> {
  const search = deps.search ?? searchSimilar;
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM },
    { role: "user", content: describe(input.fields, input) },
  ];

  async function callTool(name: string, args: Record<string, unknown>): Promise<{ result: unknown; event?: AgentEvent }> {
    switch (name) {
      case "check_rules": {
        const findings = checkRules(input.fields, input.today);
        return {
          result: findings.map(({ id, verdict, title, why }) => ({ id, verdict, title, why })),
          event: { type: "findings", findings },
        };
      }
      case "find_similar_cases": {
        const query = String(args.facts_summary ?? input.fields.reasonText);
        const hits = await search(input.fields.reasonId, query, { sameReason: args.same_reason_only !== false, k: 25 });
        const outcomes = summarise(hits);
        return {
          result: {
            outcomes,
            examples: hits.slice(0, 5).map((h) => ({ year: h.year, outcome: h.outcome, facts: h.facts, similarity: +h.similarity.toFixed(2) })),
          },
          event: { type: "cases", query, hits, outcomes },
        };
      }
      case "compute_deadlines": {
        if (!input.fields.letterDate) return { result: { error: "Letter date unknown" } };
        const steps = computeDeadlines({
          rejectionDate: input.fields.letterDate,
          grievanceSentDate: input.grievanceSentDate,
          grievanceReplyDate: input.grievanceReplyDate,
          today: input.today,
        });
        return { result: steps, event: { type: "deadlines", steps } };
      }
      case "find_ombudsman_office": {
        if (!deps.route) return { result: { error: "Office lookup not available" } };
        const office = deps.route(String(args.state), args.district ? String(args.district) : undefined);
        return { result: office ?? { error: "State not recognised" }, event: { type: "office", office } };
      }
      default:
        return { result: { error: `Unknown tool ${name}` } };
    }
  }

  let askedForJson = false;
  for (let turn = 0; turn < 6; turn++) {
    const res = await chat({ messages, tools: TOOLS, temperature: 0.2 });
    if (!res.toolCalls.length) {
      const summary = parseSummary(res.content);
      if (summary) {
        yield { type: "summary", summary };
        return;
      }
      // Model ended without the JSON: ask once more, then give up.
      if (askedForJson) break;
      askedForJson = true;
      messages.push(res.message, { role: "user", content: "Now reply with only the JSON object described in your instructions." });
      continue;
    }
    messages.push(res.message);
    for (const c of res.toolCalls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(c.function.arguments || "{}");
      } catch {}
      yield { type: "tool", name: c.function.name, args };
      let content: string;
      try {
        const { result, event } = await callTool(c.function.name, args);
        if (event) yield event;
        content = JSON.stringify(result);
      } catch (e) {
        content = JSON.stringify({ error: (e as Error).message });
      }
      messages.push({ role: "tool", tool_call_id: c.id, content });
    }
  }
  yield { type: "error", message: "The assistant could not finish the summary." };
}
