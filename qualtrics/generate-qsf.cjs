#!/usr/bin/env node
/**
 * Caremometer QSF Generator
 *
 * Generates Qualtrics-importable .qsf files for each survey instrument.
 * Run: node qualtrics/generate-qsf.js
 *
 * Outputs:
 *   qualtrics/screener.qsf
 *   qualtrics/consent-and-entry.qsf
 *   qualtrics/weekly-checkin.qsf
 *   qualtrics/exit.qsf
 */

const fs = require('fs')
const path = require('path')

// ── ID generators ─────────────────────────────────────────────────────────────

function randomAlpha(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let out = ''
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

function makeSurveyID()  { return `SV_${randomAlpha(15)}` }
function makeBlockID()   { return `BL_${randomAlpha(13)}` }
function makeResponseSet() { return `RS_${randomAlpha(15)}` }

// ── Scale constants ───────────────────────────────────────────────────────────

const AGREE_5 = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neither Agree nor Disagree' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
]

const LIKERT_5 = [
  { value: 1, label: 'Never' },
  { value: 2, label: 'Rarely' },
  { value: 3, label: 'Sometimes' },
  { value: 4, label: 'Often' },
  { value: 5, label: 'Always' },
]

const DIFFICULTY_5 = [
  { value: 1, label: 'Not at all difficult' },
  { value: 2, label: 'Slightly difficult' },
  { value: 3, label: 'Moderately difficult' },
  { value: 4, label: 'Very difficult' },
  { value: 5, label: 'Extremely difficult' },
]

const GAD_PHQ = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
]

const CBCL = [
  { value: 0, label: 'Not true' },
  { value: 1, label: 'Somewhat / Sometimes true' },
  { value: 2, label: 'Often true / Very true' },
]

const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

// ── Question element builders ─────────────────────────────────────────────────

function buildMC(qid, text, choices, opts = {}) {
  const isMulti   = opts.multi || false
  const isDropdown = opts.dropdown || false
  const choiceObj = {}
  const choiceOrder = []
  choices.forEach((c, i) => {
    choiceObj[String(i + 1)] = { Display: String(c.label) }
    choiceOrder.push(i + 1)
  })
  return {
    QuestionText: text,
    DefaultChoices: false,
    DataExportTag: opts.tag || qid,
    QuestionType: 'MC',
    Selector: isDropdown ? 'DL' : (isMulti ? 'MAVR' : 'SAVR'),
    SubSelector: isDropdown ? undefined : 'TX',
    DataVisibility: { Private: false, Hidden: false },
    Configuration: { QuestionDescriptionOption: 'UseText' },
    QuestionDescription: text.replace(/<[^>]*>/g, '').slice(0, 100),
    Choices: choiceObj,
    ChoiceOrder: choiceOrder,
    Validation: {
      Settings: {
        ForceResponse: opts.required ? 'ON' : 'OFF',
        ForceResponseType: opts.required ? 'ON' : 'OFF',
        Type: 'None',
      },
    },
    GradingData: [],
    Language: [],
    NextChoiceId: choices.length + 1,
    NextAnswerId: 1,
    QuestionID: qid,
    ...(opts.displayLogic ? { DisplayLogic: opts.displayLogic } : {}),
  }
}

function buildTE(qid, text, opts = {}) {
  return {
    QuestionText: text,
    DefaultChoices: false,
    DataExportTag: opts.tag || qid,
    QuestionType: 'TE',
    Selector: opts.multiline ? 'ML' : 'SL',
    DataVisibility: { Private: false, Hidden: false },
    Configuration: { QuestionDescriptionOption: 'UseText' },
    QuestionDescription: text.replace(/<[^>]*>/g, '').slice(0, 100),
    Validation: {
      Settings: {
        ForceResponse: opts.required ? 'ON' : 'OFF',
        ForceResponseType: opts.required ? 'ON' : 'OFF',
        Type: opts.contentType || 'None',
        ...(opts.contentType ? { ContentType: opts.contentType } : {}),
      },
    },
    GradingData: [],
    Language: [],
    NextChoiceId: 4,
    NextAnswerId: 1,
    QuestionID: qid,
    ...(opts.displayLogic ? { DisplayLogic: opts.displayLogic } : {}),
  }
}

function buildTextBlock(qid, html) {
  return {
    QuestionText: html,
    DefaultChoices: false,
    DataExportTag: qid,
    QuestionType: 'DB',
    Selector: 'TB',
    DataVisibility: { Private: false, Hidden: false },
    Configuration: { QuestionDescriptionOption: 'UseText' },
    QuestionDescription: html.replace(/<[^>]*>/g, '').slice(0, 100),
    ChoiceOrder: [],
    Validation: { Settings: { Type: 'None' } },
    GradingData: [],
    Language: [],
    NextChoiceId: 4,
    NextAnswerId: 1,
    QuestionID: qid,
  }
}

// Build display logic for "show if question X has choice Y selected"
function makeDisplayLogic(parentQID, choiceIndex) {
  return {
    '0': {
      '0': {
        ChoiceLocator: `q://${parentQID}/SelectableChoice/${choiceIndex}`,
        Description: `<span class="ConjDesc">If</span> condition`,
        LeftOperand: `q://${parentQID}/SelectableChoice/${choiceIndex}`,
        LogicType: 'Question',
        Operator: 'Selected',
        QuestionID: parentQID,
        QuestionIDFromLocator: parentQID,
        QuestionIsInLoop: 'no',
        Type: 'Expression',
      },
      Type: 'If',
    },
    Type: 'BooleanExpression',
    inPage: false,
  }
}

