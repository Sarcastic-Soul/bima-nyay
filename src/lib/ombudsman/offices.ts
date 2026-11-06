/**
 * Insurance Ombudsman offices and their territorial jurisdiction.
 *
 * Source: Council for Insurance Ombudsmen (CIO), "Contact details of Ombudsman
 * Centres" at https://www.cioins.co.in/Ombudsman, plus the two jurisdiction
 * annexures it links for Mumbai and Thane. Fetched 2026-11-07. The Insurance
 * Ombudsman Rules 2017 (rule 11) leave the jurisdiction list to the CIO, so the
 * Rules text has no schedule. See sources/ombudsman-offices.md for notes.
 *
 * There are 18 offices (not 17): Thane was split out of Mumbai and sits next
 * to Pune and Mumbai in Maharashtra.
 *
 * Which office to use (Rule 14(1)): the Ombudsman whose area covers EITHER the
 * insurer's branch/office complained against, OR the complainant's home
 * address. A caller may pick either, so `findOffice` is normally fed the
 * complainant's own state/district.
 *
 * Official complaint channels (see COMPLAINT_CHANNELS below):
 *  - Ombudsman: online at https://cioins.co.in/Complaint/Online (the CIO's own
 *    e-filing form), by email to the office, or in writing.
 *  - Insurer grievances (the step before the Ombudsman): the insurer's own
 *    grievance officer, then Bima Bharosa, IRDAI's portal:
 *    https://bimabharosa.irdai.gov.in
 */

export type OmbudsmanOffice = {
  id: string;
  city: string;
  address: string;
  phone: string[];
  email: string[];
  /** States / UTs covered in full by this office. */
  states: string[];
  /** State -> districts covered by this office, when the state is split. */
  districts?: Record<string, string[]>;
  sourceUrl: string;
};

export const COMPLAINT_CHANNELS = {
  /** CIO home page / list of offices. */
  ombudsmanSite: "https://www.cioins.co.in",
  /** CIO online complaint form (checked 2026-11-07, HTTP 200). */
  ombudsmanOnline: "https://cioins.co.in/Complaint/Online",
  ombudsmanTrack: "https://cioins.co.in/Complaint/Track",
  /** Council head office email, for general queries (not complaints). */
  councilEmail: "inscoun@cioins.co.in",
  /** IRDAI grievance portal: file against the insurer before the Ombudsman. */
  bimaBharosa: "https://bimabharosa.irdai.gov.in",
} as const;

const SRC = "https://www.cioins.co.in/Ombudsman";

