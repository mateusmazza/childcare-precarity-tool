/**
 * All survey question definitions for Caremometer.
 * Each question has: id, section, type, label, options (if applicable), required.
 *
 * Types: 'single' | 'multi' | 'scale' | 'text' | 'number' | 'dropdown' | 'date'
 * Placeholder questions are clearly labeled as such so they can be replaced
 * with validated instruments later.
 */

export const LIKERT_5 = [
  { value: 1, label: 'Never' },
  { value: 2, label: 'Rarely' },
  { value: 3, label: 'Sometimes' },
  { value: 4, label: 'Often' },
  { value: 5, label: 'Always' },
]

export const AGREE_5 = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neither Agree nor Disagree' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
]

export const DIFFICULTY_5 = [
  { value: 1, label: 'Not at all difficult' },
  { value: 2, label: 'Slightly difficult' },
  { value: 3, label: 'Moderately difficult' },
  { value: 4, label: 'Very difficult' },
  { value: 5, label: 'Extremely difficult' },
]

export const MATCH_5 = [
  { value: 1, label: 'Not at all' },
  { value: 2, label: 'Slightly' },
  { value: 3, label: 'Somewhat' },
  { value: 4, label: 'Mostly' },
  { value: 5, label: 'Perfectly' },
]

export const GAD_PHQ = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
]

export const CBCL = [
  { value: 0, label: 'Not true' },
  { value: 1, label: 'Somewhat/Sometimes true' },
  { value: 2, label: 'Often true/Very true' },
]

// ── SCREENER (Instrument 0 — public eligibility check) ────────────────────────

export const screenerQuestions = [
  {
    id: 'has_child_under_5',
    label: 'Do you have a child younger than 5 years old?',
    type: 'single',
    required: true,
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no',  label: 'No' },
    ],
  },
  {
    id: 'on_waitlist',
    label: 'Are you currently on a waitlist to secure a spot at a childcare facility or provider?',
    type: 'single',
    required: true,
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no',  label: 'No' },
    ],
  },
  {
    id: 'over_18',
    label: 'Are you 18 years of age or older?',
    type: 'single',
    required: true,
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no',  label: 'No' },
    ],
  },
  {
    id: 'speaks_english',
    label: 'Are you comfortable completing this study in English?',
    type: 'single',
    required: true,
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no',  label: 'No' },
    ],
  },
]

// ── DEMOGRAPHICS ──────────────────────────────────────────────────────────────

