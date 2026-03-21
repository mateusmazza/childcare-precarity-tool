# Caremometer — Master To-Do

> **Project**: Caremometer — a free, open-source, longitudinal web-based tool for measuring childcare precarity in research studies.
> **PI/Developer**: Mateus (Stanford GSE PhD student)
> **Stack**: React SPA + Firebase (Spark free tier) + GitHub Pages
> **Repo**: https://github.com/mateusmazza/caremometer

---

## Background & Design Decisions

### What is this tool?
A web app for parents to self-report childcare arrangements across time, enabling researchers to compute precarity metrics (instability, multiplicity, entropy) longitudinally. The tool is structured around two main instruments:

- **Entry/Exit Assessment** (~30 min): Full demographics + all access/precarity domains + parent and child emotional/cognitive measures
- **Weekly Check-in** (~5 min): Calendar painting interface + brief emotional update + waitlist status

### Why this stack?
- **GitHub Pages**: Free static hosting, integrates with GitHub for open-source distribution
- **Firebase (free Spark plan)**: Provides authentication, Firestore database (1 GB storage, 50K reads/day, 20K writes/day), and hosting — all free. Well within limits for a research study.
- **React**: Component-based, widely adopted, good ecosystem. The calendar/painting interface already exists as an HTML prototype that can be ported.
- **No paid services required**: The entire stack is free. Stanford's Qualtrics can also be used as an optional integration for survey modules if preferred.

### What precarity constructs does this measure?
Drawn from Duh Leong et al. (2023) and the PI's framework:
1. **Affordability** — % income spent on childcare, subsidy receipt, income bracket, family size, zip code
2. **Reasonable Effort** — geographic burden, transportation, difficulty finding care, waitlist status
3. **Supports Child Development** — accreditation, provider education, Head Start, school-based, language match
4. **Meets Parents' Needs** — alignment with preferred care, fit with work/school schedule
5. **Instability/Precarity** — computed from the weekly calendar data

Computed longitudinal metrics (from the calendar data):
- **Multiplicity**: Number of distinct arrangements per week
- **Instability**: Proportion of time slots where arrangement changed week-over-week
- **Entropy**: Shannon entropy of arrangement distribution (chaos/unpredictability)

---

## PHASE 0 — Project Setup & Architecture

- [x] **0.1** Create a GitHub repository (`caremometer`) with MIT License and README stub
- [x] **0.2** Initialize a React project using Vite (fast, modern, zero-config) inside the repo
- [x] **0.3** Set up GitHub Pages deployment via GitHub Actions (auto-deploy on push to `main`)
- [ ] **0.4** Create a Firebase project (free Spark plan): enable Authentication (anonymous + email/link), Firestore, and Firebase Hosting as fallback
- [ ] **0.5** Connect Firebase config to the React app via environment variables (`.env.local`); document in README how to set up your own Firebase project
- [ ] **0.6** Define Firestore data schema (see Data Model section below)
- [ ] **0.7** Set up Firestore security rules (participants can only read/write their own data; researchers with admin role can read all)
- [x] **0.8** Set up repo structure: `/src/components`, `/src/pages`, `/src/hooks`, `/src/utils`, `/src/firebase`

---

## PHASE 1 — Data Model Design

- [ ] **1.1** Finalize and document the Firestore collections schema:

  ```
  /participants/{participantId}
    - studyId: string
    - enrolledAt: timestamp
    - status: 'active' | 'completed' | 'dropped'
    - consentGiven: boolean
    - demographics: { ... }  ← entry assessment
    - entryAssessment: { completedAt, responses: { ... } }
    - exitAssessment: { completedAt, responses: { ... } }

  /participants/{participantId}/weeklyCheckins/{weekId}
    - weekStartDate: string (YYYY-MM-DD)
    - completedAt: timestamp
    - calendarData: { [date]: { [hour]: providerId | null } }
    - providers: [{ id, name, type, location, ... }]
    - emotionalState: { parent: ..., child: ... }
    - waitlistStatus: { ... }
    - computedMetrics: { multiplicity, instability, entropy }
  ```

