# Caremometer

A free, open-source, longitudinal web application for measuring childcare precarity in research studies.

**Built by:** Mateus Mazzaferro, Stanford Graduate School of Education
**Live demo:** https://mateusmazza.github.io/caremometer/
**Stack:** React + Vite + localStorage (Firebase-ready) + GitHub Pages

---

## What is childcare precarity?

Childcare precarity is the degree to which a family's childcare arrangements are insecure, unreliable, or misaligned with their needs — especially while parents work or attend school. Caremometer operationalizes precarity across five dimensions:

1. **Affordability** — cost burden relative to income, subsidy access
2. **Reasonable Effort** — geographic burden, difficulty finding care
3. **Supports Child Development** — accreditation, provider education, program quality
4. **Meets Parents' Needs** — fit with work schedule, alignment with preferred care
5. **Instability** — week-to-week changes in care arrangements (measured via calendar)

Computed longitudinal metrics from the weekly calendar data:
- **Multiplicity** — number of distinct providers used per week
- **Instability** — proportion of time slots that changed week-over-week
- **Entropy** — Shannon entropy of provider usage distribution (unpredictability)

---

## Features

- Entry assessment (~30 min) — demographics, provider roster, all precarity domains, placeholder emotional/cognitive measures
- Weekly calendar check-in (~5 min) — tap-and-drag painting interface for childcare schedules
- Auto-computed metrics — instability, multiplicity, entropy calculated on each submission
- Researcher dashboard — participant overview, metrics table, one-click CSV export
- Exit assessment — mirrors entry structure for longitudinal comparison
- **Mobile-first** — full touch support on the calendar, 48px touch targets, iOS auto-zoom prevention, responsive layout
- No server required — data stored in browser localStorage (Firebase-ready interface)

---

## Quickstart (for developers)

```bash
git clone https://github.com/mateusmazza/caremometer.git
cd caremometer
npm install
npm run dev
```

The app runs at `http://localhost:5173/caremometer/`.

---

## Deploy your own instance (free)

### 1. Fork this repository

Click **Fork** on GitHub to create your own copy.

### 2. Enable GitHub Pages

In your fork: Settings → Pages → Source: select **GitHub Actions**.

### 3. Set the researcher password

In your fork: Settings → Secrets and variables → Actions → New repository secret:
- Name: `VITE_RESEARCHER_PASSWORD`
- Value: a strong password of your choice

### 4. Add your participant emails

Edit `src/utils/storage.js` and update the `ALLOWED_EMAILS` array:

```js
const ALLOWED_EMAILS = ['participant1@example.com', 'participant2@example.com']
```

### 5. Push to `main`

GitHub Actions will automatically build and deploy. Your app will be at:
`https://YOUR-USERNAME.github.io/caremometer/`

---

## (Optional) Add Firebase for persistent cloud storage

The MVP stores data in `localStorage` — per-browser, per-device. To support participants on multiple devices or to centralize data, swap in Firebase. See **FIREBASE_SETUP.md** for step-by-step instructions.

---

## Customizing survey questions

All survey questions are defined in one file: `src/data/questions.js`.

Placeholder questions are labeled with `placeholder: true` and tagged `[Placeholder — ...]` in the text. To replace a placeholder with a validated instrument:

1. Open `src/data/questions.js`
2. Find the relevant array (e.g., `parentEmotionalQuestions`)
3. Replace the placeholder items with the validated scale items
4. Remove `placeholder: true` from each replaced item

No changes to components are needed.

---

## Data export

Researchers export data as CSV from the dashboard (`/dashboard`). The CSV includes one row per participant × week × date × hour with all demographics, provider info, and computed metrics.

---

## Project structure

```
src/
  components/
    calendar/       CalendarPainter, ProviderLegend
    layout/         Header, Footer, ProgressStepper
    survey/         SurveyQuestion
  context/          AppContext
  data/             questions.js
  pages/            Welcome, Login, Consent, EntryAssessment,
                    WeeklyCheckin, ExitAssessment, Dashboard, ThankYou
  utils/
    metrics.js      Multiplicity, instability, entropy
    storage.js      localStorage abstraction (Firebase-ready)
```

---

## License

MIT. If you use this tool in research, a citation or acknowledgment is appreciated.

## Citation

> Mazzaferro, M. (2025). Caremometer [Software]. Stanford Graduate School of Education. https://github.com/mateusmazza/caremometer