export const demographicsQuestions = [
  {
    id: 'relationship_to_child',
    label: 'What is your relationship to the child you are enrolling in the study?',
    type: 'single',
    required: true,
    options: [
      { value: 'biological_mother',  label: 'Biological mother' },
      { value: 'biological_father',  label: 'Biological father' },
      { value: 'adoptive_mother',    label: 'Adoptive mother' },
      { value: 'adoptive_father',    label: 'Adoptive father' },
      { value: 'stepmother',         label: 'Stepmother' },
      { value: 'stepfather',         label: 'Stepfather' },
      { value: 'grandparent',        label: 'Grandparent' },
      { value: 'foster_parent',      label: 'Foster parent' },
      { value: 'other',              label: 'Other caregiver or guardian' },
    ],
  },
  {
    id: 'child_dob',
    label: "What is your child's date of birth?",
    type: 'date',
    required: true,
    hint: "Used to calculate your child's age at the time of enrollment.",
  },
  {
    id: 'child_gender',
    label: 'What is your child\'s gender?',
    type: 'single',
    required: false,
    options: [
      { value: 'male', label: 'Boy' },
      { value: 'female', label: 'Girl' },
      { value: 'nonbinary', label: 'Non-binary / gender diverse' },
      { value: 'prefer_not', label: 'Prefer not to say' },
    ],
  },
  {
    id: 'parent_age',
    label: 'How old are you?',
    type: 'number',
    required: false,
    placeholder: 'Your age in years',
    min: 16,
    max: 99,
  },
  {
    id: 'race_ethnicity',
    label: 'What is your race/ethnicity? (Select all that apply)',
    type: 'multi',
    required: false,
    options: [
      { value: 'white', label: 'White' },
      { value: 'black', label: 'Black or African American' },
      { value: 'hispanic', label: 'Hispanic or Latino/a/x' },
      { value: 'asian', label: 'Asian' },
      { value: 'aian', label: 'American Indian or Alaska Native' },
      { value: 'nhpi', label: 'Native Hawaiian or Pacific Islander' },
      { value: 'multiracial', label: 'Multiracial' },
      { value: 'other', label: 'Other' },
      { value: 'prefer_not', label: 'Prefer not to say' },
    ],
  },
  {
    id: 'household_income',
    label: 'What is your total household annual income?',
    type: 'dropdown',
    required: false,
    options: [
      { value: 'under_25k', label: 'Less than $25,000' },
      { value: '25_50k', label: '$25,000–$49,999' },
      { value: '50_75k', label: '$50,000–$74,999' },
      { value: '75_100k', label: '$75,000–$99,999' },
      { value: '100_150k', label: '$100,000–$149,999' },
      { value: '150k_plus', label: '$150,000 or more' },
      { value: 'prefer_not', label: 'Prefer not to say' },
    ],
  },
  {
    id: 'household_size',
    label: 'How many people live in your household (including yourself)?',
    type: 'dropdown',
    required: false,
    options: [1, 2, 3, 4, 5, 6, 7].map(n => ({ value: String(n), label: String(n) })).concat([{ value: '8_plus', label: '8 or more' }]),
  },
  {
    id: 'household_structure',
    label: 'Which best describes your household?',
    type: 'single',
    required: false,
    options: [
      { value: 'two_parent', label: 'Two-parent household' },
      { value: 'single_parent', label: 'Single-parent household' },
      { value: 'grandparent', label: 'Grandparent-headed household' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'languages',
    label: 'What language(s) do you speak at home? (Select all that apply)',
    type: 'multi',
    required: false,
    options: [
      { value: 'english', label: 'English' },
      { value: 'spanish', label: 'Spanish' },
      { value: 'mandarin', label: 'Mandarin/Chinese' },
      { value: 'cantonese', label: 'Cantonese' },
      { value: 'vietnamese', label: 'Vietnamese' },
      { value: 'tagalog', label: 'Tagalog/Filipino' },
      { value: 'korean', label: 'Korean' },
      { value: 'arabic', label: 'Arabic' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'urbanicity',
    label: 'Which best describes where you live?',
    type: 'single',
    required: false,
    options: [
      { value: 'urban', label: 'Urban (city or large town)' },
      { value: 'suburban', label: 'Suburban (outside a city)' },
      { value: 'rural', label: 'Rural (small town or countryside)' },
    ],
  },
  {
  id: 'zip_code',
  label: 'What is your zip code?',
  note: 'Optional and anonymized — used only to understand regional differences, not to identify you.',
  type: 'text',
  required: false,
  placeholder: '5-digit zip code',
  maxLength: 10,
  },
{
  id: 'employment_status',
  label: 'Which of the following best describes your current employment status?',
  type: 'single',
  required: false,
  options: [
    { value: 'employed_full', label: 'Working full time' },
    { value: 'employed_part', label: 'Working part time' },
    { value: 'student_full', label: 'Full-time student' },
    { value: 'student_part', label: 'Part-time student' },
    { value: 'working_and_studying', label: 'Both working and studying' },
    { value: 'furloughed', label: 'Temporarily furloughed' },
    { value: 'unemployed', label: 'Currently not working' },
    { value: 'retired', label: 'Retired' },
    { value: 'other', label: 'Other' },
  ],
  allowOther: true,
},
  {
    id: 'housing_stability',
    label: 'In the past year, have you experienced housing instability (e.g., eviction, moving frequently, staying with others)?',
    type: 'single',
    required: false,
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'welfare_involvement',
    label: 'Do you currently receive any of the following government assistance? (Select all that apply)',
    type: 'multi',
    required: false,
    options: [
      { value: 'snap', label: 'SNAP (food stamps)' },
      { value: 'wic', label: 'WIC' },
      { value: 'medicaid', label: 'Medicaid / CHIP' },
      { value: 'tanf', label: 'TANF (cash assistance)' },
      { value: 'housing', label: 'Housing assistance / Section 8' },
      { value: 'none', label: 'None of the above' },
    ],
  },
  {
  id: 'waitlist_status',
  label: 'Are you currently on any childcare waitlists?',
  type: 'single',
  required: false,
  options: [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ],
},
{
  id: 'waitlist_count',
  label: 'How many childcare waitlists are you currently on?',
  type: 'number',
  required: false,
  placeholder: 'Number of waitlists',
  min: 0,
  max: 20,
  conditional: { id: 'waitlist_status', value: 'yes' },
},
{
  id: 'waitlist_details',
  label: 'Tell us about each waitlist you are on.',
  type: 'waitlist_detail',
  required: false,
  conditional: { id: 'waitlist_status', value: 'yes' },
  countSource: 'waitlist_count',
  fields: [
    {
      id: 'name',
      label: 'Name of provider or program',
      type: 'text',
      placeholder: 'e.g. Sunshine Daycare, Head Start',
      required: false,
    },
    {
      id: 'care_type',
      label: 'Type of care',
      type: 'single',
      required: false,
      options: [
        { value: 'center', label: 'Daycare center' },
        { value: 'family_home', label: 'Family home daycare' },
        { value: 'preschool', label: 'Preschool or pre-K' },
        { value: 'head_start', label: 'Head Start / Early Head Start' },
        { value: 'after_school', label: 'After-school program' },
        { value: 'nanny', label: 'Nanny or au pair agency' },
        { value: 'other', label: 'Other' },
      ],
    },
    {
      id: 'time_on_waitlist',
      label: 'How long have you been on this waitlist?',
      type: 'single',
      required: false,
      options: [
        { value: 'under_3mo', label: 'Less than 3 months' },
        { value: '3_6mo', label: '3–6 months' },
        { value: '6_12mo', label: '6–12 months' },
        { value: '1_2yr', label: '1–2 years' },
        { value: 'over_2yr', label: 'More than 2 years' },
      ],
    },
    {
      id: 'estimated_wait',
      label: 'Have you been given an estimated wait time?',
      type: 'single',
      required: false,
      options: [
        { value: 'yes_short', label: 'Yes — under 6 months' },
        { value: 'yes_long', label: 'Yes — 6 months or more' },
        { value: 'no', label: 'No estimate given' },
      ],
    },
    {
      id: 'subsidized',
      label: 'Is this a subsidized or voucher-based program?',
      type: 'single',
      required: false,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'unsure', label: 'Not sure' },
      ],
    },
  ],
},
]

// ── PROVIDER TYPES ────────────────────────────────────────────────────────────

export const PROVIDER_TYPES = [
  { value: 'center', label: 'Childcare center / daycare' },
  { value: 'family_home', label: 'Family childcare home (licensed)' },
  { value: 'relative', label: 'Relative / grandparent / family member' },
  { value: 'nanny', label: 'Nanny or babysitter' },
  { value: 'family_friend', label: 'Family friend or neighbor' },
  { value: 'head_start', label: 'Head Start / Early Head Start' },
  { value: 'school', label: 'School-based program (Pre-K, after school)' },
  { value: 'parent_self', label: 'Parent / self-care' },
  { value: 'other', label: 'Other' },
]

// ── ACCESS & PRECARITY: AFFORDABILITY ─────────────────────────────────────────

export const affordabilityQuestions = [
  {
    id: 'monthly_childcare_cost',
    label: 'How much do you pay per month for childcare in total (across all providers)?',
    type: 'dropdown',
    required: false,
    options: [
      { value: '0', label: '$0 (no cost)' },
      { value: '1_200', label: '$1–$200' },
      { value: '201_500', label: '$201–$500' },
      { value: '501_1000', label: '$501–$1,000' },
      { value: '1001_1500', label: '$1,001–$1,500' },
      { value: '1501_2000', label: '$1,501–$2,000' },
      { value: '2000_plus', label: 'More than $2,000' },
      { value: 'prefer_not', label: 'Prefer not to say' },
    ],
  },
  {
    id: 'income_percent_childcare',
    label: 'Roughly what percentage of your household income goes toward childcare? If you are not sure, an approximation is fine.',
    type: 'number',
    required: false,
    placeholder: 'Example: 10',
    min: 0,
    max: 100,
  },
  {
    id: 'subsidy_receipt',
    label: 'Do you receive any childcare subsidy or financial assistance?',
    type: 'single',
    required: false,
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'applied', label: 'Applied but not yet receiving' },
    ],
  },
  {
    id: 'subsidy_type',
    label: 'What type of childcare subsidy or assistance do you receive? (Select all that apply)',
    type: 'multi',
    required: false,
    options: [
      { value: 'ccdf', label: 'Child Care and Development Fund (CCDF) / State subsidy voucher' },
      { value: 'head_start', label: 'Head Start (free enrollment)' },
      { value: 'employer', label: 'Employer-provided benefit or FSA' },
      { value: 'state_prek', label: 'State-funded Pre-K program' },
      { value: 'other', label: 'Other' },
    ],
    conditional: { id: 'subsidy_receipt', value: 'yes' },
  },
]

