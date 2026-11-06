import { describe, expect, it } from "vitest";
import type { LetterFields } from "../letter";
import { checkRules } from "../rules/check";
import { grievanceLetter, ombudsmanComplaint } from ".";

const fields: LetterFields = {
  insurer: "Example General Insurance", policyNumber: "P-123", claimNumber: "C-9", patientName: "Sunita Devi",
  letterDate: "2026-10-01", coverStartDate: "2019-04-01", policyStartDate: "2026-04-01", admissionDate: "2026-09-10",
  claimSubmittedDate: null, claimAmount: 185000, approvedAmount: 0, claimType: "reimbursement", diagnosis: "Cholecystitis",
  reasonText: "Non-disclosure of hypertension", reasonId: "non_disclosure", clausesCited: [], waitingMonthsStated: null,
  fraudAlleged: false, accident: null,
};
const input = { fields, findings: checkRules(fields, "2026-11-07"), complainant: { name: "Ramesh Kumar" }, today: "2026-11-07" };

describe("letters", () => {
  for (const lang of ["en", "hi"] as const) {
    it(`grievance (${lang}) has claim facts, grounds and citations`, () => {
      const t = grievanceLetter(input, lang);
      expect(t).toContain("C-9");
      expect(t).toContain("P-123");
      expect(t).toContain("Rs 1,85,000");
      expect(t).toContain("para 13");
      expect(t).toContain("Ramesh Kumar");
      expect(t).not.toContain("undefined");
    });
    it(`ombudsman complaint (${lang}) marks missing details`, () => {
      const t = ombudsmanComplaint(input, lang);
      expect(t).toContain(lang === "hi" ? "[भरें]" : "[fill in]");
      expect(t).toContain(lang === "hi" ? "नियम 14" : "Rule 14");
      expect(t).not.toContain("undefined");
    });
  }
  it("hindi letter is in Devanagari", () => {
    expect(grievanceLetter(input, "hi").match(/[ऀ-ॿ]/g)!.length).toBeGreaterThan(300);
  });
});
