import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import ProgressStepper from '../components/layout/ProgressStepper'
import SurveyQuestion from '../components/survey/SurveyQuestion'
import {
  demographicsQuestions,
  affordabilityQuestions,
  reasonableEffortQuestions,
  childDevelopmentQuestions,
  meetsNeedsQuestions,
  parentEmotionalQuestions,
  childEmotionalQuestions,
  parentCognitionQuestions,
  childCognitionQuestions,
  PROVIDER_TYPES,
  PROVIDER_COLORS,
} from '../data/questions'
import {
  saveEntryAssessmentSection,
  saveProviders,
  completeEntryAssessment,
  getParticipant,
} from '../utils/storage'

const STEPS = [
  'Demographics',
  'Your Providers',
  'Affordability',
  'Access & Effort',
  'Child Development',
  "Meets Your Needs",
  'Parent Well-being',
  'Child Well-being',
  'Parent Cognition',
  'Child Cognition',
  'Review & Submit',
]

// ── Blank provider template ────────────────────────────────────────────────────
function newProvider(index) {
  return {
    id: `prov_${Date.now()}_${index}`,
    name: '',
    type: '',
    color: PROVIDER_COLORS[index % PROVIDER_COLORS.length],
  }
}

// ── Reusable section renderer ──────────────────────────────────────────────────
function SurveySection({ questions, answers, setAnswers, filterConditional }) {
  const visible = filterConditional
    ? questions.filter(q => {
        if (!q.conditional) return true
        const dep = answers[q.conditional.id]
        return dep === q.conditional.value
      })
    : questions

  return (
    <>
      {visible.map(q => (
        <SurveyQuestion
          key={q.id}
          question={q}
          value={answers[q.id]}
          onChange={val => setAnswers({ ...answers, [q.id]: val })}
        />
      ))}
    </>
  )
}

