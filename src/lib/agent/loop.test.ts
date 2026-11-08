import { describe, expect, it, vi } from "vitest";
import type { LetterFields } from "../letter";

// A model that keeps calling compute_deadlines while tools are offered, and only writes the JSON when they are not.
const chat = vi.fn();
vi.mock("../llm", () => ({ chat: (o: unknown) => chat(o) }));
const { runAgent } = await import("./index");

const fields: LetterFields = {
  insurer: "Example General Insurance", policyNumber: null, claimNumber: null, patientName: null,
  letterDate: "2026-10-01", coverStartDate: "2019-04-01", policyStartDate: "2026-04-01", admissionDate: "2026-09-10",
  claimSubmittedDate: null, claimAmount: 185000, approvedAmount: 0, claimType: "reimbursement", diagnosis: "Gallbladder removal",
  reasonText: "Non-disclosure of hypertension", reasonId: "non_disclosure", clausesCited: [], waitingMonthsStated: null,
  fraudAlleged: false, accident: null,
};
const call = (id: string, name: string, args = {}) => ({ id, type: "function" as const, function: { name, arguments: JSON.stringify(args) } });
const summary = { strength: "mixed", summary_en: "a", summary_hi: "b", next_step_en: "c", next_step_hi: "d" };

describe("runAgent", () => {
  it("stops offering tools once every needed tool has run, so repeat calls cannot use up the turns", async () => {
    let n = 0;
    chat.mockImplementation(async (o: { tools?: unknown[] }) => {
      if (!o.tools) return { content: JSON.stringify(summary), toolCalls: [], message: { role: "assistant", content: "" } };
      const calls = n++ === 0
        ? [call("1", "check_rules"), call("2", "find_similar_cases", { facts_summary: "x" }), call("3", "compute_deadlines")]
        : [call(`r${n}`, "compute_deadlines")];
      return { content: "", toolCalls: calls, message: { role: "assistant", content: null, tool_calls: calls } };
    });
    const events = [];
    for await (const ev of runAgent({ fields, today: "2026-11-07" }, { search: async () => [] })) events.push(ev);
    expect(events.at(-1)).toEqual({ type: "summary", summary });
    expect(events.filter((e) => e.type === "tool").length).toBe(3);
  });
});
