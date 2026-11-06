import { Type } from "@google/genai";
import { gemini, MODEL, withRetry } from "./gemini";
import { LetterFields } from "./letter";
import { REASON_IDS } from "./reasons";

const date = { type: Type.STRING, nullable: true, description: "YYYY-MM-DD or null" };
const str = { type: Type.STRING, nullable: true };
const num = { type: Type.NUMBER, nullable: true };

const schema = {
  type: Type.OBJECT,
  properties: {
    insurer: str, policyNumber: str, claimNumber: str, patientName: str,
    letterDate: date,
    coverStartDate: { ...date, description: "first inception / continuous cover since, if stated; else null" },
    policyStartDate: { ...date, description: "start of the current policy period" },
    admissionDate: date, claimSubmittedDate: date,
    claimAmount: num, approvedAmount: num,
    claimType: { type: Type.STRING, enum: ["cashless", "reimbursement", "unknown"] },
    diagnosis: str,
    reasonText: { type: Type.STRING, description: "insurer's stated reason, copied in original words" },
    reasonId: { type: Type.STRING, enum: [...REASON_IDS] },
    clausesCited: { type: Type.ARRAY, items: { type: Type.STRING } },
    waitingMonthsStated: { ...num, description: "waiting period in months the letter says applies (years x 12)" },
    fraudAlleged: { type: Type.BOOLEAN },
    accident: { type: Type.BOOLEAN, nullable: true },
    readable: { type: Type.BOOLEAN, description: "false if this is not a claim rejection letter or is unreadable" },
  },
  required: ["claimType", "reasonText", "reasonId", "clausesCited", "fraudAlleged", "readable"],
};

const PROMPT = `This is a photo or scan of an Indian health insurance claim rejection (repudiation / denial / partial settlement) letter, possibly in Hindi.
Read it and fill the fields. Copy numbers exactly. Dates as YYYY-MM-DD (Indian letters use DD/MM/YYYY). Amounts in rupees as plain numbers.
reasonId: ped (pre-existing disease), non_disclosure (facts hidden in proposal form), waiting_period (initial 30 days or specific-disease waiting),
exclusion (excluded treatment/condition), not_necessary (hospitalisation not required / OPD / investigation only), documents (documents not submitted, late intimation or submission),
room_rent (room rent limit / proportionate deduction), non_payable (non-medical items, reasonable and customary cut), cashless_denied (pre-authorisation refused), lapsed (policy not in force), other.
Never guess: use null when a field is not in the letter. If it is not a claim rejection letter, set readable=false.`;

export type ExtractResult = { ok: true; fields: LetterFields } | { ok: false; error: string };

export async function extractLetter(image: { data: string; mimeType: string }): Promise<ExtractResult> {
  const res = await withRetry(() =>
    gemini().models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ inlineData: image }, { text: PROMPT }] }],
      config: { responseMimeType: "application/json", responseSchema: schema, temperature: 0 },
    }),
  );
  const raw = JSON.parse(res.text ?? "{}");
  if (raw.readable === false) return { ok: false, error: "not_a_rejection_letter" };
  delete raw.readable;
  const parsed = LetterFields.safeParse({
    insurer: null, policyNumber: null, claimNumber: null, patientName: null, letterDate: null, coverStartDate: null,
    policyStartDate: null, admissionDate: null, claimSubmittedDate: null, claimAmount: null, approvedAmount: null,
    diagnosis: null, waitingMonthsStated: null, accident: null,
    ...Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v === "" ? null : v])),
  });
  if (!parsed.success) return { ok: false, error: "could_not_read: " + parsed.error.issues.map((i) => i.path.join(".")).join(", ") };
  return { ok: true, fields: parsed.data };
}