export const OFFICES: OmbudsmanOffice[] = [
  {
    id: "ahmedabad",
    city: "Ahmedabad",
    address:
      "Office of the Insurance Ombudsman, Jeevan Prakash Building, 6th floor, Tilak Marg, Relief Road, Ahmedabad - 380 001",
    phone: ["079-25501201", "079-25501202"],
    email: ["oio.ahmedabad@cioins.co.in"],
    states: ["Gujarat", "Dadra and Nagar Haveli and Daman and Diu"],
    sourceUrl: SRC,
  },
  {
    id: "bengaluru",
    city: "Bengaluru",
    address:
      "Office of the Insurance Ombudsman, Jeevan Soudha Building, PID No. 57-27-N-19, Ground Floor, 19/19, 24th Main Road, JP Nagar, Ist Phase, Bengaluru - 560 078",
    phone: ["080-26652048", "080-26652049"],
    email: ["oio.bengaluru@cioins.co.in"],
    states: ["Karnataka"],
    sourceUrl: SRC,
  },
  {
    id: "bhopal",
    city: "Bhopal",
    address:
      "Office of the Insurance Ombudsman, 1st floor, Jeevan Shikha, 60-B, Hoshangabad Road, Opp. Gayatri Mandir, Arera Hills, Bhopal - 462 011",
    phone: ["0755-2769201", "0755-2769202", "0755-2769203"],
    email: ["oio.bhopal@cioins.co.in"],
    states: ["Madhya Pradesh", "Chhattisgarh"],
    sourceUrl: SRC,
  },
  {
    id: "bhubaneswar",
    city: "Bhubaneswar",
    address:
      "Office of the Insurance Ombudsman, 62, Forest Park, Bhubaneswar - 751 009",
    phone: ["0674-2596461", "0674-2596455", "0674-2596429", "0674-2596003"],
    email: ["oio.bhubaneswar@cioins.co.in"],
    states: ["Odisha"],
    sourceUrl: SRC,
  },
  {
    id: "chandigarh",
    city: "Chandigarh",
    address:
      "Office of the Insurance Ombudsman, Jeevan Deep Building, SCO 20-27, Ground Floor, Sector 17-A, Chandigarh - 160 017",
    phone: ["0172-2706468"],
    email: ["oio.chandigarh@cioins.co.in"],
    states: [
      "Punjab",
      "Himachal Pradesh",
      "Jammu and Kashmir",
      "Ladakh",
      "Chandigarh",
    ],
    // Haryana except the four places given to Delhi.
    districts: { Haryana: [] },
    sourceUrl: SRC,
  },
  {
    id: "chennai",
    city: "Chennai",
    address:
      "Office of the Insurance Ombudsman, Fatima Akhtar Court, 4th Floor, 453, Anna Salai, Teynampet, Chennai - 600 018",
    phone: ["044-24333668", "044-24333678"],
    email: ["oio.chennai@cioins.co.in"],
    states: ["Tamil Nadu"],
    districts: { Puducherry: ["Puducherry", "Karaikal"] },
    sourceUrl: SRC,
  },
  {
    id: "delhi",
    city: "Delhi",
    address:
      "Office of the Insurance Ombudsman, 2/2 A, Universal Insurance Building, Asaf Ali Road, New Delhi - 110 002",
    phone: ["011-46013992", "011-23213504", "011-23232481"],
    email: ["oio.delhi@cioins.co.in"],
    states: ["Delhi"],
    districts: { Haryana: ["Gurugram", "Faridabad", "Sonepat", "Bahadurgarh"] },
    sourceUrl: SRC,
  },
  {
    id: "guwahati",
    city: "Guwahati",
    address:
      "Office of the Insurance Ombudsman, Jeevan Nivesh, 5th Floor, Near Pan Bazar, S.S. Road, Guwahati - 781 001 (Assam)",
    phone: ["0361-2632204", "0361-2602205", "0361-2631307"],
    email: ["oio.guwahati@cioins.co.in"],
    states: [
      "Assam",
      "Meghalaya",
      "Manipur",
      "Mizoram",
      "Arunachal Pradesh",
      "Nagaland",
      "Tripura",
    ],
    sourceUrl: SRC,
  },
  {
    id: "hyderabad",
    city: "Hyderabad",
    address:
      "Office of the Insurance Ombudsman, 6-2-46, 1st floor, Moin Court, Lane Opp. Hyundai Showroom, A. C. Guards, Lakdi-Ka-Pool, Hyderabad - 500 004",
    phone: [
      "040-23312122",
      "040-23376991",
      "040-23376599",
      "040-23328709",
      "040-23325325",
    ],
    email: ["oio.hyderabad@cioins.co.in"],
    states: ["Andhra Pradesh", "Telangana"],
    districts: { Puducherry: ["Yanam"] },
    sourceUrl: SRC,
  },
  {
    id: "jaipur",
    city: "Jaipur",
    address:
      "Office of the Insurance Ombudsman, Jeevan Nidhi - II Bldg., Ground Floor, Bhawani Singh Marg, Jaipur - 302 005",
    phone: ["0141-2740363"],
    email: ["oio.jaipur@cioins.co.in"],
    states: ["Rajasthan"],
    sourceUrl: SRC,
  },
  {
    id: "kochi",
    city: "Kochi",
    address:
      "Office of the Insurance Ombudsman, 10th Floor, Jeevan Prakash, LIC Building, Opp to Maharaja's College Ground, M.G. Road, Kochi - 682 011",
    phone: ["0484-2358759"],
    // The CIO lists this office's email as oio.ernakulam@ (old name).
    email: ["oio.ernakulam@cioins.co.in"],
    states: ["Kerala", "Lakshadweep"],
    districts: { Puducherry: ["Mahe"] },
    sourceUrl: SRC,
  },
  {
    id: "kolkata",
    city: "Kolkata",
    address:
      "Office of the Insurance Ombudsman, Hindustan Bldg. Annexe, 7th Floor, 4, C.R. Avenue, Kolkata - 700 072",
    phone: ["033-22124339", "033-22124341"],
    email: ["oio.kolkata@cioins.co.in"],
    states: ["West Bengal", "Sikkim", "Andaman and Nicobar Islands"],
    sourceUrl: SRC,
  },
  {
    id: "lucknow",
    city: "Lucknow",
    address:
      "Office of the Insurance Ombudsman, 6th Floor, Jeevan Bhawan, Phase-II, Nawal Kishore Road, Hazratganj, Lucknow - 226 001",
    phone: ["0522-4002082", "0522-3500613"],
    email: ["oio.lucknow@cioins.co.in"],
    states: [],
    // Official list (modern district names; see sources/ombudsman-offices.md
    // for the CIO's old spellings, e.g. Allahabad = Prayagraj).
    districts: {
      "Uttar Pradesh": [
        "Lalitpur",
        "Jhansi",
        "Mahoba",
        "Hamirpur",
        "Banda",
        "Chitrakoot",
        "Prayagraj",
        "Mirzapur",
        "Sonbhadra",
        "Fatehpur",
        "Pratapgarh",
        "Jaunpur",
        "Varanasi",
        "Ghazipur",
        "Jalaun",
        "Kanpur Nagar",
        "Kanpur Dehat",
        "Lucknow",
        "Unnao",
        "Sitapur",
        "Lakhimpur Kheri",
        "Bahraich",
        "Barabanki",
        "Raebareli",
        "Shravasti",
        "Gonda",
        "Ayodhya",
        "Amethi",
        "Kaushambi",
        "Balrampur",
        "Basti",
        "Ambedkar Nagar",
        "Sultanpur",
        "Maharajganj",
        "Sant Kabir Nagar",
        "Azamgarh",
        "Kushinagar",
        "Gorakhpur",
        "Deoria",
        "Mau",
        "Chandauli",
        "Ballia",
        "Siddharthnagar",
      ],
    },
    sourceUrl: SRC,
  },
  {
    id: "mumbai",
    city: "Mumbai",
    address:
      "Office of the Insurance Ombudsman, 3rd Floor, Jeevan Seva Annexe, S. V. Road, Santacruz (W), Mumbai - 400 054",
    phone: [
      "022-69038800",
      "022-69038827",
      "022-69038829",
      "022-69038831",
      "022-69038832",
      "022-69038833",
    ],
    email: ["oio.mumbai@cioins.co.in"],
    states: [],
    // Mumbai City district is all Mumbai. Mumbai Suburban is Mumbai except the
    // wards M/East, M/West, N, S and T, which go to Thane (THANE_MUMBAI_WARDS).
    districts: { Maharashtra: ["Mumbai City", "Mumbai Suburban"] },
    sourceUrl: SRC,
  },
  {
    id: "noida",
    city: "Noida",
    address:
      "Office of the Insurance Ombudsman, Bhagwan Sahai Palace, 4th Floor, Main Road, Naya Bans, Sector 15, Distt: Gautam Buddh Nagar, U.P. - 201 301",
    phone: ["0120-4027589"],
    email: ["oio.noida@cioins.co.in"],
    states: ["Uttarakhand"],
    districts: {
      "Uttar Pradesh": [
        "Agra",
        "Aligarh",
        "Baghpat",
        "Bareilly",
        "Bijnor",
        "Budaun",
        "Bulandshahr",
        "Etah",
        "Kannauj",
        "Mainpuri",
        "Mathura",
        "Meerut",
        "Moradabad",
        "Muzaffarnagar",
        "Auraiya",
        "Pilibhit",
        "Etawah",
        "Farrukhabad",
        "Firozabad",
        "Gautam Buddha Nagar",
        "Ghaziabad",
        "Hardoi",
        "Shahjahanpur",
        "Hapur",
        "Shamli",
        "Rampur",
        "Kasganj",
        "Sambhal",
        "Amroha",
        "Hathras",
        "Saharanpur",
      ],
    },
    sourceUrl: SRC,
  },
  {
    id: "patna",
    city: "Patna",
    address:
      "Office of the Insurance Ombudsman, 2nd Floor, Lalit Bhawan, Bailey Road, Patna - 800 001",
    phone: ["0612-2547068"],
    email: ["oio.patna@cioins.co.in"],
    states: ["Bihar", "Jharkhand"],
    sourceUrl: SRC,
  },
  {
    id: "pune",
    city: "Pune",
    address:
      "Office of the Insurance Ombudsman, Jeevan Darshan Bldg., 3rd Floor, C.T.S. Nos. 195 to 198, N.C. Kelkar Road, Narayan Peth, Pune - 411 030",
    phone: ["020-24471175"],
    email: ["oio.pune@cioins.co.in"],
    states: ["Goa"],
    // Official text: Maharashtra excluding Navi Mumbai, Thane, Palghar, Raigad
    // and the Mumbai Metropolitan Region. That leaves these 31 districts.
    districts: {
      Maharashtra: [
        "Ahilyanagar",
        "Akola",
        "Amravati",
        "Beed",
        "Bhandara",
        "Buldhana",
        "Chandrapur",
        "Chhatrapati Sambhajinagar",
        "Dharashiv",
        "Dhule",
        "Gadchiroli",
        "Gondia",
        "Hingoli",
        "Jalgaon",
        "Jalna",
        "Kolhapur",
        "Latur",
        "Nagpur",
        "Nanded",
        "Nandurbar",
        "Nashik",
        "Parbhani",
        "Pune",
        "Ratnagiri",
        "Sangli",
        "Satara",
        "Sindhudurg",
        "Solapur",
        "Wardha",
        "Washim",
        "Yavatmal",
      ],
    },
    sourceUrl: SRC,
  },
  {
    id: "thane",
    city: "Thane",
    address:
      "Office of the Insurance Ombudsman, Jeevan Chintamani Building, 2nd Floor, Near New RTO Office, Louis Wadi, Vasantrao Naik Mahamarg, Thane (West) - 400 604",
    phone: ["022-20812868", "022-20812869"],
    email: ["oio.thane@cioins.co.in"],
    states: [],
    districts: {
      Maharashtra: ["Thane", "Palghar", "Raigad", "Navi Mumbai"],
    },
    sourceUrl: SRC,
  },
];

