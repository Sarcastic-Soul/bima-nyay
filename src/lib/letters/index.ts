/**
 * Grievance letter (to the insurer) and Ombudsman complaint, in English and
 * Hindi. Filled from templates, not written by AI, so every legal claim in
 * the letter traces to a rule in sources/rules.json.
 */
import type { LetterFields } from "../letter";
import type { Finding } from "../rules/check";
import { rule } from "../rules/sources";

export type Lang = "en" | "hi";

export type Complainant = {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
};

export type LetterInput = {
  fields: LetterFields;
  findings: Finding[];
  complainant: Complainant;
  today: string;
  grievanceSentDate?: string;
  grievanceReplyDate?: string;
  ombudsmanOffice?: { city: string; address: string };
};

/** Hindi wording for each ground we can raise. */
const GROUND_HI: Record<string, string> = {
  moratorium_passed:
    "मेरा स्वास्थ्य बीमा 60 महीने से अधिक समय से लगातार चालू है। IRDAI के नियम के अनुसार 60 महीने (मोरेटोरियम अवधि) पूरे होने के बाद, सिद्ध धोखाधड़ी के अलावा, जानकारी न देने या गलत जानकारी के आधार पर दावा अस्वीकार नहीं किया जा सकता। पत्र में धोखाधड़ी का कोई आरोप नहीं है।",
  moratorium_fraud:
    "60 महीने की मोरेटोरियम अवधि पूरी हो चुकी है, इसलिए केवल सिद्ध धोखाधड़ी के आधार पर ही दावा अस्वीकार हो सकता है। कृपया धोखाधड़ी का प्रमाण दें।",
  moratorium_unknown:
    "कृपया जाँचें कि मेरा बीमा लगातार कितने महीनों से चालू है (पोर्टेबिलिटी सहित)। 60 महीने के बाद जानकारी न देने के आधार पर दावा अस्वीकार नहीं हो सकता।",
  waiting_over_36:
    "1 अप्रैल 2024 से कोई भी प्रतीक्षा अवधि 36 महीने से अधिक नहीं हो सकती। पत्र में इससे लंबी प्रतीक्षा अवधि लगाई गई है।",
  waiting_served: "मेरा बीमा 36 महीने से अधिक समय से लगातार चालू है, और कोई भी प्रतीक्षा अवधि 36 महीने से अधिक नहीं हो सकती।",
  waiting_unknown: "प्रतीक्षा अवधि अधिकतम 36 महीने की लगातार बीमा अवधि तक ही हो सकती है। कृपया मेरी बीमा अवधि दोबारा जाँचें।",
  waiting_accident: "इलाज दुर्घटना के कारण हुआ था। बीमारी-विशेष की प्रतीक्षा अवधि दुर्घटना पर लागू नहीं होती।",
  no_reject_for_documents:
    "IRDAI के नियम के अनुसार किसी भी दावे को दस्तावेज़ों की कमी या देर से सूचना देने के कारण अस्वीकार या बंद नहीं किया जा सकता। अस्पताल से दस्तावेज़ लेना बीमा कंपनी/TPA की ज़िम्मेदारी है और सभी दस्तावेज़ एक बार में माँगे जाने चाहिए।",
  no_clause_cited: "अस्वीकृति पत्र में पॉलिसी की किसी विशेष शर्त/क्लॉज़ का उल्लेख नहीं है, जबकि नियम के अनुसार कारण पूरे विवरण और पॉलिसी शर्त के संदर्भ के साथ बताना ज़रूरी है।",
};

function cite(ruleIds: string[]): string {
  return ruleIds
    .slice(0, 2)
    .map((id) => {
      const r = rule(id);
      return `${r.location}`;
    })
    .join("; ");
}

const blank = (v: string | null | undefined, lang: Lang) => v ?? (lang === "hi" ? "[भरें]" : "[fill in]");

