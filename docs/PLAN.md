# Bima Nyay: build plan

Code for a Billion hackathon. Target: **1st place, Financial Inclusion** (form dropdown). Deadline: **15 Nov 2026** (deployed, open source, issue filed). Written 6 Nov 2026.

## 1. The field we have to beat (Financial Inclusion, 4 entries)

| # | Entry | What it is | Proof of impact | Strength |
|---|---|---|---|---|
| 61 | **Bhugtan Sahayak** (Design Master Solutions) | Tap-through wizard for people whose government DBT payment (PM-KISAN, pension, MGNREGA, scholarship) never arrived. Pure rules engine (`rules.js`), 10 causes, each tied to an official source (NPCI SOP, PIB, RBI circular). Hindi/English, read aloud, WhatsApp share, request letter, "Did it work?" box, public anonymous counter. 27 tests plus mutation testing. 76 KB, no login, no personal data. Cloudflare Workers. | Replayed 12 real High Court / Information Commission decisions through its rules in a test: cause found in 10 of 12. Covers the official PIB failure reasons. Writes down its own gaps. No field users. | **The one to beat.** Very careful and honest, every claim sourced and tested. Weak spots: no AI in the product at all (it is a decision tree), only 12 cases, no real agent. |
| 43 | Scam Shield | Paste or upload a job offer, get a 0-100 scam score: rule engine + ML model trained on EMSCAD (17,880 postings) + MCA/domain checks, Gemini optional, 8 languages. FastAPI on Render. | 83% of fake postings flagged, 0.3% false positives on held-out EMSCAD; 97.1% of 22,000 Naukri listings marked safe; 9/9 real Indian scam samples. No users. | Decent. Dataset is US job postings, so weak India fit. Really a "Tech jobs for youth" or fraud project. |
| 44 | Chai Pot for SHGs | Self-help-group savings and loan ledger. Treasurer speaks Hindi/Hinglish, Gemini turns it into an action, a rules engine checks the loan, 2-person approval, balance read aloud. Vercel. | None. Sample data only. | Nice product, no proof. |
| 29 | ScamKavach | Scam message checker (rules + AI explanation, Hindi/Marathi). | Unfilled template (`<N> users`). Video only. | Weak. |

**What judges will see in Bhugtan Sahayak and expect from us too:** every rule tied to an official source, tests that check the rules and quotes, no personal data stored, Hindi + read aloud, a request letter the person can take to the counter, a public counter, a real-case replay, and an honest list of what it misses.

**How we beat it:**
1. **Scale of proof:** replay about **3,500 real Ombudsman decisions + 300-600 recent consumer-commission decisions**, against their 12. Time-split, measured against a baseline, with the abstain behaviour shown.
2. **A real agent, not a decision tree:** photo of the letter in, Gemini reads it, then a visible multi-step tool loop (rule check, case search, deadline maths, drafting). Bhugtan has no AI in the product.
3. **Same rigour as them:** every rule cited to IRDAI / Ombudsman Rules text saved in `sources/`, tests that check quotes word for word, mutation check, no personal data stored, public counter, honest limits section.
4. **Bigger money per person:** a rejected hospital claim is often Rs 50,000 to Rs 5 lakh, and pushes families into debt.
5. **AgentFoundry used for real:** the replay runs as an AgentFoundry Evals suite and we commit its export (aims at the "Best Use of AgentFoundry Agents" award too).

## 2. The product

**Bima Nyay** ("insurance justice"). For a family whose health-insurance claim was rejected or cut.

One line: *Photo of your claim rejection letter in. Out comes: is this rejection allowed under today's IRDAI rules, how similar real cases ended, and a ready grievance letter and Ombudsman complaint with your deadlines.*

User: the patient or a family member, or a helper (hospital help-desk staff, CSC operator, NGO). Hindi or English. Works on a cheap Android phone browser.

### Main flow

