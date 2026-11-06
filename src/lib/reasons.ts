/** Reasons insurers give for rejecting a health claim. Shared by labelling, rules and UI. */
export const REASONS = {
  ped: { en: "Pre-existing disease", hi: "पहले से मौजूद बीमारी" },
  non_disclosure: { en: "Non-disclosure / misrepresentation", hi: "जानकारी छिपाना" },
  waiting_period: { en: "Waiting period not over", hi: "प्रतीक्षा अवधि पूरी नहीं" },
  exclusion: { en: "Excluded treatment or condition", hi: "पॉलिसी में शामिल नहीं" },
  not_necessary: { en: "Hospitalisation not needed / OPD treatment", hi: "भर्ती ज़रूरी नहीं थी" },
  documents: { en: "Missing documents or late intimation", hi: "दस्तावेज़ अधूरे या देर से सूचना" },
  room_rent: { en: "Room-rent limit / proportionate deduction", hi: "कमरे का किराया सीमा / अनुपातिक कटौती" },
  non_payable: { en: "Non-payable items / reasonable-charges cut", hi: "अदेय मदें / उचित शुल्क कटौती" },
  cashless_denied: { en: "Cashless denied", hi: "कैशलेस से मना" },
  lapsed: { en: "Policy lapsed or not in force", hi: "पॉलिसी चालू नहीं" },
  other: { en: "Other", hi: "अन्य" },
} as const;

export type ReasonId = keyof typeof REASONS;
export const REASON_IDS = Object.keys(REASONS) as ReasonId[];

export const OUTCOMES = ["allowed", "partly_allowed", "dismissed", "settled", "other"] as const;
export type Outcome = (typeof OUTCOMES)[number];