// ── Convert a Caremometer question to a Qualtrics payload ─────────────────────

function convertQuestion(q, qid, opts = {}) {
  const t = q.type
  const displayLogic = opts.displayLogic || undefined

  if (t === 'single' || t === 'scale') {
    const options = q.options || []
    return buildMC(qid, q.label, options, {
      tag: q.id,
      required: q.required,
      displayLogic,
    })
  }
  if (t === 'multi') {
    return buildMC(qid, q.label, q.options || [], {
      tag: q.id,
      required: q.required,
      multi: true,
      displayLogic,
    })
  }
  if (t === 'dropdown') {
    return buildMC(qid, q.label, q.options || [], {
      tag: q.id,
      required: q.required,
      dropdown: true,
      displayLogic,
    })
  }
  if (t === 'text') {
    return buildTE(qid, q.label, { tag: q.id, required: q.required, displayLogic })
  }
  if (t === 'number') {
    return buildTE(qid, q.label, {
      tag: q.id,
      required: q.required,
      contentType: 'ValidNumber',
      displayLogic,
    })
  }
  if (t === 'date') {
    return buildTE(qid, q.label, { tag: q.id, required: q.required, displayLogic })
  }
  // Fallback: text entry
  return buildTE(qid, q.label, { tag: q.id, required: q.required, displayLogic })
}

// ── Wrap everything into a QSF survey ─────────────────────────────────────────