// ── ACCESS & PRECARITY: REASONABLE EFFORT ─────────────────────────────────────

export const reasonableEffortQuestions = [
  {
    id: 'commute_to_provider',
    label: 'Roughly, how long does it take to travel to your main childcare provider in minutes (one way)?',
    type: 'number',
    required: false,
    placeholder: 'Example: 15',
    min: 0,
    max: 180,
  },
  {
    id: 'transportation_mode',
    label: 'How do you usually get to childcare? (Select all that apply)',
    type: 'multi',
    required: false,
    options: [
      { value: 'walk', label: 'Walking' },
      { value: 'transit', label: 'Public transit (bus, subway, train)' },
      { value: 'car', label: 'Personal car' },
      { value: 'rideshare', label: 'Rideshare (Uber, Lyft, taxi)' },
      { value: 'carpool', label: 'Carpool with another family' },
      { value: 'bike', label: 'Bicycle' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'difficulty_finding',
    label: 'Have you had any difficulty finding space in a home- or center-based child care program?',
    type: 'scale',
    required: false,
    options: DIFFICULTY_5,
  },
  {
    id: 'search_duration',
    label: 'How long did you search before finding your current main childcare arrangement?',
    type: 'single',
    required: false,
    options: [
      { value: 'still_searching', label: 'Still searching / haven\'t found what I need' },
      { value: 'under_1mo', label: 'Less than 1 month' },
      { value: '1_3mo', label: '1–3 months' },
      { value: '3_6mo', label: '3–6 months' },
      { value: '6_12mo', label: '6–12 months' },
      { value: 'over_1yr', label: 'More than 1 year' },
    ],
  },
  {
    id: 'search_current',
    label: 'Are you currently looking for child care, either additional/other child care than your current situation or because you do not currently have care?',
    type: 'single',
    required: false,
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' }
    ],
  }
]

// ── ACCESS & PRECARITY: SUPPORTS CHILD DEVELOPMENT (per provider) ──────────────

export const childDevelopmentQuestions = [
  {
    id: 'accredited',
    label: 'Is this provider accredited (e.g., NAEYC, state quality rating)?',
    type: 'single',
    required: false,
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'dont_know', label: 'I don\'t know' },
    ],
  },
  {
    id: 'provider_education',
    label: 'What is the highest level of education of the main caregiver at this provider?',
    type: 'dropdown',
    required: false,
    options: [
      { value: 'no_degree', label: 'No formal degree' },
      { value: 'hs', label: 'High school diploma or GED' },
      { value: 'some_college', label: 'Some college' },
      { value: 'associates', label: 'Associate\'s degree' },
      { value: 'bachelors', label: 'Bachelor\'s degree' },
      { value: 'graduate', label: 'Graduate degree (Master\'s or higher)' },
      { value: 'dont_know', label: 'I don\'t know' },
    ],
  },
  {
    id: 'head_start',
    label: 'Is this a Head Start or Early Head Start program?',
    type: 'single',
    required: false,
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'school_based',
    label: 'Is this care school-based (e.g., Pre-K, before/after school program)?',
    type: 'single',
    required: false,
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'language_match',
    label: 'Does this provider speak your home language?',
    type: 'single',
    required: false,
    options: [
      { value: 'yes', label: 'Yes, fully' },
      { value: 'partially', label: 'Partially' },
      { value: 'no', label: 'No' },
    ],
  },
]

