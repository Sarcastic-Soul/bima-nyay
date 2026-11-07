# Sources: primary legal texts for Bima Nyay

Official documents downloaded on 2026-11-06. Each has a `.pdf` and a `.txt` made with `pdftotext -layout`.
`rules.json` holds exact quotes. Every quote is copied from the `.txt` (whitespace may be squeezed to single spaces).
Full direct download links are in the `url` field of each rule in `rules.json`.

Extra fields in `rules.json` beyond the ones asked for: `status` (`in_force` or `superseded`) and an optional `note`.

## Documents

| File (base name) | What it is | Date | Official page | Used for |
|---|---|---|---|---|
| `irdai-master-circular-health-2024` | IRDAI Master Circular on Health Insurance Business, Ref IRDAI/HLT/CIR/PRO/84/5/2024 (English version, 17 pages) | 29 May 2024 | https://irdai.gov.in/document-detail?documentId=4942918 | Moratorium, cashless 1 hour, discharge 3 hours, claims review committee, written reasons, Ombudsman award penalty |
| `irdai-master-circular-health-2024-annexure` | Annexures to the above (customer information sheet, forms, repealed circulars list in Annexure 6) | 29 May 2024 | same page | Shows the 2020 standardisation circular is repealed |
| `irdai-master-circular-protection-policyholders-2024` | IRDAI Master Circular on Protection of Policyholders' Interests, Ref IRDAI/PP&GR/CIR/MISC/117/9/2024 (English, scanned, OCR text) | 5 Sep 2024 | https://irdai.gov.in/document-detail?documentId=5625747 | 15-day reimbursement, interest at bank rate plus 2 percent, no rejection for delay or missing documents, 14-day grievance, Bima Bharosa, Ombudsman Rs 50 lakh |
| `irdai-insurance-products-regulations-2024` | IRDAI (Insurance Products) Regulations 2024, Gazette notified (Schedule III is health) | Gazette 22 Mar 2024, in force 1 Apr 2024 | https://irdai.gov.in/document-detail?documentId=4590475 | PED definition (36 months), PED waiting period cap, specific waiting period cap, moratorium (60 months) |
| `irdai-protection-policyholders-regulations-2024` | IRDAI (Protection of Policyholders' Interests, Operations and Allied Matters of Insurers) Regulations 2024 | in force 1 Apr 2024 | https://irdai.gov.in/document-detail?documentId=4590885 | Bank Rate definition, "call for documents at one go", grievance duties |
| `insurance-ombudsman-rules-2017-amended-2023` | Insurance Ombudsman Rules 2017, updated as on 9.11.2023 (includes 2018, 2021 and 2023 amendments) | 25 Apr 2017 (G.S.R. 413(E)); latest amendment 9 Nov 2023 (G.S.R. 828(E)) | Council for Insurance Ombudsmen: https://cioins.co.in | Rule 13 (what can be heard), rule 14 (how and when to complain), rule 17 (award, Rs 50 lakh cap, 3 months, 30 days) |
| `irdai-master-circular-standardization-health-2020` | HISTORY ONLY. Master Circular on Standardization of Health Insurance Products, IRDAI/HLT/REG/CIR/193/07/2020 | 22 Jul 2020 | https://irdai.gov.in/document-detail?documentId=395035 | Old values: 8-year moratorium, 48-month PED. Repealed by Annexure 6 of the 2024 health master circular |

Notes on the files:
- `irdai-master-circular-protection-policyholders-2024.pdf` is about 91 MB (it is a scan). Think before committing it to git. The text layer is OCR, so it has small errors (for example "IRDAl" for "IRDAI", "i s"). Quotes taken from it are copied as they appear in the `.txt`.
- The Ombudsman Rules PDF is the cioins.co.in "updated as on 9.11.2023" copy. It is an unofficial consolidation by the Council, built from the Gazette notifications. The gazette notifications themselves (G.S.R. 413(E) 2017, 147(E) 2021, 828(E) 2023) were not downloaded.
- Footnote numbers in the Ombudsman text (for example `1 [or insurance broker...]`, `3 [fifty]`) are part of the extracted text, so they are inside the quotes.

## Key findings

- Moratorium is 60 continuous months (5 years), counted with ported and migrated credits. It was 8 years under the 2020 circular. Only "established fraud" is allowed as an exception. The older text also said "permanent exclusions"; that wording is gone in 2024.
- PED: 36-month look-back and a waiting period of at most 36 months (old: 48 and 48). Specific-disease waiting period is "up to 36 months".
- Cashless authorisation: 1 hour. Discharge authorisation: 3 hours; the insurer pays the extra hospital cost if later than that.
- Reimbursement claims: "within fifteen days from submission of claim". Late interest is bank rate plus 2 percent, from the date of intimation of the claim, paid by the insurer without being asked.
- Rejection: needs approval of the Product Management Committee or its three-member Claims Review Committee, and the claimant must be told with full details and reference to the specific policy terms.
- Grievance: acknowledge immediately, resolve within 14 days. Bima Bharosa is the IRDAI portal.
- Ombudsman: award cap is Rs 50 lakh (rule 17(3) proviso (ii), raised by the 9 Nov 2023 amendment). Complaint must be within one year; award within three months; insurer complies within thirty days; award is binding.

## Things that differ from what we believed, or could NOT be found

1. 15 days is counted "from submission of claim", not "from the last document". The text does not say "last document". The Protection of Policyholders' Regulations 2024 (reg 23(4)) only say the insurer must ask for all documents at one go.
2. No-rejection-for-delay rule: the circular says "No claim shall be rejected or closed for want of documents or for delayed intimation of claim." There is no "if the delay is for valid reasons" condition. It is stronger than we thought.
3. Ombudsman "30 days" wait: rule 14(3)(a)(ii) says "one month" after the insurer received your representation, not 30 days. The 30 days is the insurer's time to comply with an award (rule 17(6)).
4. Money cap: Rs 50 lakh is confirmed, but in the Rules it is a cap on the compensation the Ombudsman may award (including expenses), not a limit on claim value. The 2024 Master Circular on Protection of Policyholders' Interests states it as a claim-amount limit ("in case the claim amount is up to Rs. 50 lakhs"). Rule 13 itself has no claim-value limit.
5. Interest rate on Ombudsman awards: rule 17(7) points to "a rate per annum as specified in the regulations", without a number in the Rules. The number (bank rate plus 2 percent) comes from the circular.
6. Not found: any rule on proportionate deduction, room-rent limits or sub-limits applying to ICU, pharmacy or implants. The 2024 documents have none. The 2020 circular, which has room-rent wording, is repealed. Do not present a proportionate-deduction rule as an IRDAI rule from these sources.
7. Not found: IRDAI Health Insurance Regulations 2016 as a separate document. The 8-year moratorium was in the 2020 circular (downloaded as history), not in the 2016 regulations, so the 2016 file was skipped.
8. The 5 Sep 2024 Master Circular on Protection of Policyholders' Interests has no explicit effective date in the text; `in_force_from` uses its issue date.
9. Newer changes: a web search found no official IRDAI circular after Sep 2024 that changes these rules. Some 2026 blog posts claim new rules but cite no circular number. The health master circular says it is reviewed every year, so check irdai.gov.in for a newer version before launch. The IRDAI site could not be fully browsed for an updated version.
10. The cioins.co.in (Ombudsman) site serves the PDF only from port 8082 and may change links.

## Scale numbers

`ombudsman-annual-reports.md` holds the complaint counts from the Council for Insurance Ombudsmen annual reports (2023-24 and 2024-25) that the README and the submission quote. It is not a rule source and `rules.json` does not use it.
