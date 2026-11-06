import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
const { runAgent } = await import("../src/lib/agent/index.ts");
const fields = {
  insurer: "Example General Insurance", policyNumber: "P-123", claimNumber: "C-9", patientName: "Sunita Devi",
  letterDate: "2026-10-01", coverStartDate: "2019-04-01", policyStartDate: "2026-04-01", admissionDate: "2026-09-10",
  claimSubmittedDate: null, claimAmount: 185000, approvedAmount: 0, claimType: "reimbursement", diagnosis: "Gallbladder removal (cholecystitis)",
  reasonText: "Non-disclosure of hypertension at proposal stage", reasonId: "non_disclosure", clausesCited: ["7.1"], waitingMonthsStated: null,
  fraudAlleged: false, accident: null,
};
const fakeHit = (o: string, i: number) => ({ id: "x" + i, forum: "Ombudsman Delhi", year: 2012, insurer: "X", reason: "non_disclosure", facts: "Claim rejected for non-disclosure of hypertension, long-running policy.", outcome: o, amount_claimed: null, amount_awarded: null, source_url: null, source_ref: null, similarity: 0.85 });
const search = async () => [...Array(9)].map((_, i) => fakeHit("allowed", i)).concat([...Array(4)].map((_, i) => fakeHit("dismissed", 20 + i)));
const t = Date.now();
for await (const ev of runAgent({ fields, today: "2026-11-07", state: "Bihar" }, { search, route: (s: string) => ({ city: "Patna", state: s }) })) {
  console.log(ev.type, JSON.stringify(ev.type === "summary" ? ev.summary : ev.type === "tool" ? ev.args : ev.type === "error" ? ev : "").slice(0, 900));
}
console.log("ms", Date.now() - t);