// ── ACCESS & PRECARITY: MEETS PARENTS' NEEDS ──────────────────────────────────

export const meetsNeedsQuestions = [
  {
    id: 'preferred_care',
    label: 'My current childcare arrangement is my preferred type of care.',
    type: 'scale',
    required: false,
    options: AGREE_5,
  },
  {
    id: 'schedule_fit',
    label: 'My current childcare arrangement matches my work/school schedule.',
    type: 'scale',
    required: false,
    options: AGREE_5,
  },
  {
    id: 'flexibility',
    label: 'My current childcare arrangement is flexible when my schedule unexpectedly changes.',
    type: 'scale',
    required: false,
    options: AGREE_5,
  },
  {
    id: 'work_impact',
    label: 'Recent difficulties with childcare have impacted my ability to work or study.',
    type: 'scale',
    required: false,
    options: AGREE_5,
  },
]

// ── PLACEHOLDER: PARENT EMOTIONAL STATE ───────────────────────────────────────
// ⚠ PLACEHOLDER — Replace with validated instrument (e.g., PROMIS Anxiety Short Form)

export const parentEmotionalQuestions = [
  {
    id: 'GAD1',
    label: 'In the last week, how often have you felt nervous, anxious, or on edge?',
    placeholder: false,
    type: 'scale',
    required: false,
    options: GAD_PHQ,
  },
 {
    id: 'GAD2',
    label: 'In the last week, how often were you not able to stop or control worrying?',
    placeholder: false,
    type: 'scale',
    required: false,
    options: GAD_PHQ,
  },
    {
    id: 'PHQ1',
    label: 'In the last week, how often have you felt little interest or pleasure in doing things?',
    placeholder: false,
    type: 'scale',
    required: false,
    options: GAD_PHQ,
  },
 {
    id: 'PHQ2',
    label: 'In the last week, how often have you felt down, depressed, or hopeless?',
    placeholder: false,
    type: 'scale',
    required: false,
    options: GAD_PHQ,
  },
  {
    id: 'STRESS1',
    label: 'Stress means a situation in which a person feels tense, restless, nervous or anxious or is unable to sleep at night because his/her mind is troubled all the time. Have you felt this kind of stress in the last week?',
    placeholder: false,
    type: 'scale',
    required: false,
    options: LIKERT_5,
  },
]