- [ ] **1.2** Define the full question/item list for the entry assessment (align with notes.docx):
  - Demographics: urbanicity, child age, race/ethnicity, HH income, languages, homelessness, welfare involvement, parental employment, household structure, waitlist status
  - Affordability: % income on childcare, subsidy, income bracket, family size, zip
  - Reasonable effort: provider locations relative to home/work, transportation, waitlist, difficulty finding
  - Supports child development: accreditation, provider degree, Head Start, school-based, language match (per provider)
  - Meets parents' needs: is this preferred care? Does it fit work schedule?
  - Parent emotional state: validated scale (e.g., PROMIS anxiety short form, or perceived stress)
  - Child emotional state: parent-reported (e.g., BITSEA or equivalent short form)
  - Parent cognition: short validated measure (e.g., brief executive function)
  - Child cognition: age-appropriate parent-report (e.g., Bayley or Vineland screener items)

- [ ] **1.3** Define the weekly check-in item list:
  - Calendar (which provider cared for child each hour, past 7 days)
  - Any changes to arrangements since last week?
  - Waitlist status update
  - Parent emotional state (brief, ~2 items)
  - Child emotional state (brief, ~2 items)

- [ ] **1.4** Review item list with PI (Mateus) before implementing — flag any items that need validated scale permissions or wording review

---

## PHASE 2 — App Shell & Navigation

- [ ] **2.1** Build the top-level router structure (React Router v6):
  - `/` → Welcome/landing page
  - `/consent` → Informed consent screen
  - `/enroll` → Entry assessment (multi-step form)
  - `/checkin` → Weekly check-in (calendar + brief survey)
  - `/exit` → Exit assessment
  - `/dashboard` → Researcher admin dashboard (protected route)
  - `/thank-you` → Completion screen

- [ ] **2.2** Build a `ProgressStepper` component (shows step N of N for multi-page forms)
- [ ] **2.3** Build global layout: header with study branding, footer with contact info, responsive sidebar or top nav
- [ ] **2.4** Implement participant authentication flow:
  - For MVP prototype: hardcode one test participant (email: mmmazzaferro@gmail.com, phone: 646-821-2183); participant logs in with their email to resume weekly check-ins
  - Store participant session in localStorage for persistence within a browser session
  - In the future, new participants will be enrolled via a Qualtrics eligibility screener (to be built later); the app should be designed so adding new participants requires only a config/database change, not code changes

- [ ] **2.5** Implement a "return participant" flow: participant enters their email to receive a magic link and resume where they left off

---

## PHASE 3 — Entry Assessment (Multi-Step Form)

- [ ] **3.1** Build a reusable `SurveyQuestion` component family:
  - `SingleChoice` (radio buttons)
  - `MultiChoice` (checkboxes)
  - `Scale` (Likert, 1–5 or 1–7)
  - `TextInput` (short text, number)
  - `Dropdown` (for longer option lists)

- [ ] **3.2** Build a `MultiStepForm` wrapper: handles navigation between steps, validates each step before advancing, saves progress to Firestore on each step

- [ ] **3.3** Implement the Consent screen (plain language study description, risks/benefits, data privacy, consent checkbox)

- [ ] **3.4** Implement **Demographics section** (step 1 of entry assessment):
  - Child age, race/ethnicity, HH income bracket, household structure, languages, urbanicity, zip code
  - Parental employment status, welfare/subsidy involvement, housing stability, waitlist status

- [ ] **3.5** Implement **Provider Roster screen** (step 2):
  - Dynamic form to add 1–N providers (name/label, type, location, hours typically used)
  - These providers become the "palette" for the weekly calendar painting
  - Each provider gets a color assigned automatically

- [ ] **3.6** Implement **Access & Precarity survey** (step 3):
  - Affordability block
  - Reasonable effort block
  - Supports child development block (per-provider items)
  - Meets parents' needs block

- [ ] **3.7** Implement **Parent Emotional State** module (step 4) — use clearly labeled placeholder questions for now (e.g., "Placeholder Parent Emotional Distress Question 1") with 5-point Likert scales; replace with validated instrument (e.g., PROMIS) once selected

- [ ] **3.8** Implement **Child Emotional State** module (step 5) — use clearly labeled placeholder questions (e.g., "Placeholder Child Emotional State Question 1") with 5-point Likert scales; replace with validated instrument once selected

