# Caremometer

A free, open-source longitudinal web tool for measuring childcare precarity in research studies.

Built by Mateus Mazzaferro, Stanford Graduate School of Education
Live demo: [https://mateusmazza.github.io/caremometer/](https://mateusmazza.github.io/caremometer/)
Stack: React 19 + Vite + Firebase (Firestore + Auth) + GitHub Pages

---

## Overview

Caremometer is a survey platform designed for small-to-medium longitudinal studies (~100 participants). Participant data is stored in Google Firestore (free tier) and the app is hosted on GitHub Pages. Researcher access is protected by Firebase Authentication.

The app is organized around four instruments plus a researcher dashboard:

| Route | Instrument | Access |
|-------|-----------|--------|
| `/` | Eligibility screener | Public |
| `/consent?pid=...` | Informed consent | Participant link |
| `/entry?pid=...` | Enrollment survey (~30 min) | Participant link |
| `/checkin?pid=...` | Weekly check-in (~5 min) | Participant link |
| `/exit?pid=...` | Exit assessment (~30 min) | Participant link |
| `/dashboard` | Researcher dashboard | Firebase Auth |

Each participant-facing route uses a `pid` query parameter. The researcher generates these links from the dashboard and sends them to participants.

---

## What It Measures

Caremometer operationalizes childcare precarity across five dimensions:

1. **Affordability** — cost burden and financial strain
2. **Reasonable effort** — how hard it is to find and maintain care
3. **Supports child development** — quality ratings per provider
4. **Meets parents' needs** — schedule fit, flexibility, preference match
5. **Instability over time** — week-to-week changes in care arrangements

The weekly calendar data is also used to compute:

- **Multiplicity**: number of distinct providers used in a week
- **Instability**: proportion of time slots that changed versus the prior week
- **Entropy**: Shannon entropy of provider usage within a week

These metrics are computed and stored for researcher export but are not shown to participants.

---

## Quickstart (for developers)

```bash
git clone https://github.com/mateusmazza/caremometer.git
cd caremometer
npm install
npm run dev
```

The app connects to the existing Caremometer Firestore project by default. To use your own Firebase project, see **Setting Up Your Own Instance** below.

---

## Setting Up Your Own Instance

If you want to run Caremometer for your own study with your own data, follow these steps. The entire setup takes about 30 minutes and costs nothing.

### 1. Fork and clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/caremometer.git
cd caremometer
npm install
```

### 2. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and click **Add project**
2. Name it (e.g., `my-study-caremometer`) and disable Google Analytics
3. Click **Create project**

### 3. Enable Firestore

1. In the Firebase console sidebar, click **Build > Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** and select **us-central** as the location
4. Click **Enable**

### 4. Enable Authentication

1. Click **Build > Authentication > Get started**
2. Click **Email/Password**, toggle it on, and click **Save**
3. Go to the **Users** tab and click **Add user**
4. Enter the email and password you want to use for the researcher dashboard

### 5. Register a web app and get your config

1. Go to **Project Settings** (gear icon) > **Your apps** > click the **</>** (Web) icon
2. Name it (e.g., `caremometer-web`), leave Firebase Hosting unchecked
3. Click **Register app** — you will see a `firebaseConfig` object
4. Open `src/firebase.js` in your fork and replace the existing config values with yours

### 6. Set up Firestore security rules

1. In the Firebase console, go to **Firestore Database > Rules**
2. Replace the content with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /participants/{pid} {
      allow read, write: if true;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **Publish**

> These rules allow open read/write on participant documents (access is controlled by knowing the participant ID, which is distributed by the researcher). All other collections are denied. For higher-security deployments, you can restrict writes or require authentication.

### 7. Deploy

Deploy to GitHub Pages, Vercel, Netlify, or any static host:

```bash
npm run build
# The built files are in dist/
```

For GitHub Pages, set your repository's Pages source to the `gh-pages` branch or configure a deploy action.

---

## Researcher Workflow

1. Go to `/dashboard` and sign in with your Firebase Auth email/password
2. Add participants by entering a participant ID (e.g., `P001`)
3. Copy the personalized instrument links and send them to participants
4. Monitor enrollment, consent, and check-in completion status
5. Export participant data as CSV (long-format with demographics, calendar, and metrics)

---

## Data Architecture

All participant data is stored in a Firestore collection called `participants`, with one document per participant keyed by their ID (e.g., `P001`). Each document contains:

- **screener** — eligibility answers and completion timestamp
- **contactInfo** — email and phone (PII, never included in CSV exports)
- **consentGiven / consentGivenAt** — consent status
- **providers** — array of care providers with name, type, and color
- **entryAssessment** — demographics, affordability, effort, development, needs, cognition sections
- **weeklyCheckins** — array of weekly check-ins, each with calendar data, survey answers, and computed metrics
- **exitAssessment** — final assessment sections

Researcher access is protected by Firebase Authentication (email/password). The dashboard login checks the user's credentials against Firebase Auth — there is no hardcoded password.

---

## Project Structure

```
src/
  components/
    calendar/       CalendarPainter, ProviderLegend
    layout/         Header, Footer, ProgressStepper
    survey/         SurveyQuestion
  context/          AppContext (Firebase Auth state)
  data/             questions.js (all survey question definitions)
  pages/            Screener, Consent, EntryAssessment,
                    WeeklyCheckin, ExitAssessment,
                    Dashboard, ThankYou
  utils/
    metrics.js      Multiplicity, instability, entropy calculations
    storage.js      Firestore-backed persistence and export helpers
  firebase.js       Firebase app initialization
```

---

## Current Limitations

- Several emotional and cognition measures are still placeholders awaiting validated instruments
- The app is not yet a Qualtrics implementation (but the route/pid structure is designed for portability)
- Firestore security rules use open access on participant documents (acceptable for researcher-controlled PIDs in small studies)
- No automated email/SMS reminders (use Qualtrics, Twilio, or Mailchimp for that)

---

## License

MIT. If you use this tool in research, a citation or acknowledgment is appreciated.

## Citation

> Mazzaferro, M. (2025). Caremometer [Software]. Stanford Graduate School of Education. https://github.com/mateusmazza/caremometer