/** Mumbai Suburban wards that belong to Thane, not Mumbai (CIO Annexure A). */
export const THANE_MUMBAI_WARDS = ["M/East", "M/West", "N", "S", "T"] as const;

/** All states and UTs, official spelling (28 states + 8 UTs). */
export const STATES: string[] = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

/** Lowercase letters only: drops case, spaces, dots, dashes, accents, "&". */
function key(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\b(district|dist)\b/g, "")
    .replace(/[^a-z]/g, "");
}

const STATE_ALIASES: Record<string, string> = {};
for (const s of STATES) STATE_ALIASES[key(s)] = s;
const stateAlias = (canonical: string, ...variants: string[]) => {
  for (const v of variants) STATE_ALIASES[key(v)] = canonical;
};
stateAlias("Odisha", "Orissa");
stateAlias("Uttarakhand", "Uttaranchal");
stateAlias("Puducherry", "Pondicherry", "Pondichery", "Puduchery");
stateAlias("Delhi", "NCT of Delhi", "National Capital Territory of Delhi", "New Delhi");
stateAlias("Jammu and Kashmir", "J&K", "Jammu Kashmir", "Jammu & Kashmir");
stateAlias("Andaman and Nicobar Islands", "Andaman Nicobar", "A&N Islands", "Andaman");
stateAlias(
  "Dadra and Nagar Haveli and Daman and Diu",
  "Dadra and Nagar Haveli",
  "Dadra & Nagar Haveli",
  "Daman and Diu",
  "Daman & Diu",
  "Daman",
  "Diu",
  "Dadra",
  "Silvassa",
);
stateAlias("Chhattisgarh", "Chattisgarh", "Chhatisgarh");
stateAlias("Telangana", "Telengana");
stateAlias("Tamil Nadu", "Tamilnadu");
stateAlias("Uttar Pradesh", "UP", "U.P.");
stateAlias("West Bengal", "Bengal");
stateAlias("Maharashtra", "Maharastra");
stateAlias("Karnataka", "Karnatka");
stateAlias("Arunachal Pradesh", "Arunachal");