- [ ] **3.9** Implement **Cognition modules** (steps 6–7) — use clearly labeled placeholders (e.g., "Placeholder Parent Cognition Question 1", "Placeholder Child Cognition Question 1") with Likert scales; replace with validated instruments once selected

- [ ] **3.10** Build a summary/review screen at the end of entry assessment before final submission

---

## PHASE 4 — Weekly Calendar Check-in

- [ ] **4.1** Port the existing `childcare-calendar.html` painting interface to a React component (`<CalendarPainter />`)
  - Preserve all core functionality: time slots (6am–10pm), day columns, click-and-drag painting, eraser
  - Make providers dynamic (pulled from the participant's enrolled provider roster)
  - Use actual past-7-days dates as column headers (not generic Mon–Sun), matching the Qualtrics JS version

- [ ] **4.2** Add touch/mobile support to the calendar (touch events for tablet/phone painting)

- [ ] **4.3** Build a `ProviderLegend` component showing color coding with provider names

- [ ] **4.4** Add an "Any changes to providers this week?" prompt before the calendar — if yes, show a quick form to add/remove/rename providers for this week's entry

- [ ] **4.5** Build the **weekly brief survey** section (after calendar):
  - Waitlist status update (2–3 questions)
  - Parent emotional state (brief, ~2 items)
  - Child emotional state (brief, ~2 items)

- [ ] **4.6** Build the weekly check-in **review screen**: show summary of time filled (% complete), warning if calendar is incomplete, before submission

- [ ] **4.7** Auto-compute and store metrics on submission:
  - **Multiplicity**: count of distinct providers used that week
  - **Instability**: compare each time slot to prior week's entry; compute proportion of changed slots
  - **Entropy**: Shannon entropy across provider usage distribution

- [ ] **4.8** Build a "week history" mini-view on the check-in landing so returning participants can see which weeks they've completed

---

## PHASE 5 — Computed Metrics Engine

- [ ] **5.1** Write a pure JavaScript utility module (`/src/utils/metrics.js`) implementing:
  - `computeMultiplicity(weekCalendarData)` → integer
  - `computeInstability(currentWeekData, priorWeekData)` → 0–1 float
  - `computeEntropy(weekCalendarData)` → Shannon entropy float
  - `computeUnpredictability(allWeeksData)` → aggregate metric across all weeks

- [ ] **5.2** Write unit tests for the metrics module (at minimum: verify formulas match the mathematical definitions in `idea pitch.qmd`)

- [ ] **5.3** Add a participant-facing "Your childcare profile" summary screen (optional, participatory — shows simple visualizations of their own stability over time if they've completed 2+ weeks)

---

## PHASE 6 — Exit Assessment

- [ ] **6.1** Exit assessment mirrors the entry assessment structure — reuse all `SurveyQuestion` components
- [ ] **6.2** Implement logic to trigger the exit assessment (manual trigger by researcher, or auto-prompt after N weeks)
- [ ] **6.3** Show a completion/thank-you screen with study contact info

---

## PHASE 7 — Researcher Dashboard

- [ ] **7.1** Protect the `/dashboard` route with Firebase Auth (email/password for researchers)
- [ ] **7.2** Build a participant table: participant ID, enrollment date, # check-ins completed, assessment status, latest metrics
- [ ] **7.3** Build a **CSV export** function:
  - Long-format export: one row per participant × week × time slot
  - Wide-format export: one row per participant × week with summary metrics
  - Include all demographic fields, assessment responses, computed metrics

- [ ] **7.4** Build a simple analytics summary: enrollment count, weekly completion rate, average instability/multiplicity/entropy across the sample

- [ ] **7.5** Add a "Copy reminder link" feature in the dashboard: generates a pre-filled URL the researcher can manually paste into a text message to send to the participant (no automated sending for MVP)
- [ ] **7.6** *(Future)* Integrate automated SMS text reminders via a service such as Twilio or a similar provider; reminders should fire on a weekly cadence and include the participant's unique check-in link

---

## PHASE 8 — GitHub & Documentation

- [ ] **8.1** Write a thorough `README.md`:
  - Project overview and research context
  - Live demo link (GitHub Pages URL)
  - How to set up your own instance (fork, create Firebase project, set env vars, deploy)
  - How to customize the survey items
  - How to export data

- [ ] **8.2** Create a `CONTRIBUTING.md` with guidelines for other researchers who want to extend the tool

- [ ] **8.3** Write a `FIREBASE_SETUP.md` step-by-step guide (screenshot-based) for non-technical researchers to set up their own free Firebase backend

- [ ] **8.4** Add a `data-schema.md` documenting the full Firestore schema and CSV export column definitions

- [ ] **8.5** Tag a `v1.0.0` release on GitHub once core functionality is stable

---

## PHASE 9 — Testing & Refinement

- [ ] **9.1** User-test with 2–3 pilot participants (ideally actual parents); gather feedback on time burden and UX clarity
- [ ] **9.2** Test on mobile (iPhone + Android) and tablet — especially the calendar painting interface
- [ ] **9.3** Validate that computed metrics (instability, entropy) produce sensible numbers on pilot data
- [ ] **9.4** IRB considerations: confirm the tool does not store PII beyond what the IRB protocol allows; verify consent flow matches IRB-approved language
- [ ] **9.5** Check WCAG 2.1 AA accessibility (color contrast, keyboard nav, screen reader labels)

---

## Design Decisions (Resolved)

| # | Question | Decision |
|---|----------|----------|
| 1 | **Validated scales** | Use clearly labeled **placeholder** questions and Likert scales for all emotional/cognitive modules for now. Replace with validated instruments once PI selects them. |
| 2 | **Study design trigger** | MVP has **one hardcoded test participant** (mmmazzaferro@gmail.com / 646-821-2183). Full enrollment via a Qualtrics eligibility screener is deferred. App architecture must make adding participants a data-only change. |
| 3 | **Weekly reminders** | PI will send **manual SMS reminders** to participants. Dashboard will provide a one-click "copy reminder link" button. Automated SMS (Twilio or similar) is a future feature. |
| 4 | **Qualtrics integration** | Focus on the **standalone web app** first. A Qualtrics-embedded version is a future deliverable. |
| 5 | **IRB / data retention** | This is a **prototype only** — no IRB yet. Data retention rules and PII handling will be revisited when an IRB protocol is prepared. A university-based server may replace Firebase at that stage. |
| 6 | **Child direct assessment** | **Deferred.** Direct measures (pupil dilation, phone-based cognitive games, heart rate) are out of scope for the MVP. |
| 7 | **Language/localization** | **English-only** for MVP. Spanish and other languages deferred. |

---

## Future / Deferred Work

These items are intentionally out of scope for the current build but must be tracked for future iterations:

- [ ] **F1** Build a **Qualtrics-embedded version** of the tool — port the standalone React calendar component to the existing Qualtrics JS/HTML integration pattern (see `qualtrics_javascript_for_calendar.js` and `qualtrics_html_for_calendar.html`)
- [ ] **F2** Create a **Qualtrics eligibility screener** that, upon completion, auto-enrolls eligible parents as participants in the Firebase database and sends them their unique check-in link
- [ ] **F3** Implement **automated SMS reminders** (Twilio or equivalent) on a weekly cadence with participant's unique check-in link
- [ ] **F4** Migrate backend from Firebase (free tier) to a **Stanford/university-managed server** once an IRB is in place and the study scales up
- [ ] **F5** Add **IRB-compliant data retention and deletion** controls: participant data purge after study end date, audit log, and data request form
- [ ] **F6** Build **child direct assessment modules**: phone-based cognitive game(s), heart rate integration via phone camera (rPPG), pupil dilation via front camera
- [ ] **F7** Add **Spanish localization** (and potentially other languages) for the full assessment interface
- [ ] **F8** Add **per-provider per-week** access & precarity items to the weekly check-in (currently only collected at entry/exit)

---

## Milestone Summary

| Milestone | Phases | Status |
|-----------|--------|--------|
| M1: Architecture & skeleton app | 0, 1, 2 | ✅ Complete |
| M2: Entry assessment working end-to-end | 3 | ✅ Complete |
| M3: Calendar check-in working end-to-end | 4, 5 | ✅ Complete |
| M4: Exit assessment + researcher dashboard + export | 6, 7 | ✅ Complete |
| M5: Docs, GitHub, open-source release | 8 | ✅ Complete |
| M6: Pilot testing & refinement | 9 | In progress |
