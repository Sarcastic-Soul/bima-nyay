import { describe, expect, it } from "vitest";
import { summarise, wilson, type CaseHit } from "./stats";

const hit = (outcome: CaseHit["outcome"], similarity = 0.9): CaseHit => ({
  id: Math.random().toString(),
  forum: null, year: 2010, insurer: null, reason: "ped", facts: null, outcome,
  amount_claimed: null, amount_awarded: null, source_url: null, source_ref: null, similarity,
});

describe("wilson", () => {
  it("matches known values", () => {
    const w = wilson(5, 10);
    expect(w.low).toBeCloseTo(0.2366, 3);
    expect(w.high).toBeCloseTo(0.7634, 3);
  });
  it("handles n = 0", () => expect(wilson(0, 0)).toEqual({ p: 0, low: 0, high: 1 }));
});

describe("summarise", () => {
  it("abstains with few cases", () => {
    expect(summarise([hit("allowed"), hit("dismissed")]).abstain).toBe(true);
  });
  it("ignores weak matches", () => {
    expect(summarise(Array.from({ length: 20 }, () => hit("allowed", 0.5))).abstain).toBe(true);
  });
  it("counts favourable outcomes", () => {
    const hits = [...Array(6)].map(() => hit("allowed")).concat([...Array(2)].map(() => hit("settled")), [...Array(4)].map(() => hit("dismissed")));
    const s = summarise(hits);
    if (s.abstain) throw new Error("should not abstain");
    expect(s.n).toBe(12);
    expect(s.favourable).toBeCloseTo(8 / 12);
    expect(s.low).toBeLessThan(s.favourable);
  });
});