1. **Upload** a photo or PDF of the rejection / partial-settlement letter (or paste its text). No login.
2. **Read:** Gemini vision pulls out insurer, policy type, policy start date, claim amount, amount paid, rejection date, and the stated reason(s) with the clause quoted. The user sees the fields and can correct them.
3. **Ask only what is missing:** e.g. "How many years has this policy run without a break?", "Was this disease known when you bought the policy?", "Did you already write to the insurer?".
4. **Check against the rules (deterministic code, cited):** e.g. after 60 months of continuous cover a claim cannot be refused for non-disclosure except proven fraud; the waiting period for pre-existing disease cannot be more than 36 months; claim-decision timelines; room-rent proportionate deduction rules; documents an insurer may not demand. Each check shows the rule text and its source.
5. **Similar real cases:** search the decision corpus by reason + facts. Show the 5 closest with citation, year, short facts and outcome, plus a count: "In 31 of 47 similar decided cases, the person got all or part of the claim." If the evidence is thin, the agent says so and shows the checklist instead (abstain).
6. **Next steps and deadlines (deterministic):** step 1 grievance to the insurer (and Bima Bharosa portal), when to escalate, last date to reach the Ombudsman, the money limit, which Ombudsman office covers your area.
7. **Documents:** grievance letter to the insurer, and the Ombudsman complaint (form fields filled), in Hindi and English. Copy, download PDF, share on WhatsApp, read aloud. Blank lines for anything we did not collect (name, policy number) so we never store it.
8. **"Did it work?"** yes / no / not yet, and a public anonymous counter at `/stats`.

### Feature list

**Must have (MVP)**
- Letter upload (photo, PDF, pasted text) and Gemini extraction to a fixed schema, with user correction.
- Reason taxonomy: pre-existing disease (PED), non-disclosure, waiting period, specific exclusion, not medically necessary / OPD-able, documents missing or late, room-rent proportionate deduction, non-payable items, cashless denied, policy lapsed, other.
- Rule engine in TypeScript with a citation on every rule, plus unit tests.
- Case search over the corpus (pgvector + filters), similar-case counts, abstain rule.
- Deadline and route calculator (insurer grievance, Bima Bharosa, Ombudsman office by state).
- Document drafts (insurer grievance + Ombudsman complaint), English and Hindi, PDF download.
- Visible agent steps on screen (which tool ran, what it found).
- `/evidence` page: replay results (accuracy, baseline, abstain rate, confusion matrix, per-reason table), with a link to the raw data and scripts.
- `/stats` public anonymous counter; "Did it work?".
- Privacy: images and text processed in memory, never stored; no name, phone, policy number or Aadhaar saved; no login.
- Mobile-first UI, Hindi/English toggle, read aloud (Web Speech, hi-IN).

**Stretch (cut in this order if late)**
1. Voice input.
2. More languages (Tamil, Marathi, Bengali).
3. Hospital help-desk mode (batch of letters).
4. xSpan CareHub integration (only if their API is reachable and fits; aims at the sponsor award).
5. WhatsApp bot.
6. Life and motor insurance (health only for now).

**Never**
- Promising an outcome or an amount ("you will win Rs X").
- Filing anything for the user. The person signs and sends.
- Calling it legal advice. Every page says "information, not legal advice".

## 3. Proof of impact (the part that wins)

**Corpus**
- **A. GIC Ombudsman "Mediclaim Book" PDFs** (cioins.co.in, Books 3-20): about 3,500 health award summaries, 2005-2014, text PDFs. Already downloaded to `data/raw/ombudsman-gic/` (some of the files fetched as bk2, bk21-30 are probably error pages; clean them up in the ingest step).
- **B. Consumer commission decisions** (NCDRC + State Commissions) on Indian Kanoon, 2015-2025, health-claim repudiation: target 300-600 labelled.

