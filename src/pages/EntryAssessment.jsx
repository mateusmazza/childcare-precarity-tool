import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ProgressStepper from '../components/layout/ProgressStepper'
import SurveyQuestion  from '../components/survey/SurveyQuestion'
import {
  demographicsQuestions,
  affordabilityQuestions,
  reasonableEffortQuestions,
  childDevelopmentQuestions,
  meetsNeedsQuestions,
  parentCognitionQuestions,
  childCognitionQuestions,
  PROVIDER_TYPES,
  PROVIDER_COLORS,
} from '../data/questions'
import {
  getParticipant,
  createParticipant,
  saveEntryAssessmentSection,
  saveProviders,
  completeEntryAssessment,
} from '../utils/storage'

/**
 * Entry Assessment (Instrument 1)
 *
 * Expected URL: /entry?pid=P001
 * Redirects to /consent?pid=P001 if consent has not been given yet.
 */

const STEPS = [
  'Demographics',
  'Your Providers',
  'Affordability',
  'Access & Effort',
  'Child Development',
  'Meets Your Needs',
  'Parent Cognition',
  'Child Cognition',
  'Submit',
]

function newProvider(index) {
  return {
    id:    `prov_${Date.now()}_${index}`,
    name:  index === 0 ? 'Myself' : '',
    type:  index === 0 ? 'parent_self' : '',
    color: PROVIDER_COLORS[index % PROVIDER_COLORS.length],
  }
}

function SurveySection({ questions, answers, setAnswers, filterConditional }) {
  const visible = filterConditional
    ? questions.filter(q => {
        if (!q.conditional) return true
        return answers[q.conditional.id] === q.conditional.value
      })
    : questions

  return (
    <>
      {visible.map(q => (
        <SurveyQuestion
          key={q.id}
          question={q}
          value={answers[q.id]}
          allAnswers={answers}
          onChange={val => setAnswers({ ...answers, [q.id]: val })}
        />
      ))}
    </>
  )
}