/** City names people use as "state" (old and new). Fallback only, never certain. */
const CITY_ALIASES: Record<string, string> = {};
for (const o of OFFICES) CITY_ALIASES[key(o.city)] = o.id;
CITY_ALIASES[key("Bangalore")] = "bengaluru";
CITY_ALIASES[key("Bombay")] = "mumbai";
CITY_ALIASES[key("Navi Mumbai")] = "thane";
CITY_ALIASES[key("Cochin")] = "kochi";
CITY_ALIASES[key("Ernakulam")] = "kochi";
CITY_ALIASES[key("Calcutta")] = "kolkata";
CITY_ALIASES[key("Madras")] = "chennai";
CITY_ALIASES[key("Gurgaon")] = "delhi";
CITY_ALIASES[key("Gurugram")] = "delhi";
CITY_ALIASES[key("Allahabad")] = "lucknow";
CITY_ALIASES[key("Prayagraj")] = "lucknow";
CITY_ALIASES[key("Greater Noida")] = "noida";
CITY_ALIASES[key("Bhubaneshwar")] = "bhubaneswar";
CITY_ALIASES[key("Poona")] = "pune";

/** Old/variant district spellings -> the name stored in OFFICES. */
const DISTRICT_ALIASES: Record<string, string> = {};
const districtAlias = (canonical: string, ...variants: string[]) => {
  for (const v of variants) DISTRICT_ALIASES[key(v)] = canonical;
};
// Uttar Pradesh (CIO page spellings and old names)
districtAlias("Prayagraj", "Allahabad");
districtAlias("Ayodhya", "Faizabad");
districtAlias("Ghazipur", "Gazipur");
districtAlias("Gorakhpur", "Gorkhpur");
districtAlias("Sonbhadra", "Sonbhabdra");
districtAlias("Maharajganj", "Maharajgang");
districtAlias("Sant Kabir Nagar", "Santkabirnagar");
districtAlias("Siddharthnagar", "Sidharathnagar", "Siddharth Nagar", "Sidharth Nagar");
districtAlias("Shravasti", "Sravasti");
districtAlias("Raebareli", "Rae Bareli", "Rai Bareli");
districtAlias("Lakhimpur Kheri", "Lakhimpur", "Kheri");
districtAlias("Kanpur Nagar", "Kanpur");
districtAlias("Baghpat", "Bagpat");
districtAlias("Bulandshahr", "Bulandshehar", "Bulandshahar");
districtAlias("Auraiya", "Oraiyya", "Oraiya");
districtAlias("Firozabad", "Firozbad");
districtAlias("Kasganj", "Kashganj", "Kanshiramnagar", "Kanshi Ram Nagar");
districtAlias("Gautam Buddha Nagar", "Gautam Buddh Nagar", "Noida", "Greater Noida");
districtAlias("Kaushambi", "Kausambi");
districtAlias("Budaun", "Badaun");
districtAlias("Amethi", "Chhatrapati Shahuji Maharaj Nagar");
districtAlias("Raebareli", "Raibareli");
districtAlias("Muzaffarnagar", "Muzzafarnagar");
// Haryana
districtAlias("Gurugram", "Gurgaon");
districtAlias("Sonepat", "Sonipat");
// Puducherry
districtAlias("Puducherry", "Pondicherry", "Pondichery");
districtAlias("Mahe", "Mahé", "Mayyazhi");
// Maharashtra
districtAlias("Ahilyanagar", "Ahmednagar", "Ahmadnagar");
districtAlias("Chhatrapati Sambhajinagar", "Aurangabad", "Sambhajinagar");
districtAlias("Dharashiv", "Osmanabad");
districtAlias("Mumbai City", "Mumbai Town");
districtAlias("Mumbai Suburban", "Mumbai", "Bombay", "Mumbai Sub", "Mumbai Suburbs");
districtAlias("Raigad", "Raigarh");
districtAlias("Navi Mumbai", "Panvel", "Vashi", "Belapur", "Nerul");
districtAlias("Solapur", "Sholapur");
districtAlias("Buldhana", "Buldana");
districtAlias("Gondia", "Gondiya");

