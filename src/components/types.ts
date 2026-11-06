import type { Summary } from "@/lib/agent";
import type { CaseHit, OutcomeSummary } from "@/lib/cases/stats";
import type { DeadlineStep } from "@/lib/deadlines";
import type { Finding } from "@/lib/rules/check";
import type { OmbudsmanOffice } from "@/lib/ombudsman/offices";

export type Situation = {
  state: string;
  district: string;
  grievanceSentDate: string;
  grievanceReplyDate: string;
};

export type ReportState = {
  steps: string[];
  findings?: Finding[];
  cases?: { hits: CaseHit[]; outcomes: OutcomeSummary };
  deadlines?: DeadlineStep[];
  office?: { office: OmbudsmanOffice; certain: boolean } | null;
  summary?: Summary;
  error?: string;
  done: boolean;
};