**Labelling:** split each book into awards, Gemini extracts `{insurer, policy_type, reason, facts, outcome (allowed / partly allowed / dismissed / withdrawn), amount_claimed, amount_awarded, year, forum}`. Hand-check 50 random rows per corpus; target 90%+ agreement, and report the number.

**Replay (time-split, no peeking):** for each test case, the agent sees only the facts and the stated rejection reason, and may only retrieve cases decided before it. Report:
- accuracy and macro-F1 of "person gets relief" vs majority baseline;
- accuracy on cases where the agent answered + the share it abstained on;
- rule-engine hits: how many winning cases the rule engine flagged as "rejection not allowed";
- rupees in held-out cases where the agent correctly said "worth complaining".

**Honesty:** list what it misses, the age of corpus A, rule changes since 2014 (2024 IRDAI master circular), and that no one in these cases used the app.

**Headline for the issue (fill in real numbers):** "~37,000 health-insurance complaints a year reach the Ombudsman, and most rejected families never get that far. We replayed N real Ombudsman and consumer-court decisions: when Bima Nyay answered, it matched the real outcome X% of the time vs Y% baseline."

## 4. Tech stack

| Layer | Choice | Why |
|---|---|---|
| App | **Next.js (App Router, TypeScript)**, full stack | One codebase for UI and API routes |
| Hosting | **Vercel** (CLI logged in as `sarcastic-soul`) | Free, fast deploy |
| DB | **Neon Postgres + pgvector** | Does not pause like free Supabase; vectors in the same DB |
| ORM / SQL | Drizzle ORM (or plain `@neondatabase/serverless`) | Light, works on Vercel functions |
| LLM | **Google Gemini API** (`@google/genai`): Flash model for vision extraction and the agent loop, Gemini embedding model for case search | User's choice; vision + function calling + Hindi |
| UI | Tailwind CSS, Phosphor icons | Per house rules; no blue/purple gradients |
| PDF | `@react-pdf/renderer` | Letters as downloadable PDF |
| Voice | Browser Web Speech API (read aloud) | Free, no key |
| Data scripts | Node/TS scripts in `scripts/` (pdftotext for parsing) | Offline ingest, labelling and replay |
| Tests | Vitest (unit + rule tests + quote checks), Playwright (one end-to-end flow) | Match Bhugtan's rigour |
| Repo | GitHub, public, MIT, account `Sarcastic-Soul` | Required |
| IDE | AgentFoundry.me (required) | Required; also run Evals there |

Exact Gemini model IDs get confirmed against AI Studio on day 1.

## 5. Architecture

```
 Phone browser (Next.js PWA, Hindi/English)
   |  photo / PDF / text
   v
 Vercel: Next.js route handlers
   /api/extract   -> Gemini vision -> LetterFields (JSON schema)      [nothing stored]
   /api/agent     -> Gemini function-calling loop, streams steps to UI
        tools:
          check_rules(fields)        -> lib/rules  (pure TS, cited, tested)
          find_similar(reason,facts) -> Neon pgvector + filters -> cases
          summarise_outcomes(cases)  -> counts, abstain if thin
          compute_deadlines(fields)  -> lib/deadlines (pure TS)
          route_ombudsman(state)     -> lib/ombudsman-offices (static table)
          draft_documents(all)       -> grievance + Ombudsman complaint (hi/en)
   /api/event     -> anonymous counter row (event, lang, reason_id, day)
   /stats, /evidence (static pages from Neon + committed results JSON)
   |
   v
 Neon Postgres
   cases(id, corpus, forum, year, insurer, policy_type, reason, facts,
         outcome, amount_claimed, amount_awarded, source_url, embedding vector)
   events(id, day, event, lang, reason_id)

 Offline (scripts/, run locally, results committed)
   ingest-gic.ts      PDFs -> award segments
   fetch-kanoon.ts    search + doc pages -> raw text (polite, cached)
   label.ts           Gemini batch extraction -> cases table + embeddings
   replay.ts          time-split replay -> results/replay.json -> /evidence
```