/** State -> default office when the district is missing or not on the list. */
const SPLIT_DEFAULT: Record<string, string> = {
  "Uttar Pradesh": "lucknow", // 43 of 75 districts
  Haryana: "chandigarh", // all of Haryana except 4 places
  Maharashtra: "pune", // 31 of 36 districts
  Puducherry: "chennai", // Puducherry town and Karaikal, the bulk of the UT
};

/**
 * Districts listed for an office, but where the CIO text is not clean enough
 * to be sure. These return certain: false.
 */
const UNCERTAIN_DISTRICTS: Record<string, string[]> = {
  Maharashtra: ["Mumbai Suburban"], // 5 wards (M/E, M/W, N, S, T) go to Thane
  "Uttar Pradesh": ["Kanpur Dehat"], // CIO lists just "Kanpur"
  Haryana: ["Bahadurgarh"], // a town in Jhajjar district, not a district
};

const OFFICE_BY_ID = new Map(OFFICES.map((o) => [o.id, o]));

function canonicalState(input: string): string | undefined {
  return STATE_ALIASES[key(input)];
}

function canonicalDistrict(input: string): string {
  return DISTRICT_ALIASES[key(input)] ?? input;
}

/**
 * Find the Ombudsman office for a state/UT and optional district.
 *
 * - certain: true  -> the CIO list puts this state (or this exact district)
 *   under one office.
 * - certain: false -> split state with no district, a district not on the
 *   list, a district the CIO text only half-covers, or a city name given in
 *   place of a state. The office returned is the most likely one.
 * - null           -> input is not a known state, UT or office city.
 */
export function findOffice(
  state: string,
  district?: string,
): { office: OmbudsmanOffice; certain: boolean } | null {
  if (!state || !state.trim()) return null;
  const canonical = canonicalState(state);

  if (!canonical) {
    const id = CITY_ALIASES[key(state)];
    const office = id ? OFFICE_BY_ID.get(id) : undefined;
    return office ? { office, certain: false } : null;
  }

  const whole = OFFICES.find((o) => o.states.includes(canonical));
  if (whole) return { office: whole, certain: true };

  // Split state.
  const fallbackId = SPLIT_DEFAULT[canonical];
  const fallback = fallbackId ? OFFICE_BY_ID.get(fallbackId) : undefined;
  if (!fallback) return null;

  if (district && district.trim()) {
    const d = canonicalDistrict(district.trim());
    const dKey = key(d);
    for (const o of OFFICES) {
      const list = o.districts?.[canonical];
      if (list?.some((x) => key(x) === dKey)) {
        const shaky = UNCERTAIN_DISTRICTS[canonical]?.some((x) => key(x) === dKey);
        return { office: o, certain: !shaky };
      }
    }
  }
  return { office: fallback, certain: false };
}
