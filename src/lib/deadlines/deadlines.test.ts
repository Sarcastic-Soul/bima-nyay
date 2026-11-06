import { describe, expect, it } from "vitest";
import { addDays, addMonths, computeDeadlines, daysBetween } from ".";

describe("date helpers", () => {
  it("adds calendar months and clamps month end", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonths("2026-03-15", 12)).toBe("2027-03-15");
    expect(addMonths("2026-12-10", 1)).toBe("2027-01-10");
  });
  it("adds days across year end", () => {
    expect(addDays("2026-12-25", 14)).toBe("2027-01-08");
  });
  it("counts days", () => {
    expect(daysBetween("2026-11-01", "2026-11-15")).toBe(14);
    expect(daysBetween("2026-11-15", "2026-11-01")).toBe(-14);
  });
  it("rejects bad dates", () => {
    expect(() => addDays("2026-02-30", 1)).toThrow();
    expect(() => addDays("06/11/2026", 1)).toThrow();
  });
});

describe("computeDeadlines", () => {
  it("asks for a grievance first and keeps the Ombudsman closed", () => {
    const s = computeDeadlines({ rejectionDate: "2026-10-01", today: "2026-11-06" });
    expect(s.map((x) => [x.id, x.status])).toEqual([
      ["grievance", "todo"],
      ["ombudsman", "waiting"],
    ]);
  });

  it("insurer replied: window is one year from reply", () => {
    const s = computeDeadlines({
      rejectionDate: "2026-09-01",
      grievanceSentDate: "2026-09-05",
      grievanceReplyDate: "2026-09-20",
      today: "2026-11-06",
    });
    const o = s.find((x) => x.id === "ombudsman")!;
    expect(o).toMatchObject({ status: "open", from: "2026-09-20", until: "2027-09-20" });
    expect(o.ruleIds).toContain("ombudsman_one_year_limit");
    expect(s.find((x) => x.id === "insurer_reply")!.status).toBe("done");
  });

  it("no reply: opens one month after grievance, insurer late after 14 days", () => {
    const s = computeDeadlines({ rejectionDate: "2026-10-01", grievanceSentDate: "2026-10-10", today: "2026-11-06" });
    expect(s.find((x) => x.id === "insurer_reply")).toMatchObject({ status: "missed", until: "2026-10-24" });
    expect(s.find((x) => x.id === "ombudsman")).toMatchObject({
      status: "waiting",
      from: "2026-11-10",
      until: "2027-11-10",
    });
  });

  it("no reply and month passed: open", () => {
    const s = computeDeadlines({ rejectionDate: "2026-08-01", grievanceSentDate: "2026-08-10", today: "2026-11-06" });
    expect(s.find((x) => x.id === "ombudsman")!.status).toBe("open");
  });

  it("warns in the last 30 days and flags condonation once missed", () => {
    const base = { rejectionDate: "2025-10-01", grievanceSentDate: "2025-10-05", grievanceReplyDate: "2025-11-20" };
    expect(computeDeadlines({ ...base, today: "2026-11-01" }).at(-1)!.status).toBe("closing_soon");
    expect(computeDeadlines({ ...base, today: "2026-11-20" }).at(-1)!.status).toBe("closing_soon");
    const missed = computeDeadlines({ ...base, today: "2026-11-21" }).at(-1)!;
    expect(missed.status).toBe("missed");
    expect(missed.ruleIds).toContain("ombudsman_delay_condonation");
  });

  it("rejects impossible orderings", () => {
    expect(() =>
      computeDeadlines({ rejectionDate: "2026-10-01", grievanceSentDate: "2026-09-01", today: "2026-11-06" }),
    ).toThrow();
    expect(() =>
      computeDeadlines({ rejectionDate: "2026-10-01", grievanceReplyDate: "2026-10-05", today: "2026-11-06" }),
    ).toThrow();
  });
});
