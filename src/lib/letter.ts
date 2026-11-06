import { z } from "zod";
import { REASON_IDS } from "./reasons";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Facts read from a rejection letter (by Gemini vision) and confirmed or corrected by the user. */
export const LetterFields = z.object({
  insurer: z.string().nullable(),
  policyNumber: z.string().nullable(),
  claimNumber: z.string().nullable(),
  patientName: z.string().nullable(),
  /** Date of the rejection letter. */
  letterDate: isoDate.nullable(),
  /** Start of continuous health cover with any insurer (first policy, counting portability). */
  coverStartDate: isoDate.nullable(),
  /** Start of the current policy year. */
  policyStartDate: isoDate.nullable(),
  admissionDate: isoDate.nullable(),
  /** When the claim papers were submitted (reimbursement claims). */
  claimSubmittedDate: isoDate.nullable(),
  claimAmount: z.number().nullable(),
  approvedAmount: z.number().nullable(),
  claimType: z.enum(["cashless", "reimbursement", "unknown"]),
  diagnosis: z.string().nullable(),
  /** Insurer's stated reason, in its own words. */
  reasonText: z.string(),
  reasonId: z.enum(REASON_IDS as [string, ...string[]]),
  /** Policy clause numbers the letter cites. Empty if none. */
  clausesCited: z.array(z.string()),
  /** Waiting period (months) the letter says applies, if any. */
  waitingMonthsStated: z.number().nullable(),
  /** Does the letter allege fraud? */
  fraudAlleged: z.boolean(),
  /** Did the hospitalisation follow an accident? */
  accident: z.boolean().nullable(),
});
export type LetterFields = z.infer<typeof LetterFields>;
