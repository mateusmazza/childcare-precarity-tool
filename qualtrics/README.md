# Caremometer — Qualtrics Implementation Guide

This folder contains importable Qualtrics survey files (.qsf) and a custom JavaScript calendar widget for running Caremometer studies entirely in Qualtrics.

## Files

| File | Description |
|------|------------|
| `screener.qsf` | Eligibility screening (5 questions + contact info) |
| `consent-and-entry.qsf` | Informed consent + full enrollment survey (demographics, providers, affordability, effort, child development, meets needs, cognition placeholders) |
| `weekly-checkin.qsf` | Weekly check-in with calendar placeholder + survey questions |
| `exit.qsf` | Exit assessment (mirrors enrollment structure) |
| `calendar-painter.js` | Interactive calendar widget to paste into the weekly check-in calendar question |
| `generate-qsf.cjs` | Node.js script that generated the QSF files (run again if you modify questions) |

## Setup Instructions

### 1. Import the surveys

For each `.qsf` file:

1. Log in to Qualtrics
2. Go to **Projects** → **Create a new project** → **Survey** → **From a File**
3. Upload the `.qsf` file
4. Click **Create project**

Repeat for all four surveys.

### 2. Set up embedded data for participant ID

Each survey expects a `pid` (participant ID) parameter passed via the URL. The QSF files already include `pid` as embedded data in the survey flow, but verify it:

1. Open the survey → **Survey flow**
2. Confirm there's an **Embedded Data** element at the top with field `pid`
3. If missing: click **Add a New Element Here** → **Embedded Data** → type `pid` → **Move** it to the top

When distributing links, append `?pid=P001` (or whatever the ID is):
```
https://your-qualtrics-url/jfe/form/SV_xxxxx?pid=P001
```

### 3. Set up the interactive calendar (weekly check-in)

The weekly check-in includes a text question as a placeholder for the calendar. To activate the interactive calendar:

1. Open the **Weekly Check-in** survey in Qualtrics
2. Find the question labeled "Calendar data (JSON...)"
3. Click the question → click the gear icon → **Add JavaScript**
4. Delete the default code
5. Paste the entire contents of `calendar-painter.js`
6. Click **Save**

The calendar reads provider names from embedded data fields: `provider_1_name` through `provider_6_name`. Set these in the survey flow:

1. Go to **Survey flow**
2. Add an **Embedded Data** element with fields: `provider_1_name`, `provider_2_name`, etc.
3. Set default values or pipe them from the entry survey

If embedded data is not set, the calendar will show generic "Provider 1", "Provider 2" labels.

### 4. Link surveys together

Set end-of-survey redirects so participants flow between surveys:

1. In each survey, go to **Survey options** → **Survey termination**
2. Choose **Redirect to a URL**
3. Set the URL to the next survey with `pid` piped in:
   - Screener → Consent & Entry: `https://your-qualtrics.../consent-entry?pid=${e://Field/pid}`
   - Consent & Entry → Thank You (or a custom end message)
   - Weekly Check-in → Thank You
   - Exit → Thank You

### 5. Distribute

Use Qualtrics distribution methods:
- **Anonymous links** with `?pid=P001` appended
- **Email distribution** with embedded data for `pid`
- **Automated workflows** for weekly check-in reminders

## Customizing questions

To regenerate the QSF files after editing questions:

1. Edit the question definitions in `generate-qsf.cjs`
2. Run: `node qualtrics/generate-qsf.cjs`
3. Re-import the updated `.qsf` files into Qualtrics

## Notes

- **Child Development block**: The entry survey includes child development questions once. If you need them per-provider, use Qualtrics **Loop & Merge** on that block.
- **Cognition placeholders**: Parent and child cognition blocks contain placeholder questions. Replace them with your validated instruments directly in Qualtrics.
- **Calendar data format**: The calendar saves data as a JSON string: `{ "2026-03-29": { "8": "prov_1", "9": "prov_2", ... }, ... }`. Parse this in R/Python during analysis.
- **Metrics**: Multiplicity, instability, and entropy are not computed in Qualtrics. Compute them post-hoc from the calendar JSON data using R or Python scripts.
- **Display logic**: Conditional questions (e.g., subsidy type shown only if receiving subsidies) are pre-configured with Qualtrics display logic in the QSF files.
