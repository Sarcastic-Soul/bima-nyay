/**
 * The text we embed for a past case must not say how the case ended: a real user's letter has no outcome yet,
 * so a search that can see the outcome in the stored text would look better in the replay than it is in use.
 * We drop every sentence that states the decision, an order to pay, or the forum's view of the insurer.
 * The full summary is still stored and shown on the case card.
 */
const DECISION =
  /\b(ombudsman|forum|authority|commission|tribunal|panel)\b.*\b(held|directed|ordered|awarded|allowed|dismissed|upheld|disallowed|advised|observed|found|concluded|decided|rejected|ruled|treated|noted|opined|felt|considered|agreed|asked|recommended|passed)\b/i;
const ORDER =
  /\b(directed|ordered|instructed|asked|advised|required) to (pay|reimburse|settle|release|refund|reconsider|revise|re-?open)\b|\bto pay\b|\bex[- ]?gratia\b|\bawarded?\b|\bpartly\b|\bpartial(ly)? (allowed|payment|relief)\b|\bsettled\b|\bsettlement (was|reached)\b|\bwithdr[ae]w\b|\bcomplaint (was|is|stands) (dismissed|allowed|rejected|disposed|closed)\b|\bclaim (was|is) (allowed|disallowed|admitted|payable|not payable)\b|\bnot (entitled|payable|justified|sustainable|tenable|maintainable)\b|\bjustified\b|\bunjustified\b|\bwithout merit\b|\bno merit\b|\bupheld\b|\bset aside\b|\brelief\b|\bwas (allowed|dismissed|upheld|settled|paid)\b/i;

export function neutralFacts(facts: string): string {
  return facts
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim() && !DECISION.test(s) && !ORDER.test(s))
    .join(" ")
    .trim();
}

/** What gets embedded for a stored case: reason plus facts with the decision removed. */
export const searchText = (reason: string, facts: string) => `${reason}: ${neutralFacts(facts) || "(no facts stated)"}`;
