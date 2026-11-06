/**
 * Deterministic check of a rejection against IRDAI rules. No AI here:
 * every finding cites rule ids from sources/rules.json.
 */
import type { LetterFields } from "../letter";
import { addDays, addMonths, daysBetween } from "../deadlines";
import { rule } from "./sources";

export type Verdict =
  | "rule_broken" // the letter conflicts with an IRDAI rule on the facts given
  | "worth_checking" // a rule may help, but a fact is missing or needs proof
  | "info"; // useful rule, no direct conflict

export type Finding = {
  id: string;
  verdict: Verdict;
  /** Short English title; UI translates via id. */
  title: string;
  why: string;
  ruleIds: string[];
  /** Question to ask the user when a fact is missing. */
  ask?: keyof LetterFields;
};

export function monthsOfCover(coverStart: string, on: string): number {
  let m = 0;
  while (addMonths(coverStart, m + 1) <= on) m++;
  return m;
}

export function checkRules(f: LetterFields, today: string): Finding[] {
  const out: Finding[] = [];
  const on = f.admissionDate ?? f.letterDate ?? today;
  const cover = f.coverStartDate ? monthsOfCover(f.coverStartDate, on) : null;

  // 1. Moratorium: after 60 months, non-disclosure cannot be used except proven fraud.
  if (f.reasonId === "non_disclosure" || f.reasonId === "ped") {
    if (cover === null) {
      out.push({
        id: "moratorium_unknown",
        verdict: "worth_checking",
        title: "Has your cover been continuous for 5 years?",
        why: "After 60 months of continuous cover, an insurer cannot reject a claim for non-disclosure unless it proves fraud. Tell us when your first health policy started (portability counts).",
        ruleIds: ["moratorium_60m", "moratorium_credits_carry_over"],
        ask: "coverStartDate",
      });
    } else if (cover >= 60 && !f.fraudAlleged) {
      out.push({
        id: "moratorium_passed",
        verdict: "rule_broken",
        title: "Five-year moratorium has passed",
        why: `You had ${cover} months of continuous cover on ${on}. After 60 months, a claim cannot be contested for non-disclosure or misrepresentation except established fraud, and the letter does not allege fraud.`,
        ruleIds: ["moratorium_60m", "moratorium_credits_carry_over", "moratorium_first_policy_si"],
      });
    } else if (cover >= 60 && f.fraudAlleged) {
      out.push({
        id: "moratorium_fraud",
        verdict: "worth_checking",
        title: "Moratorium passed, but fraud is alleged",
        why: "After 60 months only established fraud can be used. The insurer must prove fraud, not just non-disclosure. Ask for the evidence.",
        ruleIds: ["moratorium_60m"],
      });
    }
  }

  // 2. PED and specific waiting periods: at most 36 months.
  if (f.reasonId === "ped" || f.reasonId === "waiting_period") {
    const ruleId = f.reasonId === "ped" ? "ped_waiting_max_36m" : "specific_waiting_max_36m";
    if (f.waitingMonthsStated !== null && f.waitingMonthsStated > 36 && (f.policyStartDate ?? on) >= "2024-04-01") {
      out.push({
        id: "waiting_over_36",
        verdict: "rule_broken",
        title: "Waiting period longer than 36 months",
        why: `The letter applies a ${f.waitingMonthsStated}-month waiting period. Since 1 April 2024, waiting periods cannot exceed 36 months.`,
        ruleIds: [ruleId],
      });
    }
    if (cover !== null && cover >= 36) {
      out.push({
        id: "waiting_served",
        verdict: "rule_broken",
        title: "36 months of cover already completed",
        why: `You had ${cover} months of continuous cover. No waiting period can be longer than 36 months.`,
        ruleIds: [ruleId, "moratorium_credits_carry_over"],
      });
    } else if (cover === null) {
      out.push({
        id: "waiting_unknown",
        verdict: "worth_checking",
        title: "Check how long you have been covered",
        why: "Waiting periods are capped at 36 months of continuous cover. If your cover started 3+ years before admission, this ground fails.",
        ruleIds: [ruleId],
        ask: "coverStartDate",
      });
    }
    if (f.reasonId === "waiting_period" && f.accident) {
      out.push({
        id: "waiting_accident",
        verdict: "rule_broken",
        title: "Accidents are not subject to disease waiting periods",
        why: "Specific-disease waiting periods do not apply to treatment needed because of an accident.",
        ruleIds: ["specific_waiting_max_36m"],
      });
    }
    if (f.reasonId === "ped") {
      out.push({
        id: "ped_definition",
        verdict: "info",
        title: "What counts as pre-existing",
        why: "Only a condition diagnosed, or treated, within 36 months before the policy began is pre-existing. Ask the insurer for the record it relies on.",
        ruleIds: ["ped_definition"],
      });
    }
  }

  // 3. Documents and late intimation.
  if (f.reasonId === "documents") {
    out.push({
      id: "no_reject_for_documents",
      verdict: "rule_broken",
      title: "Claims cannot be rejected for missing documents or late intimation",
      why: "IRDAI says no claim shall be rejected or closed for want of documents or delayed intimation. The insurer or TPA must collect hospital documents itself and ask for everything at one go.",
      ruleIds: ["no_rejection_for_delay_or_documents", "insurer_collects_documents_from_hospital", "documents_asked_in_one_go"],
    });
  }

  // 4. Letter must give reasons with reference to specific policy terms.
  if (f.clausesCited.length === 0) {
    out.push({
      id: "no_clause_cited",
      verdict: "rule_broken",
      title: "Letter does not cite a policy clause",
      why: "A rejection must be told with full details and reference to the specific policy terms. Ask the insurer to name the clause.",
      ruleIds: ["rejection_reasons_in_writing"],
    });
  }
  out.push({
    id: "review_committee",
    verdict: "info",
    title: "Ask for the Claims Review Committee approval",
    why: "Every repudiation needs approval of the insurer's Claims Review Committee. You can ask for confirmation in your grievance.",
    ruleIds: ["repudiation_needs_claims_review_committee"],
  });

  // 5. Late settlement interest (reimbursement).
  if (f.claimType === "reimbursement" && f.claimSubmittedDate && f.letterDate) {
    const due = addDays(f.claimSubmittedDate, 15);
    const late = daysBetween(due, f.letterDate);
    if (late > 0) {
      out.push({
        id: "late_decision",
        verdict: "info",
        title: `Decision came ${late} days after the 15-day limit`,
        why: `Claims must be settled within 15 days of submission (by ${due}). If the claim is later paid, you are owed interest at bank rate plus 2% from the date of intimation.`,
        ruleIds: ["reimbursement_15_days", "late_interest_bank_rate_plus_2"],
      });
    }
  }

  // 6. Cashless denial is not a final rejection.
  if (f.reasonId === "cashless_denied" || f.claimType === "cashless") {
    out.push({
      id: "cashless_timelines",
      verdict: "info",
      title: "Cashless denied is not the end",
      why: "Insurers must decide cashless requests within 1 hour and discharge within 3 hours. If cashless is refused you can still file a reimbursement claim.",
      ruleIds: ["cashless_auth_1h", "discharge_auth_3h"],
    });
  }

  // 7. Room rent: no current IRDAI rule; be honest.
  if (f.reasonId === "room_rent") {
    out.push({
      id: "room_rent_no_rule",
      verdict: "info",
      title: "No IRDAI rule found on proportionate deduction",
      why: "We found no current IRDAI rule limiting room-rent or proportionate deductions; your policy wording decides. Past Ombudsman cases below show how such disputes went.",
      ruleIds: [],
    });
  }

  out.push({
    id: "ombudsman_free",
    verdict: "info",
    title: "Ombudsman is free, up to Rs 50 lakh",
    why: "The Insurance Ombudsman hears claim rejections at no cost, and can award up to Rs 50 lakh.",
    ruleIds: ["ombudsman_covers_claim_repudiation", "ombudsman_free_of_charge", "ombudsman_award_cap_50_lakh"],
  });

  for (const x of out) x.ruleIds.forEach(rule);
  const order: Record<Verdict, number> = { rule_broken: 0, worth_checking: 1, info: 2 };
  return out.sort((a, b) => order[a.verdict] - order[b.verdict]);
}