function fmtDate(d: string | null | undefined, lang: Lang) {
  if (!d) return blank(null, lang);
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

/** What is still unpaid: the claim minus anything the insurer already approved. */
function owedAmount(f: LetterInput["fields"]): number | null {
  if (f.claimAmount == null) return null;
  const left = f.claimAmount - (f.approvedAmount ?? 0);
  return left > 0 ? left : f.claimAmount;
}

function rupees(n: number | null) {
  return n == null ? null : `Rs ${n.toLocaleString("en-IN")}`;
}

function grounds(input: LetterInput, lang: Lang): string[] {
  return input.findings
    .filter((f) => f.verdict === "rule_broken" && f.ruleIds.length > 0)
    .map((f) => {
      const text = lang === "hi" ? (GROUND_HI[f.id] ?? f.why) : f.why;
      return `${text} (${lang === "hi" ? "संदर्भ" : "Ref"}: ${cite(f.ruleIds)})`;
    });
}

function header(input: LetterInput, lang: Lang) {
  const c = input.complainant;
  return [
    blank(c.name, lang),
    blank(c.address, lang),
    `${lang === "hi" ? "फ़ोन" : "Phone"}: ${blank(c.phone, lang)}   ${lang === "hi" ? "ईमेल" : "Email"}: ${blank(c.email, lang)}`,
    "",
    `${lang === "hi" ? "दिनांक" : "Date"}: ${fmtDate(input.today, lang)}`,
  ].join("\n");
}

export function grievanceLetter(input: LetterInput, lang: Lang): string {
  const f = input.fields;
  const g = grounds(input, lang);
  const amount = rupees(f.claimAmount);
  const owed = rupees(owedAmount(f));
  if (lang === "hi") {
    return `${header(input, lang)}

सेवा में,
शिकायत निवारण अधिकारी (Grievance Redressal Officer)
${blank(f.insurer, lang)}

विषय: दावा संख्या ${blank(f.claimNumber, lang)}, पॉलिसी संख्या ${blank(f.policyNumber, lang)} की अस्वीकृति के विरुद्ध शिकायत

महोदय/महोदया,

मैं आपके दिनांक ${fmtDate(f.letterDate, lang)} के पत्र के विरुद्ध यह शिकायत दर्ज कर रहा/रही हूँ, जिसमें ${blank(f.patientName, lang)} के इलाज${f.diagnosis ? ` (${f.diagnosis})` : ""} का दावा${amount ? ` (${amount})` : ""} इस कारण से अस्वीकार किया गया: "${f.reasonText}"।

मेरी आपत्तियाँ:
${g.length ? g.map((x, i) => `${i + 1}. ${x}`).join("\n") : "1. अस्वीकृति का कारण पॉलिसी शर्तों के अनुसार उचित नहीं है।"}

मेरा अनुरोध:
1. दावे पर दोबारा विचार कर ${owed ? `बाकी राशि ${owed}` : "बाकी राशि"} का भुगतान करें, साथ में देरी का ब्याज (बैंक दर + 2%)।
2. पुष्टि करें कि यह अस्वीकृति आपकी Claims Review Committee द्वारा स्वीकृत थी, और जिस रिकॉर्ड/क्लॉज़ पर आप निर्भर हैं उसकी प्रति दें।
3. IRDAI नियम के अनुसार 14 दिनों के भीतर लिखित उत्तर दें।

यदि उत्तर संतोषजनक नहीं मिलता, तो मैं बीमा लोकपाल (Insurance Ombudsman) के पास शिकायत दर्ज करूँगा/करूँगी।

संलग्न: अस्वीकृति पत्र, पॉलिसी की प्रति, अस्पताल के बिल और डिस्चार्ज सारांश।

भवदीय,
${blank(input.complainant.name, lang)}`;
  }
  return `${header(input, lang)}

To,
The Grievance Redressal Officer
${blank(f.insurer, lang)}

Subject: Grievance against rejection of claim no. ${blank(f.claimNumber, lang)} under policy no. ${blank(f.policyNumber, lang)}

Dear Sir/Madam,

I am writing against your letter dated ${fmtDate(f.letterDate, lang)}, which rejected the claim${amount ? ` of ${amount}` : ""} for the treatment of ${blank(f.patientName, lang)}${f.diagnosis ? ` (${f.diagnosis})` : ""} on the ground: "${f.reasonText}".

My objections:
${g.length ? g.map((x, i) => `${i + 1}. ${x}`).join("\n") : "1. The ground given is not justified under the policy terms."}

I request you to:
1. Review the claim and pay ${owed ? `the unpaid amount of ${owed}` : "the unpaid amount"}, with interest for delay at bank rate plus 2%.
2. Confirm that this rejection was approved by your Claims Review Committee, and share the record and the policy clause you rely on.
3. Reply in writing within 14 days, as required by IRDAI.

If I do not get a satisfactory reply, I will approach the Insurance Ombudsman.

Enclosed: rejection letter, policy copy, hospital bills and discharge summary.

Yours faithfully,
${blank(input.complainant.name, lang)}`;
}

export function ombudsmanComplaint(input: LetterInput, lang: Lang): string {
  const f = input.fields;
  const g = grounds(input, lang);
  const office = input.ombudsmanOffice;
  const amount = rupees(f.claimAmount);
  const owed = rupees(owedAmount(f));
  const replyLine =
    lang === "hi"
      ? input.grievanceReplyDate
        ? `बीमा कंपनी ने दिनांक ${fmtDate(input.grievanceReplyDate, lang)} को उत्तर दिया, जो संतोषजनक नहीं है।`
        : input.grievanceSentDate
          ? "बीमा कंपनी ने एक महीने के भीतर कोई उत्तर नहीं दिया।"
          : "[बीमा कंपनी का उत्तर या उत्तर न मिलने की जानकारी भरें]"
      : input.grievanceReplyDate
        ? `The insurer replied on ${fmtDate(input.grievanceReplyDate, lang)}, which is not satisfactory.`
        : input.grievanceSentDate
          ? "The insurer did not reply within one month."
          : "[Say what the insurer replied, or that it did not reply within one month]";
  if (lang === "hi") {
    return `${header(input, lang)}

सेवा में,
बीमा लोकपाल (Insurance Ombudsman)
${office ? `${office.city}\n${office.address}` : "[अपने क्षेत्र का लोकपाल कार्यालय]"}

विषय: बीमा लोकपाल नियम 2017 के नियम 14 के अंतर्गत स्वास्थ्य बीमा दावे की अस्वीकृति के विरुद्ध शिकायत

1. शिकायतकर्ता: ${blank(input.complainant.name, lang)}
2. बीमा कंपनी: ${blank(f.insurer, lang)}
3. पॉलिसी संख्या: ${blank(f.policyNumber, lang)}    दावा संख्या: ${blank(f.claimNumber, lang)}
4. मरीज़: ${blank(f.patientName, lang)}    भर्ती की तारीख: ${fmtDate(f.admissionDate, lang)}
5. दावे की राशि: ${blank(amount, lang)}    अस्वीकृति पत्र की तारीख: ${fmtDate(f.letterDate, lang)}

तथ्य:
बीमा कंपनी ने यह कहकर दावा अस्वीकार किया: "${f.reasonText}"। मैंने दिनांक ${fmtDate(input.grievanceSentDate, lang)} को बीमा कंपनी को लिखित शिकायत दी। ${replyLine}

शिकायत के आधार:
${g.length ? g.map((x, i) => `${i + 1}. ${x}`).join("\n") : "1. अस्वीकृति पॉलिसी शर्तों के अनुसार उचित नहीं है।"}

माँगी गई राहत:
दावे की बकाया राशि ${blank(owed, lang)} का भुगतान, देरी के ब्याज सहित।

घोषणा:
इस मामले पर किसी न्यायालय, उपभोक्ता आयोग या मध्यस्थता में कोई कार्यवाही लंबित नहीं है। ऊपर दी गई जानकारी मेरी जानकारी के अनुसार सही है।

संलग्न: अस्वीकृति पत्र, बीमा कंपनी को दी गई शिकायत और उसका उत्तर (यदि मिला), पॉलिसी, बिल, डिस्चार्ज सारांश।

हस्ताक्षर: ____________
${blank(input.complainant.name, lang)}`;
  }
  return `${header(input, lang)}

To,
The Insurance Ombudsman
${office ? `${office.city}\n${office.address}` : "[Ombudsman office for your area]"}

Subject: Complaint under Rule 14 of the Insurance Ombudsman Rules, 2017 against rejection of a health insurance claim

1. Complainant: ${blank(input.complainant.name, lang)}
2. Insurer: ${blank(f.insurer, lang)}
3. Policy no.: ${blank(f.policyNumber, lang)}    Claim no.: ${blank(f.claimNumber, lang)}
4. Patient: ${blank(f.patientName, lang)}    Date of admission: ${fmtDate(f.admissionDate, lang)}
5. Amount claimed: ${blank(amount, lang)}    Date of rejection letter: ${fmtDate(f.letterDate, lang)}

Facts:
The insurer rejected the claim on the ground: "${f.reasonText}". I made a written representation to the insurer on ${fmtDate(input.grievanceSentDate, lang)}. ${replyLine}

Grounds of complaint:
${g.length ? g.map((x, i) => `${i + 1}. ${x}`).join("\n") : "1. The rejection is not justified under the policy terms."}

Relief sought:
Payment of the unpaid claim amount of ${blank(owed, lang)}, with interest for delay.

Declaration:
No proceedings on this matter are pending before any court, consumer commission or arbitrator. The information above is true to the best of my knowledge.

Enclosed: rejection letter, my representation to the insurer and its reply (if any), policy, bills, discharge summary.

Signature: ____________
${blank(input.complainant.name, lang)}`;
}