export default function EntryAssessment() {
  const { participant, refreshParticipant } = useApp()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [demographics, setDemographics] = useState({})
  const [providers, setProviders] = useState([newProvider(0)])
  const [affordability, setAffordability] = useState({})
  const [effort, setEffort] = useState({})
  const [childDev, setChildDev] = useState({})    // per-provider answers keyed by provider id
  const [meetsNeeds, setMeetsNeeds] = useState({})
  const [parentEmotional, setParentEmotional] = useState({})
  const [childEmotional, setChildEmotional] = useState({})
  const [parentCognition, setParentCognition] = useState({})
  const [childCognition, setChildCognition] = useState({})

  useEffect(() => {
    if (!participant) { navigate('/login'); return }
    if (!participant.consentGiven) { navigate('/consent'); return }

    // Rehydrate saved answers
    const entry = participant.entryAssessment || {}
    if (entry.demographics) setDemographics(entry.demographics)
    if (participant.providers?.length) setProviders(participant.providers)
    if (entry.affordability) setAffordability(entry.affordability)
    if (entry.effort) setEffort(entry.effort)
    if (entry.childDev) setChildDev(entry.childDev)
    if (entry.meetsNeeds) setMeetsNeeds(entry.meetsNeeds)
    if (entry.parentEmotional) setParentEmotional(entry.parentEmotional)
    if (entry.childEmotional) setChildEmotional(entry.childEmotional)
    if (entry.parentCognition) setParentCognition(entry.parentCognition)
    if (entry.childCognition) setChildCognition(entry.childCognition)
  }, [])

  // ── Provider management ────────────────────────────────────────────────────

  function addProvider() {
    setProviders(prev => [...prev, newProvider(prev.length)])
  }

  function updateProvider(id, field, value) {
    setProviders(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  function removeProvider(id) {
    setProviders(prev => prev.length > 1 ? prev.filter(p => p.id !== id) : prev)
  }

  // ── Autosave on each step advance ──────────────────────────────────────────

  function saveCurrentStep() {
    switch (step) {
      case 0: saveEntryAssessmentSection('demographics', demographics); break
      case 1: saveProviders(providers); break
      case 2: saveEntryAssessmentSection('affordability', affordability); break
      case 3: saveEntryAssessmentSection('effort', effort); break
      case 4: saveEntryAssessmentSection('childDev', childDev); break
      case 5: saveEntryAssessmentSection('meetsNeeds', meetsNeeds); break
      case 6: saveEntryAssessmentSection('parentEmotional', parentEmotional); break
      case 7: saveEntryAssessmentSection('childEmotional', childEmotional); break
      case 8: saveEntryAssessmentSection('parentCognition', parentCognition); break
      case 9: saveEntryAssessmentSection('childCognition', childCognition); break
    }
    refreshParticipant()
  }

  function goNext() {
    saveCurrentStep()
    setStep(s => s + 1)
    window.scrollTo(0, 0)
  }

  function goBack() {
    saveCurrentStep()
    setStep(s => s - 1)
    window.scrollTo(0, 0)
  }

  function handleSubmit() {
    saveCurrentStep()
    completeEntryAssessment()
    refreshParticipant()
    navigate('/thank-you?type=entry')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const validProviders = providers.filter(p => p.name.trim())

  return (
    <div className="container page">
      <h1 className="page__title">Enrollment Survey</h1>
      <p className="page__subtitle">Step {step + 1} of {STEPS.length}: <strong>{STEPS[step]}</strong></p>

      <ProgressStepper steps={STEPS} current={step} />

      <div style={{ marginTop: '1.75rem' }}>

        {/* ── Step 0: Demographics ──────────────────────────────────────────── */}
        {step === 0 && (
          <div>
            <div className="alert alert--info" style={{ marginBottom: '1.25rem' }}>
              All questions are optional unless marked with an asterisk (*). You may skip any question you prefer not to answer.
            </div>
            <SurveySection
              questions={demographicsQuestions}
              answers={demographics}
              setAnswers={setDemographics}
              filterConditional
            />
          </div>
        )}

        {/* ── Step 1: Provider Roster ───────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <div className="alert alert--info" style={{ marginBottom: '1.25rem' }}>
              List all the people or places that regularly care for your child, including yourself, your partner, and other relatives,
              as well as childcare facilities or centers, babysitters, and so on. You should also include a "None" option in case your child
              happens to be left alone sometimes because there is no available caretaker at the moment. 
              You'll use these to fill in the weekly calendar.
            </div>
            {providers.map((p, i) => (
              <div key={p.id} className="provider-card">
                <div className="provider-card__header">
                  <div className="flex items-center" style={{ gap: '.5rem' }}>
                    <span className="provider-color-dot" style={{ backgroundColor: p.color }} />
                    <strong style={{ fontSize: '.9375rem' }}>Provider {i + 1}</strong>
                  </div>
                  {providers.length > 1 && (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      style={{ color: 'var(--red)', fontSize: '.8125rem' }}
                      onClick={() => removeProvider(p.id)}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Provider name or label <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={p.name}
                    onChange={e => updateProvider(p.id, 'name', e.target.value)}
                    placeholder="e.g. Sunshine Daycare, Grandma, Babysitter Maria"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Type of care</label>
                  <select
                    className="form-select"
                    value={p.type}
                    onChange={e => updateProvider(p.id, 'type', e.target.value)}
                  >
                    <option value="">— Select type —</option>
                    {PROVIDER_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Color on your calendar</label>
                  <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                    {PROVIDER_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => updateProvider(p.id, 'color', c)}
                        style={{
                          width: 28, height: 28, borderRadius: '50%',
                          backgroundColor: c, border: p.color === c ? '3px solid #0f172a' : '2px solid transparent',
                          cursor: 'pointer',
                        }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="btn btn--secondary"
              onClick={addProvider}
              style={{ marginTop: '.5rem' }}
            >
              + Add another provider
            </button>
          </div>
        )}

        {/* ── Step 2: Affordability ─────────────────────────────────────────── */}
        {step === 2 && (
          <SurveySection
            questions={affordabilityQuestions}
            answers={affordability}
            setAnswers={setAffordability}
            filterConditional
          />
        )}

        {/* ── Step 3: Reasonable Effort ─────────────────────────────────────── */}
        {step === 3 && (
          <SurveySection
            questions={reasonableEffortQuestions}
            answers={effort}
            setAnswers={setEffort}
          />
        )}

        {/* ── Step 4: Supports Child Development (per provider) ─────────────── */}
        {step === 4 && (
          <div>
            <div className="alert alert--info" style={{ marginBottom: '1.25rem' }}>
              The following questions ask about each of your childcare providers separately.
            </div>
            {validProviders.map((p, i) => (
              <div key={p.id} style={{ marginBottom: '1.75rem' }}>
                <h3 className="section__title" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <span className="provider-color-dot" style={{ backgroundColor: p.color }} />
                  {p.name}
                </h3>
                <SurveySection
                  questions={childDevelopmentQuestions}
                  answers={childDev[p.id] || {}}
                  setAnswers={vals => setChildDev(prev => ({ ...prev, [p.id]: { ...(prev[p.id] || {}), ...vals } }))}
                />
              </div>
            ))}
            {validProviders.length === 0 && (
              <div className="alert alert--warning">
                You haven't named any providers yet. Please go back and add at least one provider.
              </div>
            )}
          </div>
        )}

        {/* ── Step 5: Meets Parents' Needs ──────────────────────────────────── */}
        {step === 5 && (
          <SurveySection
            questions={meetsNeedsQuestions}
            answers={meetsNeeds}
            setAnswers={setMeetsNeeds}
          />
        )}

        {/* ── Step 6: Parent Emotional State ────────────────────────────────── */}
        {step === 6 && (
          <div>
            <div className="alert alert--warning" style={{ marginBottom: '1.25rem' }}>
              <strong>⚠ Placeholder questions</strong> — These will be replaced with a validated instrument once selected.
            </div>
            <SurveySection
              questions={parentEmotionalQuestions}
              answers={parentEmotional}
              setAnswers={setParentEmotional}
            />
          </div>
        )}

        {/* ── Step 7: Child Emotional State ─────────────────────────────────── */}
        {step === 7 && (
          <div>
            <div className="alert alert--warning" style={{ marginBottom: '1.25rem' }}>
              <strong>⚠ Placeholder questions</strong> — These will be replaced with a validated instrument once selected.
            </div>
            <SurveySection
              questions={childEmotionalQuestions}
              answers={childEmotional}
              setAnswers={setChildEmotional}
            />
          </div>
        )}

        {/* ── Step 8: Parent Cognition ──────────────────────────────────────── */}
        {step === 8 && (
          <div>
            <div className="alert alert--warning" style={{ marginBottom: '1.25rem' }}>
              <strong>⚠ Placeholder questions</strong> — These will be replaced with a validated instrument once selected.
            </div>
            <SurveySection
              questions={parentCognitionQuestions}
              answers={parentCognition}
              setAnswers={setParentCognition}
            />
          </div>
        )}

        {/* ── Step 9: Child Cognition ───────────────────────────────────────── */}
        {step === 9 && (
          <div>
            <div className="alert alert--warning" style={{ marginBottom: '1.25rem' }}>
              <strong>⚠ Placeholder questions</strong> — These will be replaced with a validated instrument once selected.
            </div>
            <SurveySection
              questions={childCognitionQuestions}
              answers={childCognition}
              setAnswers={setChildCognition}
            />
          </div>
        )}

        {/* ── Step 10: Review & Submit ───────────────────────────────────────── */}
        {step === 10 && (
          <div>
            <div className="alert alert--success" style={{ marginBottom: '1.25rem' }}>
              You've completed all sections! Please review your answers below, then click Submit.
            </div>

            <div className="card">
              <h3 className="section__title">Your Providers</h3>
              {validProviders.length === 0
                ? <p className="text-muted text-sm">No providers entered.</p>
                : validProviders.map(p => (
                    <div key={p.id} className="flex items-center" style={{ gap: '.5rem', marginBottom: '.375rem' }}>
                      <span className="provider-color-dot" style={{ backgroundColor: p.color }} />
                      <span>{p.name}</span>
                      {p.type && <span className="badge badge--gray">{PROVIDER_TYPES.find(t => t.value === p.type)?.label}</span>}
                    </div>
                  ))
              }
            </div>

            <div className="card">
              <h3 className="section__title">Demographics Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.375rem .75rem', fontSize: '.875rem', color: 'var(--gray-700)' }}>
                {Object.entries(demographics).filter(([,v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => (
                  <div key={k}>
                    <span className="text-muted">{k.replace(/_/g, ' ')}: </span>
                    <strong>{Array.isArray(v) ? v.join(', ') : String(v)}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="alert alert--info">
              Once you submit, you'll be directed to complete your first weekly check-in.
            </div>
          </div>
        )}

      </div>

      {/* Navigation buttons */}
      <div className={`btn-row btn-row--${step === 0 ? 'right' : 'spread'}`}>
        {step > 0 && (
          <button type="button" className="btn btn--secondary" onClick={goBack}>
            ← Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            className="btn btn--primary btn--lg"
            onClick={goNext}
            disabled={step === 1 && validProviders.length === 0}
          >
            {step === 1 && validProviders.length === 0 ? 'Add at least one provider' : 'Next →'}
          </button>
        ) : (
          <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
            Submit Enrollment ✓
          </button>
        )}
      </div>
    </div>
  )
}
