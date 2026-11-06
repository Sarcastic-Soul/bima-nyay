# Insurance Ombudsman offices and jurisdiction

Used by `src/lib/ombudsman/offices.ts`. Fetched on 2026-11-07.

## Sources

- Council for Insurance Ombudsmen (CIO), "Contact details of Ombudsman Centres": https://www.cioins.co.in/Ombudsman (address, phone, email and "Jurisdiction" line for each office). This is the main source.
- CIO Mumbai/Thane notices linked from that page (ward lists, 7 and 2 pages):
  - https://www.cioins.co.in/notification/Mumbai%20jurisdiction-%20Annexure%20B.pdf
  - https://www.cioins.co.in/notification/Thane%20jurisdiction%20-Annexure%20A.pdf
- CIO online complaint form: https://cioins.co.in/Complaint/Online (loaded fine, HTTP 200). Tracking: https://cioins.co.in/Complaint/Track.
- Bima Bharosa (IRDAI grievance portal): https://bimabharosa.irdai.gov.in (loaded fine, HTTP 200).
- Insurance Ombudsman Rules 2017 as amended 2023 (saved as `insurance-ombudsman-rules-2017-amended-2023.txt`): rule 11 says the Council for Insurance Ombudsmen sets each office's area "from time to time". There is no schedule or list in the Rules, so the CIO page is the official list.

## What was found

- There are 18 offices, not 17. The CIO list now has Thane as well: Ahmedabad, Bengaluru, Bhopal, Bhubaneswar, Chandigarh, Chennai, Delhi, Guwahati, Hyderabad, Jaipur, Kochi, Kolkata, Lucknow, Mumbai, Noida, Patna, Pune, Thane.
- Whole states per office are as printed. Splits:
  - Uttar Pradesh: Lucknow (43 names) and Noida (32 names). Noida also takes all of Uttarakhand.
  - Maharashtra: Pune (the 31 districts left over), Mumbai (Mumbai City and most of Mumbai Suburban), Thane (Thane, Palghar, Raigad, Navi Mumbai, and Mumbai wards M/East, M/West, N, S, T). Pune also takes Goa.
  - Haryana: Delhi takes Gurugram, Faridabad, Sonepat and Bahadurgarh. Chandigarh takes the rest.
  - Puducherry: Chennai (Puducherry town and Karaikal), Hyderabad (Yanam), Kochi (Mahe).
- Who can file where: Rule 14(1) and the CIO form both say you file with the Ombudsman covering either the insurer's branch/office or your own home address.
- Phone numbers: the CIO prints short forms like "022 - 69038800/27/29/31/32/33" and "079 - 25501201/02". They were written out in full by swapping the last digits. This is a reading of the format, not something the CIO spells out.
- Kochi's email is `oio.ernakulam@cioins.co.in` as printed, even though the city is shown as Kochi.

## Uncertain or messy

1. Mumbai Suburban: five wards (M/East, M/West, N, S, T) go to Thane, the rest to Mumbai. The code only knows districts, so Mumbai Suburban returns Mumbai with `certain: false`. The Annexure PDFs give the ward list and pin codes if we later ask for a ward or pin code. The exported `THANE_MUMBAI_WARDS` holds the five wards.
2. The Mumbai notice reads "wards under Mumbai Metropolitan Region excluding ... Thane ... and Navi Mumbai". Read together with the Pune and Thane lines, that gives the split above, but the wording is loose.
3. The CIO uses old and misspelt district names. The code stores modern names and accepts the old ones as aliases: Allahabad = Prayagraj, Faizabad = Ayodhya, Gazipur = Ghazipur, Gorkhpur = Gorakhpur, Sonbhabdra = Sonbhadra, Maharajgang = Maharajganj, Sidharathnagar = Siddharthnagar, Sravasti = Shravasti, Oraiyya = Auraiya, Firozbad = Firozabad, Bulandshehar = Bulandshahr, Bagpat = Baghpat, Kashganj = Kasganj.
4. Lucknow's list names Ghazipur twice (as "Gazipur" and "Ghazipur"). Noida's list has both "Kashganj" and "Kanshiramnagar", which are the same district (Kasganj). Each appears once in the code.
5. The CIO says "Kanpur". Kanpur Nagar and Kanpur Dehat are both put under Lucknow. Kanpur Dehat returns `certain: false`.
6. Bhadohi is the only one of the 75 current Uttar Pradesh districts not named by either list. The code treats it as unlisted (Lucknow, `certain: false`). It is next to Varanasi and Mirzapur, which are Lucknow's.
7. "Bahadurgarh" is a town in Jhajjar district, not a district. It is in Delhi's list as printed but returns `certain: false`. Jhajjar, Palwal and Nuh (carved from listed or neighbouring districts) are not named, so they fall back to Chandigarh with `certain: false`.
8. Dadra and Nagar Haveli and Daman and Diu merged into one UT in 2020. The CIO still prints "Dadra & Nagar Haveli, Daman and Diu" under Ahmedabad. STATES uses the merged name, and the old names are accepted.
9. Maharashtra district names: the code uses the 2025 names (Ahilyanagar, Chhatrapati Sambhajinagar, Dharashiv) and accepts Ahmednagar, Aurangabad and Osmanabad.
10. When the state is not a state, the code also accepts an office city or old city name (Bangalore, Bombay, Madras, Calcutta, Cochin) and returns that office with `certain: false`.
11. The CIO page has a stray hidden Ahmedabad block listing "Shri Kuldip Singh" with extra phone numbers (25501205/06). It looks like a leftover duplicate. Not used.
12. Office-holder names change often. They are not stored. Check the CIO page again before launch for any address, phone or jurisdiction change (the Thane office is recent and more changes could follow).
13. Complaint form: the page says to complain to the insurer first and wait one month (or be unhappy with the reply) before going to the Ombudsman.