// ──PLACEHOLDER: CHILD EMOTIONAL STATE ────────────────────────────────────────
// ⚠ PLACEHOLDER — Replace with validated instrument (e.g., BITSEA)

export const childEmotionalQuestions = [
  {
    id: 'internalizing',
    label: 'In the past week, did your child seem fearful or anxious?',
    placeholder: true,
    type: 'scale',
    required: false,
    options: CBCL,
  },
  {
    id: 'externalizing',
    label: 'In the past week, did your child seem fussy or defiant?',
    placeholder: true,
    type: 'scale',
    required: false,
    options: CBCL,

  },
]

// ── PLACEHOLDER: PARENT COGNITION ─────────────────────────────────────────────
// ⚠ PLACEHOLDER — Replace with validated instrument (e.g., PROMIS Cognitive Function)

export const parentCognitionQuestions = [
  {
    id: 'placeholder_parent_cognition_1',
    label: '[Placeholder — Parent Cognition] THIS WILL LIKELY BE REPLACED BY COGNITIVE TASK',
    placeholder: true,
    type: 'scale',
    required: false,
    options: LIKERT_5,
  },
]

// ── PLACEHOLDER: CHILD COGNITION ──────────────────────────────────────────────
// ⚠ PLACEHOLDER — Replace with validated age-appropriate instrument

