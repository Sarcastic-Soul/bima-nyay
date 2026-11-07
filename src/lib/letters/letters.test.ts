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

  it("only lists broken rules as grounds, never questions meant for the user", () => {
    const unsure = { ...fields, coverStartDate: null };
    const f = checkRules(unsure, "2026-11-07");
    expect(f.some((x) => x.id === "moratorium_unknown")).toBe(true);
    for (const lang of ["en", "hi"] as const) {
      const t = grievanceLetter({ ...input, fields: unsure, findings: f }, lang);
      expect(t).not.toContain("Tell us");
      expect(t).not.toContain("पोर्टेबिलिटी सहित");
    }
  });
  it("asks only for the unpaid part when some money was already approved", () => {
    const part = { ...fields, claimAmount: 100000, approvedAmount: 60000 };
    const i = { ...input, fields: part, findings: checkRules(part, "2026-11-07") };
    expect(grievanceLetter(i, "en")).toContain("Rs 40,000");
    expect(ombudsmanComplaint({ ...i, grievanceSentDate: "2026-10-05" }, "en")).toContain("unpaid claim amount of Rs 40,000");
  });
  it("does not say the insurer failed to reply when no grievance was sent", () => {
    const without = ombudsmanComplaint(input, "en");
    expect(without).not.toContain("The insurer did not reply");
    expect(without).toContain("[Say what the insurer replied");
    expect(ombudsmanComplaint({ ...input, grievanceSentDate: "2026-10-05" }, "en")).toContain("The insurer did not reply within one month.");
  });
});
