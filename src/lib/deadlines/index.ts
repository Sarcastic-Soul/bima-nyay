/**
 * Deadlines for challenging a rejected health claim, from the Insurance
 * Ombudsman Rules 2017 (amended 2023) and the IRDAI Protection of
 * Policyholders' Interests Master Circular 2024. Pure date maths, no AI.
 * Dates are ISO strings (YYYY-MM-DD), treated as calendar days in IST.
 */
import { rule } from "../rules/sources";

export type DeadlineInput = {
  /** Date on the insurer's rejection letter. */
  rejectionDate: string;
  /** When the user sent a written grievance to the insurer, if they have. */
  grievanceSentDate?: string;
  /** When the insurer replied to that grievance, if it has. */
  grievanceReplyDate?: string;
  today: string;
};

export type StepStatus = "todo" | "waiting" | "open" | "closing_soon" | "missed" | "done";

export type DeadlineStep = {
  id: "grievance" | "insurer_reply" | "ombudsman";
  status: StepStatus;
  /** Earliest date this step can be taken (ombudsman) or date it is due (insurer reply). */
  from?: string;
  /** Last date for this step. */
  until?: string;
  daysLeft?: number;
  ruleIds: string[];
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function parse(d: string): Date {
  if (!ISO.test(d)) throw new Error(`Bad date: ${d}`);
  const dt = new Date(`${d}T00:00:00Z`);
  if (Number.isNaN(dt.getTime()) || dt.toISOString().slice(0, 10) !== d) throw new Error(`Bad date: ${d}`);
  return dt;
}
const fmt = (d: Date) => d.toISOString().slice(0, 10);

export function addDays(d: string, n: number): string {
  const dt = parse(d);
  dt.setUTCDate(dt.getUTCDate() + n);
  return fmt(dt);
}

/** Calendar months; clamps to the last day of a shorter month (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(d: string, n: number): string {
  const dt = parse(d);
  const day = dt.getUTCDate();
  dt.setUTCDate(1);
  dt.setUTCMonth(dt.getUTCMonth() + n);
  const last = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0)).getUTCDate();
  dt.setUTCDate(Math.min(day, last));
  return fmt(dt);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parse(b).getTime() - parse(a).getTime()) / 86_400_000);
}

const CLOSING_SOON_DAYS = 30;

export function computeDeadlines(input: DeadlineInput): DeadlineStep[] {
  const { rejectionDate, grievanceSentDate, grievanceReplyDate, today } = input;
  parse(rejectionDate);
  parse(today);
  if (grievanceSentDate && daysBetween(rejectionDate, grievanceSentDate) < 0)
    throw new Error("Grievance date is before the rejection date");
  if (grievanceReplyDate && !grievanceSentDate) throw new Error("Reply date given without a grievance date");
  if (grievanceReplyDate && grievanceSentDate && daysBetween(grievanceSentDate, grievanceReplyDate) < 0)
    throw new Error("Reply date is before the grievance date");

  const steps: DeadlineStep[] = [];

  // 1. Written grievance to the insurer (needed before the Ombudsman, rule 14(3)(a)).
  steps.push({
    id: "grievance",
    status: grievanceSentDate ? "done" : "todo",
    from: grievanceSentDate,
    ruleIds: ["ombudsman_complain_to_insurer_first", "grievance_ack_and_14_days"],
  });
  if (!grievanceSentDate) {
    steps.push({ id: "ombudsman", status: "waiting", ruleIds: ["ombudsman_complain_to_insurer_first"] });
    return steps;
  }

  // 2. Insurer must resolve within 14 days (IRDAI). Ombudsman route opens on
  //    the insurer's reply, or one month after the grievance if no reply.
  const replyDue = addDays(grievanceSentDate, 14);
  steps.push({
    id: "insurer_reply",
    status: grievanceReplyDate ? "done" : daysBetween(today, replyDue) < 0 ? "missed" : "waiting",
    from: grievanceReplyDate,
    until: replyDue,
    daysLeft: grievanceReplyDate ? undefined : daysBetween(today, replyDue),
    ruleIds: ["grievance_ack_and_14_days"],
  });

  // 3. Ombudsman window: one year from the insurer's reply, or from the end of
  //    the one-month no-reply period (rule 14(3)(b)).
  const opens = grievanceReplyDate ?? addMonths(grievanceSentDate, 1);
  const closes = addMonths(opens, 12);
  const left = daysBetween(today, closes);
  let status: StepStatus;
  if (daysBetween(today, opens) > 0) status = "waiting";
  else if (left < 0) status = "missed";
  else if (left <= CLOSING_SOON_DAYS) status = "closing_soon";
  else status = "open";
  steps.push({
    id: "ombudsman",
    status,
    from: opens,
    until: closes,
    daysLeft: left,
    ruleIds: [
      grievanceReplyDate ? "ombudsman_one_year_limit" : "ombudsman_one_month_no_reply_clock",
      grievanceReplyDate ? "ombudsman_insurer_rejected" : "ombudsman_no_reply_one_month",
      ...(status === "missed" ? ["ombudsman_delay_condonation"] : []),
    ],
  });

  // Every cited rule must exist.
  for (const s of steps) s.ruleIds.forEach(rule);
  return steps;
}