export const childCognitionQuestions = [
  {
    id: 'placeholder_child_cognition_1',
    label: '[Placeholder — Child Cognition] THIS WILL LIKELY BE REPLACED BY COGNITIVE TASK',
    placeholder: true,
    type: 'scale',
    required: false,
    options: LIKERT_5,
  },
]

// ── WEEKLY CHECK-IN SURVEY ─────────────────────────────────────────────────────

export const weeklyCheckinQuestions = [
  {
    id: 'provider_changes',
    label: 'Have there been any changes to your childcare providers since last week?',
    type: 'single',
    required: true,
    options: [
      { value: 'yes', label: 'Yes — I need to update my providers' },
      { value: 'no', label: 'No — same providers as last week' },
    ],
  },
  {
    id: 'waitlist_removed',
    label: 'Did you get off from any waitlists this week, for example, because you got a spot in a preferred childcare option?',
    type: 'single',
    required: false,
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
   {
    id: 'waitlist_removed_confounder',
    label: 'Was your exit of this waitlist caused by any of the following? ',
    type: 'single',
    required: false,
    options: [
      { value: 'new_job', label: 'I got a new job.' },
      { value: 'raise', label: 'I got a raise.' },
      { value: 'moved', label: 'I moved to a new home.' },
      { value: 'none', label: 'None of the above, a spot opened for my child.' },
    ],
    conditional: { id: 'waitlist_removed', value: 'yes' },
  },
  {
    id: 'weekly_disruption',
    label: 'Did you experience any unexpected disruption to your childcare this week (provider sick, last-minute cancellation, etc.)?',
    type: 'single',
    required: false,
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'GAD1',
    label: 'In the last week, how often have you felt nervous, anxious, or on edge?',
    placeholder: false,
    type: 'scale',
    required: false,
    options: GAD_PHQ,
  },
 {
    id: 'GAD2',
    label: 'In the last week, how often were you not able to stop or control worrying?',
    placeholder: false,
    type: 'scale',
    required: false,
    options: GAD_PHQ,
  },
    {
    id: 'PHQ1',
    label: 'In the last week, how often have you felt little interest or pleasure in doing things?',
    placeholder: false,
    type: 'scale',
    required: false,
    options: GAD_PHQ,
  },
 {
    id: 'PHQ2',
    label: 'In the last week, how often have you felt down, depressed, or hopeless?',
    placeholder: false,
    type: 'scale',
    required: false,
    options: GAD_PHQ,
  },
  {
    id: 'STRESS1',
    label: 'Stress means a situation in which a person feels tense, restless, nervous or anxious or is unable to sleep at night because his/her mind is troubled all the time. Have you felt this kind of stress in the last week?',
    placeholder: false,
    type: 'scale',
    required: false,
    options: LIKERT_5,
  },
  {
    id: 'internalizing',
    label: '[ADAPT] Fearful or anxious',
    placeholder: true,
    type: 'scale',
    required: false,
    options: CBCL,
  },
  {
    id: 'externalizing',
    label: '[ADAPT] Fussy or defiant',
    placeholder: true,
    type: 'scale',
    required: false,
    options: CBCL,
  },
]


// ── PROVIDER COLOR PALETTE ─────────────────────────────────────────────────────

export const PROVIDER_COLORS = [
  '#2563eb', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
]
