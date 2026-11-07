import { describe, expect, it } from "vitest";
import type { LetterFields } from "../letter";
import { findOffice } from "../ombudsman/offices";
import { deterministicEvents } from "./index";

const fields: LetterFields = {
  insurer: "Example General Insurance", policyNumber: null, claimNumber: null, patientName: null,
  letterDate: "2026-10-01", coverStartDate: "2019-04-01", policyStartDate: "2026-04-01", admissionDate: "2026-09-10",
  claimSubmittedDate: null, claimAmount: 185000, approvedAmount: 0, claimType: "reimbursement", diagnosis: "Gallbladder removal",
  reasonText: "Non-disclosure of hypertension", reasonId: "non_disclosure", clausesCited: [], waitingMonthsStated: null,
  fraudAlleged: false, accident: null,
};
const input = { fields, today: "2026-11-07", state: "Bihar" };
const deps = { route: (s: string, d?: string) => findOffice(s, d) };

describe("deterministicEvents", () => {
  it("sends rules, deadlines and the office without any model", () => {
    const types = [...deterministicEvents(input, deps)].map((e) => e.type);
    expect(types).toEqual(["findings", "deadlines", "office"]);
  });
  it("does not repeat what was already sent", () => {
    const types = [...deterministicEvents(input, deps, new Set(["findings", "deadlines"]))].map((e) => e.type);
    expect(types).toEqual(["office"]);
  });
  it("skips deadlines when the letter date is unknown and the office when no state is given", () => {
    const types = [...deterministicEvents({ fields: { ...fields, letterDate: null }, today: "2026-11-07" }, deps)].map((e) => e.type);
    expect(types).toEqual(["findings"]);
  });
});