Rules for the agent: Gemini decides which tool to call and writes the explanations and letters; all maths (dates, deadlines, amounts, counts) and rule decisions are plain code; every rule result carries its source. If extraction confidence is low or similar cases are fewer than a set number, the agent abstains and shows the checklist.

### Folder layout

```
app/                 Next.js app (pages, api routes)
lib/rules/           rule engine + tests
lib/deadlines/       deadline maths + tests
lib/agent/           Gemini client, tool definitions, loop
lib/db/              Neon client, schema
scripts/             ingest, label, replay
sources/             text copies of IRDAI circulars, Ombudsman Rules, forms
data/raw/            downloaded PDFs (corpus A), Kanoon cache (corpus B)
results/             replay output (JSON + CSV)
evidence/            hand-check sheets, sample letters
```

## 6. Day plan (9 days)

| Day | Date | Work | Done when |
|---|---|---|---|
| 1 | 7 Nov | Repo, Next.js scaffold, Neon + pgvector, Vercel deploy of a hello page. Ingest corpus A into award segments. Save primary rule sources to `sources/`. | Live URL; segment count ~3,500 |
| 2 | 8 Nov | Gemini labelling of corpus A + embeddings into Neon. Hand-check 50. Start corpus B fetch. | `cases` rows >= 2,500; agreement number recorded |
| 3 | 9 Nov | Rule engine + deadline maths with citations and tests. Corpus B labelled. | Tests pass; >= 300 corpus B rows |
| 4 | 10 Nov | Letter extraction + agent loop with tools. | 5 sample letters run end to end |
| 5 | 11 Nov | Replay harness + `/evidence` page. Run as AgentFoundry Evals. | `results/replay.json` committed with real numbers |
| 6 | 12 Nov | UI polish: mobile, Hindi, read aloud, PDF letters, `/stats`, "Did it work?". | Playwright flow passes on mobile size |
| 7 | 13 Nov | README, honest limits, sources, mutation check, Hindi review. Share with a few real people. | README complete |
| 8 | 14 Nov | Demo video (2-3 min), submission issue text. | Video uploaded |
| 9 | 15 Nov | File the issue early, fix last bugs, update counter numbers. | Issue filed |

## 7. What I need from you

**Credentials (put in `.env.local`, never committed):**
1. **Gemini API key**: Google AI Studio, aistudio.google.com, "Get API key". Tell me if you have a paid tier; labelling ~4,000 cases will use a few million tokens (cheap on Flash, but free-tier rate limits slow it down).
2. **Neon Postgres connection string** (`DATABASE_URL`, pooled). Either create a project at neon.tech and send the string, or say "use Vercel" and I add Neon through the Vercel Marketplace with the CLI, which sets the env var on the project for us.

**Already have:** GitHub CLI (`Sarcastic-Soul`) and Vercel CLI (`sarcastic-soul`). I can create the repo and deploy.

**Decisions / info:**
3. **Repo name and owner:** `Sarcastic-Soul/bima-nyay`, public, MIT? (Projects get released to the Code for India org later.)
4. **Team members** (names + GitHub handles) and **contact email** for the submission form.
5. **AgentFoundry:** sign up at agentfoundry.me, create the project, and open this folder in it. The rules require it. Tell me how you will use it (its terminal, its SMART-Code agent) so the submission text is truthful.
6. **Indian Kanoon:** fine to fetch a few hundred public judgment pages politely (cached, slow)? Or get their API key (paid, has free credits) if you want to be safe on their terms.
7. **Real rejection letters (big win if possible):** 3-10 real health-claim rejection letters from family, friends or colleagues, with names and policy numbers blacked out. They make the demo real and give a small real-world test. Ask people in your network.
8. **Hindi reviewer:** someone who can read our Hindi letters for 20 minutes before submission.
9. **Optional:** a custom domain; xSpan CareHub API access, if you want to try for that sponsor award.