function buildSurvey(name, blockDefs) {
  // blockDefs = [{ name, questions: [payloads] }, ...]
  // Each question payload already has QuestionID set

  const surveyId = makeSurveyID()
  const rsId     = makeResponseSet()
  const elements = []

  // Collect all questions and assign to blocks
  const blocks = []
  const allQIDs = []

  for (const bdef of blockDefs) {
    const blockId = makeBlockID()
    const blockElements = []
    for (let i = 0; i < bdef.questions.length; i++) {
      const q = bdef.questions[i]
      blockElements.push({ Type: 'Question', QuestionID: q.QuestionID })
      allQIDs.push(q.QuestionID)
      // Add page break between questions (not after last)
      if (i < bdef.questions.length - 1) {
        blockElements.push({ Type: 'Page Break' })
      }
    }
    const isFirst = blocks.length === 0
    const block = {
      Type: isFirst ? 'Default' : 'Standard',
      Description: bdef.name,
      ID: blockId,
      BlockElements: blockElements,
    }
    if (!isFirst) block.SubType = ''
    blocks.push(block)
  }

  // Add trash block
  blocks.push({
    Type: 'Trash',
    Description: 'Trash / Unused Questions',
    ID: makeBlockID(),
  })

  // BL element — Payload must be an object with numeric string keys, not an array
  const blocksObj = {}
  blocks.forEach((b, i) => { blocksObj[String(i + 1)] = b })
  elements.push({
    SurveyID: surveyId,
    Element: 'BL',
    PrimaryAttribute: 'Survey Blocks',
    SecondaryAttribute: null,
    TertiaryAttribute: null,
    Payload: blocksObj,
  })

  // FL element — blocks in presentation order
  // Note: add EmbeddedData for 'pid' manually in Qualtrics survey flow
  let flowCounter = 1
  const flowItems = []

  // Block flow — all active blocks use Type "Standard" with Autofill array
  for (const block of blocks) {
    if (block.Type === 'Trash') continue
    flowItems.push({
      Type: 'Standard',
      ID: block.ID,
      FlowID: `FL_${++flowCounter}`,
      Autofill: [],
    })
  }

  elements.push({
    SurveyID: surveyId,
    Element: 'FL',
    PrimaryAttribute: 'Survey Flow',
    SecondaryAttribute: null,
    TertiaryAttribute: null,
    Payload: {
      Type: 'Root',
      FlowID: 'FL_1',
      Flow: flowItems,
      Properties: { Count: flowCounter },
    },
  })

  // SQ elements
  for (const bdef of blockDefs) {
    for (const q of bdef.questions) {
      elements.push({
        SurveyID: surveyId,
        Element: 'SQ',
        PrimaryAttribute: q.QuestionID,
        SecondaryAttribute: (q.QuestionDescription || '').slice(0, 100),
        TertiaryAttribute: null,
        Payload: q,
      })
    }
  }

  // SO - Survey Options
  elements.push({
    SurveyID: surveyId,
    Element: 'SO',
    PrimaryAttribute: 'Survey Options',
    SecondaryAttribute: null,
    TertiaryAttribute: null,
    Payload: {
      BackButton: 'true',
      SaveAndContinue: 'true',
      SurveyProtection: 'PublicSurvey',
      BallotBoxStuffingPrevention: 'false',
      NoIndex: 'Yes',
      SecureResponseFiles: 'true',
      SurveyExpiration: 'None',
      SurveyTermination: 'DefaultMessage',
      Header: '',
      Footer: '',
      ProgressBarDisplay: 'Text',
      PartialData: '+1 week',
      ValidationMessage: '',
      PreviousButton: ' ← Back',
      NextButton: 'Continue →',
      SurveyTitle: 'Qualtrics Survey | Qualtrics Experience Management',
      SkinLibrary: 'gse',
      SkinType: 'templated',
      Skin: { brandingId: '73341743', templateId: '*base', overrides: null },
      NewScoring: 1,
      SurveyMetaDescription: 'The most powerful, simple and trusted way to gather experience data. Start your journey to experience management and try a free account today.',
      SurveyName: `Caremometer — ${name}`,
      ProtectSelectionIds: true,
    },
  })

  // Metadata elements
  elements.push({
    SurveyID: surveyId, Element: 'SCO',
    PrimaryAttribute: 'Scoring', SecondaryAttribute: null, TertiaryAttribute: null,
    Payload: { ScoringCategories: [], ScoringCategoryGroups: [], ScoringSummaryCategory: null,
      ScoringSummaryAfterQuestions: 0, ScoringSummaryAfterSurvey: 0,
      DefaultScoringCategory: null, AutoScoringCategory: null },
  })
  elements.push({
    SurveyID: surveyId, Element: 'PROJ',
    PrimaryAttribute: 'CORE', SecondaryAttribute: null, TertiaryAttribute: '1.1.0',
    Payload: { ProjectCategory: 'CORE', SchemaVersion: '1.1.0' },
  })
  elements.push({
    SurveyID: surveyId, Element: 'QC',
    PrimaryAttribute: 'Survey Question Count', SecondaryAttribute: String(allQIDs.length),
    TertiaryAttribute: null, Payload: null,
  })
  elements.push({
    SurveyID: surveyId, Element: 'RS',
    PrimaryAttribute: rsId, SecondaryAttribute: null, TertiaryAttribute: null, Payload: null,
  })
  elements.push({
    SurveyID: surveyId, Element: 'STAT',
    PrimaryAttribute: 'Survey Statistics', SecondaryAttribute: null, TertiaryAttribute: null,
    Payload: { MobileCompatible: true, ID: `Survey Statistics` },
  })
  elements.push({
    SurveyID: surveyId, Element: 'PL',
    PrimaryAttribute: 'Preview Link', SecondaryAttribute: null, TertiaryAttribute: null,
    Payload: { PreviewType: 'Brand', PreviewID: randomAlpha(36) },
  })

  // QG + QGO — Quota Groups (required by Qualtrics import)
  const qgId = `QG_${randomAlpha(15)}`
  elements.push({
    SurveyID: surveyId, Element: 'QG',
    PrimaryAttribute: qgId, SecondaryAttribute: 'Default Quota Group', TertiaryAttribute: null,
    Payload: { ID: qgId, Name: 'Default Quota Group', Selected: true,
      MultipleMatch: 'PlaceInAll', Public: false, Quotas: [] },
  })
  elements.push({
    SurveyID: surveyId, Element: 'QGO',
    PrimaryAttribute: 'QGO_QuotaGroupOrder', SecondaryAttribute: null, TertiaryAttribute: null,
    Payload: [qgId],
  })

  return {
    SurveyEntry: {
      SurveyID: surveyId,
      SurveyName: `Caremometer — ${name}`,
      SurveyDescription: null,
      SurveyOwnerID: 'UR_000000000000000',
      SurveyBrandID: 'gse',
      DivisionID: null,
      SurveyLanguage: 'EN',
      SurveyActiveResponseSet: rsId,
      SurveyStatus: 'Inactive',
      SurveyStartDate: '0000-00-00 00:00:00',
      SurveyExpirationDate: '0000-00-00 00:00:00',
      SurveyCreationDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
      CreatorID: 'UR_000000000000000',
      LastModified: new Date().toISOString().replace('T', ' ').slice(0, 19),
      LastAccessed: '0000-00-00 00:00:00',
      LastActivated: '0000-00-00 00:00:00',
      Deleted: null,
    },
    SurveyElements: elements,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SURVEY DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

let QID = 0
function nextQID() { return `QID${++QID}` }

// Track QID assignments for display logic references
const qidMap = {}

function addQ(q, opts = {}) {
  const qid = nextQID()
  qidMap[q.id] = qid
  return convertQuestion(q, qid, opts)
}

function addTextBlock(html) {
  return buildTextBlock(nextQID(), html)
}

// ── Screener ──────────────────────────────────────────────────────────────────

function generateScreener() {
  QID = 0

  const eligibilityQs = [
    { id: 'has_child_under_5', label: 'Do you have a child younger than 5 years old?', type: 'single', required: true, options: YES_NO },
    { id: 'on_waitlist', label: 'Are you currently on a waitlist to secure a spot at a childcare facility or provider?', type: 'single', required: true, options: YES_NO },
    { id: 'over_18', label: 'Are you 18 years of age or older?', type: 'single', required: true, options: YES_NO },
    { id: 'speaks_english', label: 'Are you comfortable completing this study in English?', type: 'single', required: true, options: YES_NO },
    { id: 'lives_in_us', label: 'Do you currently live in the United States?', type: 'single', required: true, options: YES_NO },
  ]

  return buildSurvey('Screener', [
    {
      name: 'Eligibility',
      questions: [
        addTextBlock('<h2>Caremometer — Eligibility Screening</h2><p>Please answer all questions below to check your eligibility for this study.</p>'),
        ...eligibilityQs.map(q => addQ(q)),
      ],
    },
    {
      name: 'Contact Information',
      questions: [
        addTextBlock('<h3>Contact Information</h3><p>Please share your contact information so the research team can reach you. This is stored separately from your research responses and will <strong>never</strong> appear in data exports.</p>'),
        buildTE(nextQID(), 'Email address', { tag: 'email' }),
        buildTE(nextQID(), 'Phone number', { tag: 'phone' }),
      ],
    },
  ])
}

// ── Consent + Entry ───────────────────────────────────────────────────────────

function generateConsentAndEntry() {
  QID = 0

  // Consent block
  const consentText = `
<h2>Consent to Participate in Research</h2>
<p><strong>Study title:</strong> Caremometer — Measuring Childcare Precarity<br>
<strong>Principal Investigator:</strong> Philip Fisher, Ph.D., Stanford Graduate School of Education<br>
<strong>Student Researcher:</strong> Mateus Mazzaferro, Stanford Graduate School of Education<br>
<strong>Contact:</strong> mmmazzaferro@gmail.com</p>

<h3>Purpose</h3>
<p>We are studying childcare precarity — the degree to which families struggle to find, afford, and maintain reliable childcare.</p>

<h3>What participation involves</h3>
<ul>
<li><strong>Enrollment survey (~30 min)</strong> — questions about you, your child(ren), and your childcare arrangements.</li>
<li><strong>Weekly check-ins (~5 min each)</strong> — a short calendar-based log of your childcare schedule.</li>
<li><strong>Exit survey (~30 min)</strong> — a final set of questions at the end of the study period.</li>
</ul>

<h3>Risks</h3>
<p>Minimal risk. Some questions ask about income, childcare costs, and family stress. You may skip any question you prefer not to answer.</p>

<h3>Benefits</h3>
<p>No direct benefit. Your responses will contribute to research that may improve childcare policy.</p>

<h3>Confidentiality</h3>
<p>Your responses will be de-identified before any analysis. Contact information is stored separately and never appears in research data exports.</p>

<h3>Voluntary participation</h3>
<p>Participation is entirely voluntary. You may withdraw at any time without penalty.</p>

<h3>Questions or concerns</h3>
<p>Research team: mmmazzaferro@gmail.com<br>
Stanford IRB: irb2-manager@stanford.edu or (650) 723-2480</p>
`.trim()

  const consentQ = buildMC(nextQID(), 'I have read and understood the information above. I am 18 years of age or older, and I voluntarily agree to participate in this research study.', [
    { label: 'I agree to participate' },
  ], { tag: 'consent', required: true })

  // Demographics
  const demoQs = [
    { id: 'relationship_to_child', label: 'What is your relationship to the child?', type: 'single', required: true,
      options: [
        { value: 'biological_mother', label: 'Biological mother' }, { value: 'biological_father', label: 'Biological father' },
        { value: 'adoptive_mother', label: 'Adoptive mother' }, { value: 'adoptive_father', label: 'Adoptive father' },
        { value: 'stepmother', label: 'Stepmother' }, { value: 'stepfather', label: 'Stepfather' },
        { value: 'grandparent', label: 'Grandparent' }, { value: 'foster_parent', label: 'Foster parent' },
        { value: 'other', label: 'Other' },
      ] },
    { id: 'child_dob', label: "What is your child's date of birth?", type: 'date', required: true },
    { id: 'child_gender', label: "What is your child's gender?", type: 'single', required: false,
      options: [ { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'nonbinary', label: 'Non-binary' }, { value: 'prefer_not', label: 'Prefer not to say' } ] },
    { id: 'parent_age', label: 'How old are you?', type: 'number', required: false },
    { id: 'race_ethnicity', label: 'What is your race/ethnicity? (Select all that apply)', type: 'multi', required: false,
      options: [
        { value: 'white', label: 'White' }, { value: 'black', label: 'Black or African American' },
        { value: 'hispanic', label: 'Hispanic or Latino' }, { value: 'asian', label: 'Asian' },
        { value: 'aian', label: 'American Indian / Alaska Native' }, { value: 'nhpi', label: 'Native Hawaiian / Pacific Islander' },
        { value: 'multiracial', label: 'Multiracial' }, { value: 'other', label: 'Other' }, { value: 'prefer_not', label: 'Prefer not to say' },
      ] },
    { id: 'household_income', label: 'What is your total household annual income?', type: 'dropdown', required: false,
      options: [
        { value: 'under_25k', label: 'Under $25,000' }, { value: '25_50k', label: '$25,000 – $49,999' },
        { value: '50_75k', label: '$50,000 – $74,999' }, { value: '75_100k', label: '$75,000 – $99,999' },
        { value: '100_150k', label: '$100,000 – $149,999' }, { value: '150k_plus', label: '$150,000 or more' },
        { value: 'prefer_not', label: 'Prefer not to say' },
      ] },
    { id: 'household_size', label: 'How many people live in your household?', type: 'dropdown', required: false,
      options: [1,2,3,4,5,6,7].map(n => ({ value: String(n), label: String(n) })).concat([{ value: '8_plus', label: '8 or more' }]) },
    { id: 'household_structure', label: 'Which best describes your household?', type: 'single', required: false,
      options: [ { value: 'two_parent', label: 'Two-parent household' }, { value: 'single_parent', label: 'Single-parent household' },
        { value: 'grandparent', label: 'Grandparent-led household' }, { value: 'other', label: 'Other' } ] },
    { id: 'languages', label: 'What language(s) do you speak at home? (Select all that apply)', type: 'multi', required: false,
      options: [
        { value: 'english', label: 'English' }, { value: 'spanish', label: 'Spanish' }, { value: 'mandarin', label: 'Mandarin' },
        { value: 'cantonese', label: 'Cantonese' }, { value: 'vietnamese', label: 'Vietnamese' }, { value: 'tagalog', label: 'Tagalog' },
        { value: 'korean', label: 'Korean' }, { value: 'arabic', label: 'Arabic' }, { value: 'other', label: 'Other' },
      ] },
    { id: 'urbanicity', label: 'Which best describes where you live?', type: 'single', required: false,
      options: [ { value: 'urban', label: 'Urban' }, { value: 'suburban', label: 'Suburban' }, { value: 'rural', label: 'Rural' } ] },
    { id: 'zip_code', label: 'What is your zip code?', type: 'text', required: false },
    { id: 'employment_status', label: 'Which best describes your current employment status?', type: 'single', required: false,
      options: [
        { value: 'employed_full', label: 'Employed full-time' }, { value: 'employed_part', label: 'Employed part-time' },
        { value: 'student_full', label: 'Full-time student' }, { value: 'student_part', label: 'Part-time student' },
        { value: 'working_and_studying', label: 'Working and studying' }, { value: 'furloughed', label: 'Furloughed / on leave' },
        { value: 'unemployed', label: 'Unemployed' }, { value: 'retired', label: 'Retired' }, { value: 'other', label: 'Other' },
      ] },
    { id: 'housing_stability', label: 'In the past year, have you experienced housing instability?', type: 'single', required: false, options: YES_NO },
    { id: 'welfare_involvement', label: 'Do you currently receive any government assistance? (Select all that apply)', type: 'multi', required: false,
      options: [
        { value: 'snap', label: 'SNAP (food stamps)' }, { value: 'wic', label: 'WIC' }, { value: 'medicaid', label: 'Medicaid' },
        { value: 'tanf', label: 'TANF' }, { value: 'housing', label: 'Housing assistance' }, { value: 'none', label: 'None' },
      ] },
    { id: 'waitlist_status', label: 'Are you currently on any childcare waitlists?', type: 'single', required: false, options: YES_NO },
    { id: 'waitlist_count', label: 'How many childcare waitlists are you currently on?', type: 'number', required: false,
      conditional: { id: 'waitlist_status', value: 'yes' } },
  ]

  // Provider roster — simplified as form text entries
  const providerTypes = [
    'Childcare center / daycare', 'Family childcare home (licensed)', 'Relative / grandparent',
    'Nanny or babysitter', 'Family friend or neighbor', 'Head Start / Early Head Start',
    'School-based program', 'Parent / self-care', 'Other',
  ]
  const providerTypeOpts = providerTypes.map((t, i) => ({ value: String(i + 1), label: t }))

  // Affordability
  const affordQs = [
    { id: 'monthly_childcare_cost', label: 'How much do you pay per month for childcare in total?', type: 'dropdown', required: false,
      options: [
        { value: '0', label: '$0 (no cost)' }, { value: '1_200', label: '$1 – $200' }, { value: '201_500', label: '$201 – $500' },
        { value: '501_1000', label: '$501 – $1,000' }, { value: '1001_1500', label: '$1,001 – $1,500' },
        { value: '1501_2000', label: '$1,501 – $2,000' }, { value: '2000_plus', label: 'Over $2,000' },
        { value: 'prefer_not', label: 'Prefer not to say' },
      ] },
    { id: 'income_percent_childcare', label: 'Roughly what percentage of your household income goes toward childcare?', type: 'number', required: false },
    { id: 'subsidy_receipt', label: 'Do you receive any childcare subsidy or financial assistance?', type: 'single', required: false,
      options: [ { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'applied', label: 'Applied but not yet receiving' } ] },
    { id: 'subsidy_type', label: 'What type of childcare subsidy or assistance do you receive? (Select all that apply)', type: 'multi', required: false,
      options: [
        { value: 'ccdf', label: 'CCDF / Child Care Subsidy' }, { value: 'head_start', label: 'Head Start' },
        { value: 'employer', label: 'Employer benefit' }, { value: 'state_prek', label: 'State pre-K' }, { value: 'other', label: 'Other' },
      ],
      conditional: { id: 'subsidy_receipt', value: 'yes' } },
  ]

  // Effort
  const effortQs = [
    { id: 'commute_to_provider', label: 'How long does it take to travel to your main childcare provider (one way, in minutes)?', type: 'number', required: false },
    { id: 'transportation_mode', label: 'How do you usually get to childcare? (Select all that apply)', type: 'multi', required: false,
      options: [
        { value: 'walk', label: 'Walk' }, { value: 'transit', label: 'Public transit' }, { value: 'car', label: 'Personal car' },
        { value: 'rideshare', label: 'Rideshare' }, { value: 'carpool', label: 'Carpool' }, { value: 'bike', label: 'Bike' }, { value: 'other', label: 'Other' },
      ] },
    { id: 'difficulty_finding', label: 'Have you had any difficulty finding space in a home- or center-based child care program?', type: 'scale', required: false, options: DIFFICULTY_5 },
    { id: 'search_duration', label: 'How long did you search before finding your current main childcare arrangement?', type: 'single', required: false,
      options: [
        { value: 'still_searching', label: 'Still searching' }, { value: 'under_1mo', label: 'Less than 1 month' },
        { value: '1_3mo', label: '1–3 months' }, { value: '3_6mo', label: '3–6 months' },
        { value: '6_12mo', label: '6–12 months' }, { value: 'over_1yr', label: 'Over 1 year' },
      ] },
    { id: 'search_current', label: 'Are you currently looking for child care?', type: 'single', required: false, options: YES_NO },
  ]

  // Child development (shown once — user can use Qualtrics Loop & Merge per provider)
  const childDevQs = [
    { id: 'accredited', label: 'Is this provider accredited?', type: 'single', required: false,
      options: [ { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'dont_know', label: "Don't know" } ] },
    { id: 'provider_education', label: 'What is the highest level of education of the main caregiver?', type: 'dropdown', required: false,
      options: [
        { value: 'no_degree', label: 'No degree' }, { value: 'hs', label: 'High school' }, { value: 'some_college', label: 'Some college' },
        { value: 'associates', label: 'Associate degree' }, { value: 'bachelors', label: "Bachelor's degree" },
        { value: 'graduate', label: 'Graduate degree' }, { value: 'dont_know', label: "Don't know" },
      ] },
    { id: 'head_start', label: 'Is this a Head Start or Early Head Start program?', type: 'single', required: false, options: YES_NO },
    { id: 'school_based', label: 'Is this care school-based?', type: 'single', required: false, options: YES_NO },
    { id: 'language_match', label: 'Does this provider speak your home language?', type: 'single', required: false,
      options: [ { value: 'yes', label: 'Yes' }, { value: 'partially', label: 'Partially' }, { value: 'no', label: 'No' } ] },
  ]

  // Meets needs
  const needsQs = [
    { id: 'preferred_care', label: 'My current childcare arrangement is my preferred type of care.', type: 'scale', required: false, options: AGREE_5 },
    { id: 'schedule_fit', label: 'My current childcare arrangement matches my work/school schedule.', type: 'scale', required: false, options: AGREE_5 },
    { id: 'flexibility', label: 'My current childcare arrangement is flexible when my schedule unexpectedly changes.', type: 'scale', required: false, options: AGREE_5 },
    { id: 'work_impact', label: 'Recent difficulties with childcare have impacted my ability to work or study.', type: 'scale', required: false, options: AGREE_5 },
  ]

  // Cognition placeholders
  const parentCogQs = [
    { id: 'placeholder_parent_cognition_1', label: '[Placeholder — Parent Cognition] To be replaced with validated instrument.', type: 'scale', required: false, options: LIKERT_5 },
  ]
  const childCogQs = [
    { id: 'placeholder_child_cognition_1', label: '[Placeholder — Child Cognition] To be replaced with validated instrument.', type: 'scale', required: false, options: LIKERT_5 },
  ]

  // Build blocks with display logic for conditional questions
  const demoQuestions = []
  for (const q of demoQs) {
    if (q.conditional) {
      const parentQID = qidMap[q.conditional.id]
      // Find which choice index matches the conditional value
      const parentQ = demoQs.find(d => d.id === q.conditional.id)
      const choiceIdx = parentQ ? parentQ.options.findIndex(o => o.value === q.conditional.value) + 1 : 1
      demoQuestions.push(addQ(q, { displayLogic: makeDisplayLogic(parentQID, choiceIdx) }))
    } else {
      demoQuestions.push(addQ(q))
    }
  }

  const affordQuestions = []
  for (const q of affordQs) {
    if (q.conditional) {
      const parentQID = qidMap[q.conditional.id]
      const parentQ = affordQs.find(d => d.id === q.conditional.id)
      const choiceIdx = parentQ ? parentQ.options.findIndex(o => o.value === q.conditional.value) + 1 : 1
      affordQuestions.push(addQ(q, { displayLogic: makeDisplayLogic(parentQID, choiceIdx) }))
    } else {
      affordQuestions.push(addQ(q))
    }
  }

  return buildSurvey('Consent & Entry Assessment', [
    {
      name: 'Informed Consent',
      questions: [
        buildTextBlock(nextQID(), consentText),
        consentQ,
      ],
    },
    {
      name: 'Demographics',
      questions: [
        addTextBlock('<p>All questions are optional unless marked as required. You may skip any question you prefer not to answer.</p>'),
        ...demoQuestions,
      ],
    },
    {
      name: 'Your Providers',
      questions: [
        addTextBlock('<h3>Your Childcare Providers</h3><p>List up to 6 people or programs who regularly care for your child. Include yourself if applicable. You will use these to fill in the weekly calendar later.</p>'),
        ...Array.from({ length: 6 }, (_, i) => {
          const n = i + 1
          return [
            buildTE(nextQID(), `Provider ${n} — Name or label (e.g., Sunshine Daycare, Grandma)`, { tag: `provider_${n}_name` }),
            buildMC(nextQID(), `Provider ${n} — Type of care`, providerTypeOpts, { tag: `provider_${n}_type`, dropdown: true }),
          ]
        }).flat(),
      ],
    },
    {
      name: 'Affordability',
      questions: affordQuestions,
    },
    {
      name: 'Access & Effort',
      questions: effortQs.map(q => addQ(q)),
    },
    {
      name: 'Child Development',
      questions: [
        addTextBlock('<p>The following questions ask about your <strong>main</strong> childcare provider. If you use Qualtrics Loop &amp; Merge, you can repeat this block per provider.</p>'),
        ...childDevQs.map(q => addQ(q)),
      ],
    },
    {
      name: 'Meets Your Needs',
      questions: needsQs.map(q => addQ(q)),
    },
    {
      name: 'Parent Cognition (Placeholder)',
      questions: [
        addTextBlock('<p><em>Placeholder — to be replaced with a validated instrument.</em></p>'),
        ...parentCogQs.map(q => addQ(q)),
      ],
    },
    {
      name: 'Child Cognition (Placeholder)',
      questions: [
        addTextBlock('<p><em>Placeholder — to be replaced with a validated instrument.</em></p>'),
        ...childCogQs.map(q => addQ(q)),
      ],
    },
  ])
}

// ── Weekly Check-in ───────────────────────────────────────────────────────────

function generateWeeklyCheckin() {
  QID = 0

  const providerChangesQ = { id: 'provider_changes', label: 'Have there been any changes to your childcare providers since last week?', type: 'single', required: true, options: YES_NO }

  const surveyQs = [
    { id: 'waitlist_removed', label: 'Did you get off from any waitlists this week?', type: 'single', required: false, options: YES_NO },
    { id: 'waitlist_removed_confounder', label: 'Was your exit caused by any of the following?', type: 'single', required: false,
      options: [ { value: 'new_job', label: 'New job or income change' }, { value: 'raise', label: 'Got a raise' },
        { value: 'moved', label: 'Moved / relocated' }, { value: 'none', label: 'None of the above' } ],
      conditional: { id: 'waitlist_removed', value: 'yes' } },
    { id: 'weekly_disruption', label: 'Did you experience any unexpected disruption to your childcare this week?', type: 'single', required: false, options: YES_NO },
    { id: 'GAD1', label: 'In the last week, how often have you felt nervous, anxious, or on edge?', type: 'scale', required: false, options: GAD_PHQ },
    { id: 'GAD2', label: 'In the last week, how often were you not able to stop or control worrying?', type: 'scale', required: false, options: GAD_PHQ },
    { id: 'PHQ1', label: 'In the last week, how often have you felt little interest or pleasure in doing things?', type: 'scale', required: false, options: GAD_PHQ },
    { id: 'PHQ2', label: 'In the last week, how often have you felt down, depressed, or hopeless?', type: 'scale', required: false, options: GAD_PHQ },
    { id: 'STRESS1', label: 'Stress means a situation in which a person feels tense, restless, nervous or anxious. Have you felt this kind of stress in the last week?', type: 'scale', required: false, options: LIKERT_5 },
    { id: 'internalizing', label: 'In the past week, has your child been fearful or anxious?', type: 'scale', required: false, options: CBCL },
    { id: 'externalizing', label: 'In the past week, has your child been fussy or defiant?', type: 'scale', required: false, options: CBCL },
  ]

  const surveyQuestions = []
  for (const q of surveyQs) {
    if (q.conditional) {
      const parentQID = qidMap[q.conditional.id]
      const parentQ = surveyQs.find(d => d.id === q.conditional.id)
      const choiceIdx = parentQ ? parentQ.options.findIndex(o => o.value === q.conditional.value) + 1 : 1
      surveyQuestions.push(addQ(q, { displayLogic: makeDisplayLogic(parentQID, choiceIdx) }))
    } else {
      surveyQuestions.push(addQ(q))
    }
  }

  return buildSurvey('Weekly Check-in', [
    {
      name: 'Provider Changes & Calendar',
      questions: [
        addQ(providerChangesQ),
        addTextBlock(`<h3>Weekly Calendar</h3>
<p>Use the calendar below to mark which provider cared for your child during each hour of the <strong>previous week (Sunday–Saturday)</strong>.</p>
<p><strong>To use the interactive calendar:</strong> paste the JavaScript from <code>qualtrics/calendar-painter.js</code> into this question's JavaScript editor in Qualtrics. See the setup guide for details.</p>
<p><em>If the interactive calendar is not available, describe your childcare schedule for each day of the past week in the text box below.</em></p>`),
        buildTE(nextQID(), 'Calendar data (JSON — filled automatically by the interactive calendar, or describe your schedule manually)', { tag: 'calendar_data', multiline: true }),
      ],
    },
    {
      name: 'Quick Survey',
      questions: surveyQuestions,
    },
  ])
}

// ── Exit Assessment ───────────────────────────────────────────────────────────

function generateExit() {
  QID = 0

  const exitDemoQs = [
    { id: 'employment_status', label: 'Which best describes your current employment status?', type: 'single', required: false,
      options: [
        { value: 'employed_full', label: 'Employed full-time' }, { value: 'employed_part', label: 'Employed part-time' },
        { value: 'student_full', label: 'Full-time student' }, { value: 'student_part', label: 'Part-time student' },
        { value: 'working_and_studying', label: 'Working and studying' }, { value: 'furloughed', label: 'Furloughed / on leave' },
        { value: 'unemployed', label: 'Unemployed' }, { value: 'retired', label: 'Retired' }, { value: 'other', label: 'Other' },
      ] },
    { id: 'household_income', label: 'What is your total household annual income?', type: 'dropdown', required: false,
      options: [
        { value: 'under_25k', label: 'Under $25,000' }, { value: '25_50k', label: '$25,000 – $49,999' },
        { value: '50_75k', label: '$50,000 – $74,999' }, { value: '75_100k', label: '$75,000 – $99,999' },
        { value: '100_150k', label: '$100,000 – $149,999' }, { value: '150k_plus', label: '$150,000 or more' },
        { value: 'prefer_not', label: 'Prefer not to say' },
      ] },
    { id: 'waitlist_status', label: 'Are you currently on any childcare waitlists?', type: 'single', required: false, options: YES_NO },
    { id: 'housing_stability', label: 'In the past year, have you experienced housing instability?', type: 'single', required: false, options: YES_NO },
  ]

  const affordQs = [
    { id: 'monthly_childcare_cost', label: 'How much do you pay per month for childcare in total?', type: 'dropdown', required: false,
      options: [
        { value: '0', label: '$0 (no cost)' }, { value: '1_200', label: '$1 – $200' }, { value: '201_500', label: '$201 – $500' },
        { value: '501_1000', label: '$501 – $1,000' }, { value: '1001_1500', label: '$1,001 – $1,500' },
        { value: '1501_2000', label: '$1,501 – $2,000' }, { value: '2000_plus', label: 'Over $2,000' },
        { value: 'prefer_not', label: 'Prefer not to say' },
      ] },
    { id: 'income_percent_childcare', label: 'Roughly what percentage of your household income goes toward childcare?', type: 'number', required: false },
    { id: 'subsidy_receipt', label: 'Do you receive any childcare subsidy or financial assistance?', type: 'single', required: false,
      options: [ { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'applied', label: 'Applied but not yet receiving' } ] },
    { id: 'subsidy_type', label: 'What type of childcare subsidy or assistance do you receive? (Select all that apply)', type: 'multi', required: false,
      options: [
        { value: 'ccdf', label: 'CCDF / Child Care Subsidy' }, { value: 'head_start', label: 'Head Start' },
        { value: 'employer', label: 'Employer benefit' }, { value: 'state_prek', label: 'State pre-K' }, { value: 'other', label: 'Other' },
      ],
      conditional: { id: 'subsidy_receipt', value: 'yes' } },
  ]

  const effortQs = [
    { id: 'commute_to_provider', label: 'How long does it take to travel to your main childcare provider (one way, in minutes)?', type: 'number', required: false },
    { id: 'transportation_mode', label: 'How do you usually get to childcare? (Select all that apply)', type: 'multi', required: false,
      options: [
        { value: 'walk', label: 'Walk' }, { value: 'transit', label: 'Public transit' }, { value: 'car', label: 'Personal car' },
        { value: 'rideshare', label: 'Rideshare' }, { value: 'carpool', label: 'Carpool' }, { value: 'bike', label: 'Bike' }, { value: 'other', label: 'Other' },
      ] },
    { id: 'difficulty_finding', label: 'Have you had any difficulty finding space in a home- or center-based child care program?', type: 'scale', required: false, options: DIFFICULTY_5 },
    { id: 'search_duration', label: 'How long did you search before finding your current main childcare arrangement?', type: 'single', required: false,
      options: [
        { value: 'still_searching', label: 'Still searching' }, { value: 'under_1mo', label: 'Less than 1 month' },
        { value: '1_3mo', label: '1–3 months' }, { value: '3_6mo', label: '3–6 months' },
        { value: '6_12mo', label: '6–12 months' }, { value: 'over_1yr', label: 'Over 1 year' },
      ] },
    { id: 'search_current', label: 'Are you currently looking for child care?', type: 'single', required: false, options: YES_NO },
  ]

  const needsQs = [
    { id: 'preferred_care', label: 'My current childcare arrangement is my preferred type of care.', type: 'scale', required: false, options: AGREE_5 },
    { id: 'schedule_fit', label: 'My current childcare arrangement matches my work/school schedule.', type: 'scale', required: false, options: AGREE_5 },
    { id: 'flexibility', label: 'My current childcare arrangement is flexible when my schedule unexpectedly changes.', type: 'scale', required: false, options: AGREE_5 },
    { id: 'work_impact', label: 'Recent difficulties with childcare have impacted my ability to work or study.', type: 'scale', required: false, options: AGREE_5 },
  ]

  const parentCogQs = [{ id: 'placeholder_parent_cognition_1', label: '[Placeholder — Parent Cognition]', type: 'scale', required: false, options: LIKERT_5 }]
  const childCogQs = [{ id: 'placeholder_child_cognition_1', label: '[Placeholder — Child Cognition]', type: 'scale', required: false, options: LIKERT_5 }]

  // Build with conditional logic
  const affordQuestions = []
  for (const q of affordQs) {
    if (q.conditional) {
      const parentQID = qidMap[q.conditional.id]
      const parentQ = affordQs.find(d => d.id === q.conditional.id)
      const choiceIdx = parentQ ? parentQ.options.findIndex(o => o.value === q.conditional.value) + 1 : 1
      affordQuestions.push(addQ(q, { displayLogic: makeDisplayLogic(parentQID, choiceIdx) }))
    } else {
      affordQuestions.push(addQ(q))
    }
  }

  return buildSurvey('Exit Assessment', [
    {
      name: 'Current Situation',
      questions: [
        addTextBlock('<p>This is the final survey of the study. Thank you for your participation.</p>'),
        ...exitDemoQs.map(q => addQ(q)),
      ],
    },
    { name: 'Affordability', questions: affordQuestions },
    { name: 'Access & Effort', questions: effortQs.map(q => addQ(q)) },
    { name: 'Meets Your Needs', questions: needsQs.map(q => addQ(q)) },
    {
      name: 'Parent Cognition (Placeholder)',
      questions: [
        addTextBlock('<p><em>Placeholder — to be replaced with a validated instrument.</em></p>'),
        ...parentCogQs.map(q => addQ(q)),
      ],
    },
    {
      name: 'Child Cognition (Placeholder)',
      questions: [
        addTextBlock('<p><em>Placeholder — to be replaced with a validated instrument.</em></p>'),
        ...childCogQs.map(q => addQ(q)),
      ],
    },
  ])
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

const outDir = __dirname

const surveys = {
  'screener.qsf':             generateScreener,
  'consent-and-entry.qsf':    generateConsentAndEntry,
  'weekly-checkin.qsf':       generateWeeklyCheckin,
  'exit.qsf':                 generateExit,
}

for (const [filename, gen] of Object.entries(surveys)) {
  const survey = gen()
  const outPath = path.join(outDir, filename)
  fs.writeFileSync(outPath, JSON.stringify(survey, null, 2))
  const qCount = survey.SurveyElements.filter(e => e.Element === 'SQ').length
  console.log(`  ${filename} — ${qCount} questions`)
}

console.log('\nDone! Import the .qsf files into Qualtrics via:')
console.log('  Projects → Create project → Survey → Import a QSF file')
