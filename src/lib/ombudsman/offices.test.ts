import { describe, expect, it } from "vitest";
import {
  COMPLAINT_CHANNELS,
  OFFICES,
  STATES,
  THANE_MUMBAI_WARDS,
  findOffice,
} from "./offices";

const id = (state: string, district?: string) =>
  findOffice(state, district)?.office.id;

describe("office table", () => {
  it("has 18 offices with unique ids and complete contact data", () => {
    expect(OFFICES).toHaveLength(18);
    expect(new Set(OFFICES.map((o) => o.id)).size).toBe(18);
    for (const o of OFFICES) {
      expect(o.city).toBeTruthy();
      expect(o.phone.length).toBeGreaterThan(0);
      expect(o.email.length).toBeGreaterThan(0);
      for (const e of o.email) expect(e).toMatch(/@cioins\.co\.in$/);
      expect(o.sourceUrl).toMatch(/^https:\/\/www\.cioins\.co\.in\//);
    }
  });

  it("lists 36 states and UTs", () => {
    expect(STATES).toHaveLength(36);
    expect(new Set(STATES).size).toBe(36);
  });

  it("maps every state/UT to exactly one office, or to a split", () => {
    for (const s of STATES) {
      const whole = OFFICES.filter((o) => o.states.includes(s));
      const split = OFFICES.filter((o) => o.districts && s in o.districts);
      if (whole.length === 1) {
        expect(split, `${s} is both whole and split`).toHaveLength(0);
      } else {
        expect(whole, `${s} owned by two offices`).toHaveLength(0);
        expect(split.length, `${s} has no owner`).toBeGreaterThanOrEqual(2);
      }
      expect(findOffice(s), s).not.toBeNull();
    }
  });

  it("uses only known states in offices", () => {
    for (const o of OFFICES) {
      for (const s of [...o.states, ...Object.keys(o.districts ?? {})]) {
        expect(STATES).toContain(s);
      }
    }
  });

  it("has no district listed under two offices in the same state", () => {
    const seen = new Map<string, string>();
    for (const o of OFFICES) {
      for (const [st, list] of Object.entries(o.districts ?? {})) {
        for (const d of list) {
          const k = `${st}|${d.toLowerCase()}`;
          expect(seen.get(k), `${k} duplicated`).toBeUndefined();
          seen.set(k, o.id);
        }
      }
    }
  });

  it("covers all 75 Uttar Pradesh districts except Bhadohi", () => {
    const up = OFFICES.flatMap((o) => o.districts?.["Uttar Pradesh"] ?? []);
    expect(up).toHaveLength(74);
    expect(up).not.toContain("Bhadohi");
  });

  it("splits Maharashtra's 36 districts across Pune, Mumbai and Thane", () => {
    const m = OFFICES.flatMap((o) => o.districts?.Maharashtra ?? []);
    // 31 Pune + 2 Mumbai + Thane, Palghar, Raigad (+ Navi Mumbai, not a district)
    expect(m).toHaveLength(31 + 2 + 4);
  });
});

describe("whole-state spot checks", () => {
  const cases: [string, string][] = [
    ["Gujarat", "ahmedabad"],
    ["Dadra and Nagar Haveli and Daman and Diu", "ahmedabad"],
    ["Karnataka", "bengaluru"],
    ["Madhya Pradesh", "bhopal"],
    ["Chhattisgarh", "bhopal"],
    ["Odisha", "bhubaneswar"],
    ["Punjab", "chandigarh"],
    ["Himachal Pradesh", "chandigarh"],
    ["Jammu and Kashmir", "chandigarh"],
    ["Ladakh", "chandigarh"],
    ["Chandigarh", "chandigarh"],
    ["Tamil Nadu", "chennai"],
    ["Delhi", "delhi"],
    ["Assam", "guwahati"],
    ["Tripura", "guwahati"],
    ["Arunachal Pradesh", "guwahati"],
    ["Telangana", "hyderabad"],
    ["Andhra Pradesh", "hyderabad"],
    ["Rajasthan", "jaipur"],
    ["Kerala", "kochi"],
    ["Lakshadweep", "kochi"],
    ["West Bengal", "kolkata"],
    ["Sikkim", "kolkata"],
    ["Andaman and Nicobar Islands", "kolkata"],
    ["Uttarakhand", "noida"],
    ["Bihar", "patna"],
    ["Jharkhand", "patna"],
    ["Goa", "pune"],
  ];
  it.each(cases)("%s -> %s", (state, expected) => {
    expect(findOffice(state)).toEqual({
      office: expect.objectContaining({ id: expected }),
      certain: true,
    });
  });

  it("ignores the district for a non-split state", () => {
    expect(findOffice("Karnataka", "Mysuru")?.certain).toBe(true);
    expect(id("Karnataka", "Mysuru")).toBe("bengaluru");
  });
});

describe("split states", () => {
  it("Uttar Pradesh: Lucknow vs Noida by district", () => {
    expect(findOffice("Uttar Pradesh", "Lucknow")).toMatchObject({ certain: true });
    expect(id("Uttar Pradesh", "Lucknow")).toBe("lucknow");
    expect(id("Uttar Pradesh", "Varanasi")).toBe("lucknow");
    expect(id("Uttar Pradesh", "Gorakhpur")).toBe("lucknow");
    expect(id("Uttar Pradesh", "Agra")).toBe("noida");
    expect(id("Uttar Pradesh", "Ghaziabad")).toBe("noida");
    expect(id("Uttar Pradesh", "Meerut")).toBe("noida");
    expect(findOffice("Uttar Pradesh", "Agra")?.certain).toBe(true);
  });

  it("Uttar Pradesh: old and misspelt district names still match", () => {
    expect(id("Uttar Pradesh", "Allahabad")).toBe("lucknow");
    expect(id("Uttar Pradesh", "Faizabad")).toBe("lucknow");
    expect(id("Uttar Pradesh", "Gorkhpur")).toBe("lucknow");
    expect(id("Uttar Pradesh", "Bulandshehar")).toBe("noida");
    expect(id("Uttar Pradesh", "Noida")).toBe("noida");
    expect(id("Uttar Pradesh", "Gautam Buddh Nagar")).toBe("noida");
    expect(id("Uttar Pradesh", "Kasganj")).toBe("noida");
  });

  it("Uttar Pradesh: no or unknown district gives Lucknow, not certain", () => {
    expect(findOffice("Uttar Pradesh")).toMatchObject({ certain: false });
    expect(id("Uttar Pradesh")).toBe("lucknow");
    expect(findOffice("Uttar Pradesh", "Bhadohi")).toMatchObject({ certain: false });
    expect(findOffice("Uttar Pradesh", "Nowhere")).toMatchObject({ certain: false });
    expect(id("Uttar Pradesh", "  ")).toBe("lucknow");
  });

  it("Maharashtra: Pune, Mumbai and Thane", () => {
    expect(id("Maharashtra", "Nagpur")).toBe("pune");
    expect(id("Maharashtra", "Pune")).toBe("pune");
    expect(id("Maharashtra", "Aurangabad")).toBe("pune");
    expect(findOffice("Maharashtra", "Nashik")?.certain).toBe(true);
    expect(id("Maharashtra", "Mumbai City")).toBe("mumbai");
    expect(findOffice("Maharashtra", "Mumbai City")?.certain).toBe(true);
    expect(id("Maharashtra", "Thane")).toBe("thane");
    expect(id("Maharashtra", "Palghar")).toBe("thane");
    expect(id("Maharashtra", "Raigad")).toBe("thane");
    expect(id("Maharashtra", "Navi Mumbai")).toBe("thane");
    expect(findOffice("Maharashtra", "Thane")?.certain).toBe(true);
  });

  it("Maharashtra: Mumbai Suburban is Mumbai but not certain (5 wards go to Thane)", () => {
    expect(findOffice("Maharashtra", "Mumbai Suburban")).toMatchObject({
      office: { id: "mumbai" },
      certain: false,
    });
    expect(findOffice("Maharashtra", "Mumbai")).toMatchObject({
      office: { id: "mumbai" },
      certain: false,
    });
    expect([...THANE_MUMBAI_WARDS]).toEqual(["M/East", "M/West", "N", "S", "T"]);
  });

  it("Maharashtra: no district gives Pune, not certain", () => {
    expect(findOffice("Maharashtra")).toMatchObject({
      office: { id: "pune" },
      certain: false,
    });
    expect(findOffice("Maharashtra", "Atlantis")).toMatchObject({
      office: { id: "pune" },
      certain: false,
    });
  });

  it("Haryana: Delhi takes four places, Chandigarh the rest", () => {
    expect(id("Haryana", "Gurugram")).toBe("delhi");
    expect(id("Haryana", "Gurgaon")).toBe("delhi");
    expect(id("Haryana", "Faridabad")).toBe("delhi");
    expect(id("Haryana", "Sonipat")).toBe("delhi");
    expect(findOffice("Haryana", "Gurugram")?.certain).toBe(true);
    expect(findOffice("Haryana", "Bahadurgarh")).toMatchObject({
      office: { id: "delhi" },
      certain: false,
    });
    expect(id("Haryana")).toBe("chandigarh");
    expect(findOffice("Haryana")?.certain).toBe(false);
    expect(findOffice("Haryana", "Ambala")).toMatchObject({
      office: { id: "chandigarh" },
      certain: false,
    });
    // Jhajjar holds Bahadurgarh town, so it must not be reported as certain.
    expect(findOffice("Haryana", "Jhajjar")?.certain).toBe(false);
  });

  it("Puducherry: Chennai, Hyderabad (Yanam) and Kochi (Mahe)", () => {
    expect(id("Puducherry", "Karaikal")).toBe("chennai");
    expect(id("Puducherry", "Puducherry")).toBe("chennai");
    expect(id("Puducherry", "Yanam")).toBe("hyderabad");
    expect(id("Puducherry", "Mahe")).toBe("kochi");
    expect(id("Puducherry", "Mahé")).toBe("kochi");
    expect(findOffice("Puducherry", "Yanam")?.certain).toBe(true);
    expect(findOffice("Puducherry")).toMatchObject({
      office: { id: "chennai" },
      certain: false,
    });
  });
});

describe("spelling variants", () => {
  it("accepts state variants", () => {
    expect(id("Orissa")).toBe("bhubaneswar");
    expect(id("odisha")).toBe("bhubaneswar");
    expect(id("  TAMIL NADU ")).toBe("chennai");
    expect(id("tamilnadu")).toBe("chennai");
    expect(id("Pondicherry", "Karaikal")).toBe("chennai");
    expect(id("Uttaranchal")).toBe("noida");
    expect(id("Jammu & Kashmir")).toBe("chandigarh");
    expect(id("jammu and kashmir")).toBe("chandigarh");
    expect(id("Chattisgarh")).toBe("bhopal");
    expect(id("NCT of Delhi")).toBe("delhi");
    expect(id("Andaman & Nicobar Islands")).toBe("kolkata");
    expect(id("Daman and Diu")).toBe("ahmedabad");
    expect(id("Dadra & Nagar Haveli")).toBe("ahmedabad");
    expect(id("UP", "Agra")).toBe("noida");
  });

  it("accepts city names as a fallback, never certain", () => {
    expect(findOffice("Bangalore")).toMatchObject({
      office: { id: "bengaluru" },
      certain: false,
    });
    expect(id("Cochin")).toBe("kochi");
    expect(id("Calcutta")).toBe("kolkata");
    expect(id("Madras")).toBe("chennai");
    expect(id("Bombay")).toBe("mumbai");
    expect(id("Navi Mumbai")).toBe("thane");
  });

  it("returns null for unknown or empty input", () => {
    expect(findOffice("Atlantis")).toBeNull();
    expect(findOffice("")).toBeNull();
    expect(findOffice("   ")).toBeNull();
  });
});

describe("complaint channels", () => {
  it("points to the CIO online form and Bima Bharosa", () => {
    expect(COMPLAINT_CHANNELS.ombudsmanOnline).toBe("https://cioins.co.in/Complaint/Online");
    expect(COMPLAINT_CHANNELS.bimaBharosa).toBe("https://bimabharosa.irdai.gov.in");
  });
});