export default function EntryAssessment() {
  const navigate       = useNavigate()
  const [params]       = useSearchParams()
  const pid            = params.get('pid')
  const existingParticipant = pid ? getParticipant(pid) : null
  const existingEntry = existingParticipant?.entryAssessment || {}

  const [step, setStep]                     = useState(0)
  const [demographics, setDemographics]     = useState(existingEntry.demographics || {})
  const [providers, setProviders]           = useState(existingParticipant?.providers?.length ? existingParticipant.providers : [newProvider(0)])
  const [affordability, setAffordability]   = useState(existingEntry.affordability || {})
  const [effort, setEffort]                 = useState(existingEntry.effort || {})
  const [childDev, setChildDev]             = useState(existingEntry.childDev || {})
  const [meetsNeeds, setMeetsNeeds]         = useState(existingEntry.meetsNeeds || {})
  const [parentCognition, setParentCognition] = useState(existingEntry.parentCognition || {})
  const [childCognition, setChildCognition] = useState(existingEntry.childCognition || {})

  useEffect(() => {
    if (!pid) return

    // Auto-create participant if needed
    let p = getParticipant(pid)
    if (!p) p = createParticipant(pid)

    // Redirect to consent if not yet given
    if (!p.consentGiven) {
      navigate(`/consent?pid=${pid}`)
      return
    }
  }, [navigate, pid])

  // Guard — missing pid
  if (!pid) {
    return (
      <div className="container page">
        <div className="no-pid">
          <p className="no-pid__title">No participant link found</p>
          <p className="no-pid__body">
            Please use the personal study link provided by the research team.
            If you need help, contact{' '}
            <a href="mailto:mmmazzaferro@gmail.com">the research team</a>.
          </p>
        </div>
      </div>
    )
  }

  // ── Provider management ──────────────────────────────────────────────────

  function addProvider()              { setProviders(prev => [...prev, newProvider(prev.length)]) }
  function updateProvider(id, f, v)   { setProviders(prev => prev.map(p => p.id === id ? { ...p, [f]: v } : p)) }
  function removeProvider(id)         { setProviders(prev => prev.length > 1 ? prev.filter(p => p.id !== id) : prev) }

  // ── Autosave ─────────────────────────────────────────────────────────────

  function saveCurrentStep() {
    switch (step) {
      case 0:  saveEntryAssessmentSection(pid, 'demographics',    demographics);    break
      case 1:  saveProviders(pid, providers);                                        break
      case 2:  saveEntryAssessmentSection(pid, 'affordability',   affordability);   break
      case 3:  saveEntryAssessmentSection(pid, 'effort',          effort);          break
      case 4:  saveEntryAssessmentSection(pid, 'childDev',        childDev);        break
      case 5:  saveEntryAssessmentSection(pid, 'meetsNeeds',      meetsNeeds);      break
      case 6:  saveEntryAssessmentSection(pid, 'parentCognition', parentCognition); break
      case 7:  saveEntryAssessmentSection(pid, 'childCognition',  childCognition);  break
      default: break
    }
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
    completeEntryAssessment(pid)
    navigate(`/thank-you?type=entry&pid=${pid}`)
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const validProviders = providers.filter(p => p.name.trim())

  return (
    <div className="container page">
      <div className="instrument-badge">
        <span className="instrument-badge__dot" />
        Instrument 1 of 3 — Enrollment Survey
      </div>

      <h1 className="page__title">Enrollment Survey</h1>
      <p className="page__subtitle">
        Step {step + 1} of {STEPS.length}: <strong>{STEPS[step]}</strong>
      </p>

      <ProgressStepper steps={STEPS} current={step} />

      <div style={{ marginTop: '1.75rem' }}>

        {/* Step 0: Demographics */}
        {step === 0 && (
          <div>
            <div className="alert alert--info">
              All questions are optional unless marked with an asterisk (*).
              You may skip any question you prefer not to answer.
            </div>
            <SurveySection
              questions={demographicsQuestions}
              answers={demographics}
              setAnswers={setDemographics}
              filterConditional
            />
          </div>
        )}

        {/* Step 1: Provider Roster */}
        {step === 1 && (
          <div>
            <div className="alert alert--info">
              List everyone who regularly cares for your child — family members,
              childcare centers, babysitters, and yourself. You'll use these to
              fill in the weekly calendar.
            </div>
            {providers.map((p, i) => (
              <div key={p.id} className="provider-card">
                <div className="provider-card__header">
                  <div className="flex items-center" style={{ gap: '.5rem' }}>
                    <span className="provider-color-dot" style={{ backgroundColor: p.color }} />
                    <strong style={{ fontSize: '.875rem', color: 'var(--ink-1)' }}>Provider {i + 1}</strong>
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
                  <label className="form-label">
                    Provider name or label <span style={{ color: 'var(--red)' }}>*</span>
                  </label>
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

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Color on your calendar</label>
                  <div style={{ display: 'flex', gap: '.375rem', flexWrap: 'wrap' }}>
                    {PROVIDER_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => updateProvider(p.id, 'color', c)}
                        style={{
                          width: 26, height: 26, borderRadius: '50%',
                          backgroundColor: c,
                          border: p.color === c ? '3px solid var(--ink-1)' : '2px solid transparent',
                          cursor: 'pointer', transition: 'border-color .12s',
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
              className="btn btn--secondary btn--sm"
              onClick={addProvider}
              style={{ marginTop: '.5rem' }}
            >
              + Add another provider
            </button>
          </div>
        )}

        {/* Step 2: Affordability */}
        {step === 2 && (
          <SurveySection
            questions={affordabilityQuestions}
            answers={affordability}
            setAnswers={setAffordability}
            filterConditional
          />
        )}

        {/* Step 3: Reasonable Effort */}
        {step === 3 && (
          <SurveySection
            questions={reasonableEffortQuestions}
            answers={effort}
            setAnswers={setEffort}
          />
        )}

        {/* Step 4: Child Development (per provider) */}
        {step === 4 && (
          <div>
            <div className="alert alert--info">
              The following questions ask about each of your childcare providers separately.
            </div>
            {validProviders.map(p => (
              <div key={p.id} style={{ marginBottom: '2rem' }}>
                <h3 className="section__title" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <span className="provider-color-dot" style={{ backgroundColor: p.color }} />
                  {p.name}
                </h3>
                <SurveySection
                  questions={childDevelopmentQuestions}
                  answers={childDev[p.id] || {}}
                  setAnswers={vals =>
                    setChildDev(prev => ({ ...prev, [p.id]: { ...(prev[p.id] || {}), ...vals } }))
                  }
                />
              </div>
            ))}
            {validProviders.length === 0 && (
              <div className="alert alert--warning">
                No providers found. Please go back and add at least one.
              </div>
            )}
          </div>
        )}

        {/* Step 5: Meets Parents' Needs */}
        {step === 5 && (
          <SurveySection
            questions={meetsNeedsQuestions}
            answers={meetsNeeds}
            setAnswers={setMeetsNeeds}
          />
        )}

        {/* Step 6: Parent Cognition */}
        {step === 6 && (
          <div>
            <div className="alert alert--warning">
              <strong>Placeholder questions</strong> — These will be replaced with a
              validated instrument once selected.
            </div>
            <SurveySection
              questions={parentCognitionQuestions}
              answers={parentCognition}
              setAnswers={setParentCognition}
            />
          </div>
        )}

        {/* Step 7: Child Cognition */}
        {step === 7 && (
          <div>
            <div className="alert alert--warning">
              <strong>Placeholder questions</strong> — To be replaced with validated instrument.
            </div>
            <SurveySection
              questions={childCognitionQuestions}
              answers={childCognition}
              setAnswers={setChildCognition}
            />
          </div>
        )}

        {/* Step 8: Submit */}
        {step === 8 && (
          <div>
            <div className="alert alert--success">
              You've completed all sections. Click Submit to finish enrollment.
            </div>

            <div className="alert alert--info">
              Once you submit, your enrollment is complete. You'll receive weekly
              check-in reminders from the research team.
            </div>
          </div>
        )}

      </div>

      {/* Navigation */}
      <div className={`btn-row btn-row--${step === 0 ? 'right' : 'spread'}`}>
        {step > 0 && (
          <button type="button" className="btn btn--secondary" onClick={goBack}>
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            className="btn btn--primary btn--lg"
            onClick={goNext}
            disabled={step === 1 && validProviders.length === 0}
          >
            {step === 1 && validProviders.length === 0
              ? 'Add at least one provider first'
              : 'Continue'}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--primary btn--lg"
            onClick={handleSubmit}
          >
            Submit enrollment
          </button>
        )}
      </div>
    </div>
  )
}
