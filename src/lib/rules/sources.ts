import rules from "../../../sources/rules.json";

export type RuleSource = {
  id: string;
  summary: string;
  quote: string;
  file: string;
  location: string;
  url: string;
  in_force_from: string;
  status: "in_force" | "superseded";
  note?: string;
};

export const RULES = rules as RuleSource[];
const byId = new Map(RULES.map((r) => [r.id, r]));

/** Look up a rule by id. Throws on a typo so a bad citation never reaches a user. */
export function rule(id: string): RuleSource {
  const r = byId.get(id);
  if (!r) throw new Error(`Unknown rule id: ${id}`);
  return r;
}
