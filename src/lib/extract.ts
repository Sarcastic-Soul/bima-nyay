import { chat } from "./llm";
import { LetterFields } from "./letter";

const PROMPT = `This is a photo or scan of an Indian health insurance claim rejection (repudiation / denial / partial settlement) letter, possibly in Hindi.
Read it and return ONLY a JSON object with these keys:
insurer, policyNumber, claimNumber, patientName (strings or null),
letterDate, coverStartDate, policyStartDate, admissionDate, claimSubmittedDate (YYYY-MM-DD or null),
claimAmount, approvedAmount (rupees as plain numbers, or null),
claimType ("cashless" | "reimbursement" | "unknown"),
diagnosis (string or null),
reasonText (the insurer's stated reason, copied in the original words),
reasonId,
clausesCited (array of clause numbers the letter cites, empty if none),
waitingMonthsStated (waiting period in months the letter says applies, years x 12, or null),
fraudAlleged (true or false),
accident (true, false or null),
readable (false if this is not a claim rejection letter or is unreadable, else true).
Copy numbers exactly. Indian letters write dates as DD/MM/YYYY; convert them to YYYY-MM-DD.
coverStartDate = first inception or "continuous cover since" date, if stated. policyStartDate = start of the current policy period.
reasonId is one of: ped (pre-existing disease), non_disclosure (facts hidden in proposal form), waiting_period (initial 30 days or specific-disease waiting),
exclusion (excluded treatment/condition), not_necessary (hospitalisation not required / OPD / investigation only), documents (documents not submitted, late intimation or submission),
room_rent (room rent limit / proportionate deduction), non_payable (non-medical items, reasonable and customary cut), cashless_denied (pre-authorisation refused), lapsed (policy not in force), other.
Never guess: use null when a field is not in the letter.`;

export type ExtractResult = { ok: true; fields: LetterFields } | { ok: false; error: string };

export async function extractLetter(image: { data: string; mimeType: string }): Promise<ExtractResult> {
  if (!image.mimeType.startsWith("image/")) return { ok: false, error: "images_only" };
  const res = await chat({
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: PROMPT },
          { type: "image_url", image_url: { url: `data:${image.mimeType};base64,${image.data}` } },
        ],
      },
    ],
    // Reading an image is one call and usually takes ~10 s, but slow ones pass 25 s; the route allows 60 s.
    timeoutMs: 50_000,
  });
  const json = res.content.match(/\{[\s\S]*\}/)?.[0];
  if (!json) return { ok: false, error: "could_not_read" };
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: "could_not_read" };
  }
  if (raw.readable === false) return { ok: false, error: "not_a_rejection_letter" };
  delete raw.readable;
  const parsed = LetterFields.safeParse({
    insurer: null, policyNumber: null, claimNumber: null, patientName: null, letterDate: null, coverStartDate: null,
    policyStartDate: null, admissionDate: null, claimSubmittedDate: null, claimAmount: null, approvedAmount: null,
    diagnosis: null, waitingMonthsStated: null, accident: null, clausesCited: [], fraudAlleged: false, claimType: "unknown",
    ...Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v === "" ? null : v])),
  });
  if (!parsed.success) return { ok: false, error: "could_not_read: " + parsed.error.issues.map((i) => i.path.join(".")).join(", ") };
  return { ok: true, fields: parsed.data };
}
