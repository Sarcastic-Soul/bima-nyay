# Sample repudiation letters

Six made-up claim rejection letters for the demo and for testing extraction. Every insurer, TPA, person, address, phone number and registration number is invented. Each letter has a small footer: "SAMPLE — synthetic letter for demonstration".

Files for letter `N-slug`:

- `samples/letters/N-slug.html` is the source (edit this, then re-render)
- `samples/letters/N-slug.expected.json` is the ground truth for the extraction type
- `public/samples/N-slug.png` is the image to upload (about 1240px wide, under 600 KB)

To re-render, open each HTML file at a 1240px wide viewport and take a screenshot. Letters 3 and 5 use a 1240x1700 viewport (they are phone photos). The two photo PNGs were also reduced to a 128 colour palette to keep them small.

## What each letter tests

| # | Slug | Insurer (made up) | Look | What it tests | Expected outcome |
|---|------|-------------------|------|---------------|------------------|
| 1 | non_disclosure | Suraksha Kavach General Insurance Co. Ltd. | Clean scan, serif, insurer letterhead | Insurer says hypertension was not disclosed (Clause 6.2). Cover has run without a break since 12/04/2019, and the admission is 18/08/2025, which is over 60 months. | Flag as likely wrong. The 60 month moratorium should apply, so the claim cannot be rejected for non-disclosure unless there is proven fraud. Strong appeal case. |
| 2 | ped | Jeevan Rekha Health Insurance Co. Ltd. (letter sent by CarePoint Sahayak TPA) | Clean scan, orange TPA letterhead, details grid | Cashless request denied for a diabetes complication under a 48 month waiting period for pre-existing diseases. Policy started 15/06/2024, so about 14 months of cover. | Flag as likely wrong. The legal limit for the pre-existing disease waiting period is 36 months, so a 48 month period is not allowed. Strong appeal case. |
| 3 | documents | Nakshatra National Assurance Co. Ltd. | Phone photo, typewriter font, tilted, shadow, low contrast, "CLAIMS - REJECTED" stamp | Rejected for late intimation and for documents sent 45 days after discharge (30 days allowed, Clause 5.4). Tests reading a messy photo. | Treat as weak for the insurer. A delay alone is normally not a good reason to reject if the claim is genuine; the rules ask insurers to look at the reason for the delay. Appeal worth trying. |
| 4 | waiting_period | Anantam Mutual Health Insurance Ltd. | Clean scan, modern layout with a dark side panel | Cataract surgery on 22/07/2025, 16 months 17 days after cover began (05/03/2024). A 24 month specific waiting period applies (Clause 4.3). | The insurer is most likely right. No rule is broken (24 months is within the allowed limit). The app should say the rejection looks valid and not push an appeal. This is the "do not cry wolf" case. |
| 5 | room_rent | Vistar Shield General Insurance Co. Ltd. (letter sent by Lakshya Claims Management TPA) | Phone photo, tilted the other way, shadow on one corner, itemised table | Partial settlement. Claimed Rs 2,48,600, admitted Rs 1,64,600. Room limit Rs 5,000 a day, room taken Rs 9,000 a day, so doctor, OT and nursing charges were cut to 5/9 (Clause 3.7). Deduction adds up: Rs 16,000 room excess + Rs 52,000 proportionate + Rs 16,000 non-payable items = Rs 84,000. | Needs a check of whether the proportionate cut was applied to items that should not be cut (it was applied to surgeon, anaesthetist, OT and nursing fees). Treat as a partial settlement: approved amount is less than claimed, no total rejection. |
| 6 | not_necessary | Nirbhay Suraksha Health Insurance Co. Ltd. | Clean scan, Hindi (Devanagari), framed letter, Noto Sans Devanagari | Rejected because "hospital stay was not needed, could be treated as OPD". No clause number is given anywhere. Tests Hindi reading and an empty clauses list. | Flag as likely wrong. The insurer must point to a policy clause and a medical reason, and it gave no clause. Reasonable appeal case. |

## Notes on the expected JSON

- Dates are `YYYY-MM-DD`. Amounts are plain numbers in rupees (no commas). Fields not in the letter are `null` (only `waitingMonthsStated` is `null` here, in letters where no waiting period is stated).
- `coverStartDate` is the date the continuous cover began. `policyStartDate` is the start of the current policy period when the letter shows both (letters 1, 3, 4). When the letter shows only one start date, both fields carry that same date (letters 2, 5, 6).
- `claimSubmittedDate` is the date the letter says the claim, documents or final bill reached the insurer. For the cashless letter 2 it is the date the pre-authorisation was received.
- `claimAmount` for letter 2 is the estimated cost in the pre-authorisation request. For letter 5 it is the total of the final bill.
- `insurer` is the insurance company, not the TPA, for letters 2 and 5.
- Letter 6: `insurer`, `patientName` and `diagnosis` are as written in Hindi in the letter. The English company name is also printed in the letter header (Nirbhay Suraksha Health Insurance Co. Ltd.), so either form is fine to accept when scoring.
- `fraudAlleged` and `accident` are `false` in all six (no letter alleges fraud, and all are illnesses).
- `reasonText` is copied word for word from the letter's reason paragraph, so you can use it for a plain text match.
- `clausesCited` lists the clause numbers the letter names, for example `"Clause 6.2"`. It is empty for letter 6.
