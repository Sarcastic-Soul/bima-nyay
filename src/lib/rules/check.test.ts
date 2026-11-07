import { describe, expect, it } from "vitest";
import type { LetterFields } from "../letter";
import { checkRules, monthsOfCover } from "./check";

const base: LetterFields = {
  insurer: "Example General Insurance",
  policyNumber: "P1",
  claimNumber: "C1",
  patientName: null,
  letterDate: "2026-10-01",
  coverStartDate: null,
  policyStartDate: "2026-04-01",
  admissionDate: "2026-09-10",
  claimSubmittedDate: null,
  claimAmount: 180000,
  approvedAmount: 0,
  claimType: "reimbursement",
  diagnosis: "Cholecystitis",
  reasonText: "Non-disclosure of hypertension",
  reasonId: "non_disclosure",
  clausesCited: ["4.1"],
  waitingMonthsStated: null,
  fraudAlleged: false,
  accident: null,
};
const ids = (f: Partial<LetterFields>) => checkRules({ ...base, ...f }, "2026-11-07").map((x) => `${x.id}:${x.verdict}`);

describe("monthsOfCover", () => {
  it("counts whole months", () => {
    expect(monthsOfCover("2021-09-10", "2026-09-10")).toBe(60);
    expect(monthsOfCover("2021-09-11", "2026-09-10")).toBe(59);
    expect(monthsOfCover("2026-09-10", "2026-09-10")).toBe(0);
  });
});

describe("checkRules", () => {
  it("flags non-disclosure after 60 months", () => {
    expect(ids({ coverStartDate: "2020-01-01" })).toContain("moratorium_passed:rule_broken");
  });
  it("does not flag at 59 months", () => {
    const r = ids({ coverStartDate: "2021-09-11" });
    expect(r.some((x) => x.startsWith("moratorium_passed"))).toBe(false);
  });
  it("asks for cover start when unknown", () => {
    const r = checkRules(base, "2026-11-07");
    expect(r.find((x) => x.id === "moratorium_unknown")?.ask).toBe("coverStartDate");
  });
  it("fraud alleged turns it into worth checking", () => {
    expect(ids({ coverStartDate: "2015-01-01", fraudAlleged: true })).toContain("moratorium_fraud:worth_checking");
  });
  it("flags waiting period over 36 months for new policies", () => {
    expect(ids({ reasonId: "waiting_period", waitingMonthsStated: 48 })).toContain("waiting_over_36:rule_broken");
    expect(ids({ reasonId: "waiting_period", waitingMonthsStated: 48, policyStartDate: "2023-01-01", admissionDate: "2023-06-01" })).not.toContain(
      "waiting_over_36:rule_broken",
    );
  });
  it("flags PED waiting when 36 months served", () => {
    expect(ids({ reasonId: "ped", coverStartDate: "2023-01-01" })).toContain("waiting_served:rule_broken");
  });
  it("flags accident under disease waiting period", () => {
    expect(ids({ reasonId: "waiting_period", accident: true })).toContain("waiting_accident:rule_broken");
  });
  it("flags document-based rejection", () => {
    expect(ids({ reasonId: "documents" })[0]).toBe("no_reject_for_documents:rule_broken");
  });
  it("flags missing clause", () => {
    expect(ids({ clausesCited: [] })).toContain("no_clause_cited:worth_checking");
  });
  it("notes late decision past 15 days", () => {
    const r = checkRules({ ...base, claimSubmittedDate: "2026-09-01" }, "2026-11-07");
    expect(r.find((x) => x.id === "late_decision")?.title).toContain("15 days");
  });
  it("is honest that there is no room-rent rule", () => {
    const r = checkRules({ ...base, reasonId: "room_rent" }, "2026-11-07");
    expect(r.find((x) => x.id === "room_rent_no_rule")?.ruleIds).toEqual([]);
  });
  it("sorts broken rules first", () => {
    const r = checkRules({ ...base, reasonId: "documents", clausesCited: [] }, "2026-11-07");
    const v = r.map((x) => x.verdict);
    expect(v.indexOf("info")).toBeGreaterThan(v.lastIndexOf("rule_broken"));
  });

  it("does not call a pre-April-2024 claim a broken 60-month rule", () => {
    const r = ids({ admissionDate: "2023-09-10", letterDate: "2023-10-01", coverStartDate: "2015-01-01" });
    expect(r.some((x) => x.startsWith("moratorium_passed"))).toBe(false);
    expect(r).toContain("older_rules:worth_checking");
  });
  it("does not use the 36-month cap on a pre-April-2024 claim", () => {
    const r = ids({ reasonId: "ped", admissionDate: "2023-09-10", letterDate: "2023-10-01", coverStartDate: "2019-01-01" });
    expect(r.some((x) => x.startsWith("waiting_served"))).toBe(false);
  });
  it("still applies the 36-month cap to a 2026 claim", () => {
    expect(ids({ reasonId: "ped", coverStartDate: "2020-01-01" })).toContain("waiting_served:rule_broken");
  });
});
