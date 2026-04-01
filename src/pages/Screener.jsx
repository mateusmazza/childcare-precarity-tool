import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { screenerQuestions } from '../data/questions'
import {
  createParticipant,
  generateParticipantId,
  saveScreener,
  completeScreener,
  saveParticipant,
  getParticipant,
} from '../utils/storage'

/**
 * Screener — Instrument 0 (public eligibility questionnaire)
 *
 * Accessible at / (no pid required — participants arrive organically).
 * On successful submission, auto-generates a participant ID and stores:
 *   - participant.screener.eligibilityAnswers  (research data, included in exports)
 *   - participant.contactInfo                  (PII — never exported, researcher-only)
 */

// All 4 eligibility criteria require 'yes' to pass
const ELIGIBLE_VALUE = 'yes'

function EligibilityQuestion({ question, value, onChange }) {
  return (
    <div className="form-group">
      <label className="form-label">{question.label}</label>
      <div className="choice-group" role="radiogroup">
        {question.options.map(opt => (
          <label
            key={opt.value}
            className={`choice-item${value === opt.value ? ' choice-item--selected' : ''}`}
          >
            <input
              type="radio"
              name={question.id}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            <span className="choice-item__label">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default function Screener() {
  const [params]      = useSearchParams()
  const preloadedPid  = params.get('pid') // optional — allows researcher to pre-assign a PID

  const [step, setStep]       = useState(0)   // 0: eligibility  1: contact  2: confirmation
  const [ineligible, setIneligible] = useState(false)
  const [answers, setAnswers] = useState({})
  const [contact, setContact] = useState({ email: '', phone: '' })
  const [pid, setPid]         = useState(null)

  const allAnswered = screenerQuestions.every(q => answers[q.id] !== undefined)
  const isEligible  = screenerQuestions.every(q => answers[q.id] === ELIGIBLE_VALUE)

  function handleCheckEligibility() {
    if (!allAnswered) return
    if (!isEligible) {
      setIneligible(true)
    } else {
      setStep(1)
    }
  }

  function handleSubmit() {
    const newPid = preloadedPid || generateParticipantId()

    // Create participant record if it doesn't exist yet
    if (!getParticipant(newPid)) createParticipant(newPid)

    // Save eligibility answers as research data
    saveScreener(newPid, { eligibilityAnswers: answers })

    // Save contact info in a separate field — never included in CSV exports
    if (contact.email.trim() || contact.phone.trim()) {
      saveParticipant(newPid, {
        contactInfo: {
          email:       contact.email.trim(),
          phone:       contact.phone.trim(),
          collectedAt: new Date().toISOString(),
        },
      })
    }

    completeScreener(newPid)
    setPid(newPid)
    setStep(2)
  }

  // ── Ineligible screen ──────────────────────────────────────────────────────

  if (ineligible) {
    return (
      <div>
        <div className="hero">
          <p className="hero__eyebrow">Stanford Graduate School of Education</p>
          <h1 className="hero__title">Care<span>mometer</span></h1>
        </div>
        <div className="container page">
          <div className="alert alert--warning" style={{ marginTop: '1rem' }}>
            <strong>Thank you for your interest.</strong>
          </div>
          <div className="card" style={{ marginTop: '1rem' }}>
            <p>
              Based on your responses, you do not meet the current eligibility criteria
              for this study at this time.
            </p>
            <p style={{ marginTop: '.75rem', fontSize: '.9rem', color: 'var(--ink-3)' }}>
              Eligibility criteria: you must have a child younger than 5, currently be on a
              childcare waitlist, be 18 or older, and be comfortable completing surveys in English.
              If your situation changes, you may qualify in the future.
            </p>
            <a
              href="mailto:mmmazzaferro@gmail.com"
              className="btn btn--secondary"
              style={{ marginTop: '1rem', display: 'inline-block' }}
            >
              Contact the research team
            </a>
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            style={{ marginTop: '1rem' }}
            onClick={() => { setIneligible(false); setAnswers({}) }}
          >
            Start over
          </button>
        </div>
      </div>
    )
  }

  // ── Main flow ──────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Hero */}
      <div className="hero">
        <p className="hero__eyebrow">Stanford Graduate School of Education</p>
        <h1 className="hero__title">Care<span>mometer</span></h1>
        <p className="hero__subtitle">
          A research study on childcare precarity — how families find, afford,
          and maintain childcare arrangements over time.
        </p>
      </div>

      <div className="container page">

        {/* ── Step 0: Eligibility questions ─────────────────────────────── */}
        {step === 0 && (
          <div>
            <div className="instrument-badge">
              <span className="instrument-badge__dot" />
              Eligibility Screening
            </div>

            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--ink-1)', marginBottom: '.375rem' }}>
              Do you qualify?
            </h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '.9375rem' }}>
              Please answer all four questions below to check your eligibility.
              All questions are required.
            </p>

            {screenerQuestions.map(q => (
              <EligibilityQuestion
                key={q.id}
                question={q}
                value={answers[q.id]}
                onChange={val => setAnswers(prev => ({ ...prev, [q.id]: val }))}
              />
            ))}

            <div className="btn-row btn-row--right" style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn--primary btn--lg"
                onClick={handleCheckEligibility}
                disabled={!allAnswered}
              >
                {allAnswered ? 'Check eligibility' : 'Answer all questions to continue'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1: Contact information ────────────────────────────────── */}
        {step === 1 && (
          <div>
            <div className="alert alert--success">
              <strong>You are eligible to participate!</strong>{' '}
              Please share your contact information so the research team can reach you about next steps.
            </div>

            <div className="card card--accent" style={{ marginTop: '1.25rem', marginBottom: '1.5rem' }}>
              <strong style={{ fontSize: '.9375rem' }}>Privacy notice</strong>
              <p style={{ marginTop: '.375rem', fontSize: '.875rem', lineHeight: 1.65 }}>
                Your contact information will only be used to reach you about this study.
                It is stored separately from your research responses and will{' '}
                <strong>never</strong> appear in anonymized data exports or be shared with
                third parties. Providing this information is optional but recommended so
                we can send you your participation link.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="screener-email">
                Email address
              </label>
              <input
                id="screener-email"
                type="email"
                className="form-input"
                value={contact.email}
                onChange={e => setContact(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
                style={{ maxWidth: '360px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="screener-phone">
                Phone number
              </label>
              <input
                id="screener-phone"
                type="tel"
                className="form-input"
                value={contact.phone}
                onChange={e => setContact(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 000-0000"
                style={{ maxWidth: '360px' }}
              />
            </div>

            <div className="btn-row btn-row--spread" style={{ marginTop: '1.5rem' }}>
              <button type="button" className="btn btn--secondary" onClick={() => setStep(0)}>
                Back
              </button>
              <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
                Submit
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Confirmation ───────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <div className="alert alert--success">
              <strong>Thank you for signing up!</strong>{' '}
              The research team will be in touch soon.
            </div>

            <div className="card" style={{ marginTop: '1.25rem' }}>
              <h3 className="section__title">What happens next?</h3>
              <p style={{ fontSize: '.9375rem', lineHeight: 1.7 }}>
                A member of the research team will contact you within a few business days
                to discuss the study, answer any questions, and send you your personal
                participation links.
              </p>

              {pid && (
                <div style={{
                  marginTop: '1.25rem',
                  padding: '.875rem 1rem',
                  background: 'var(--stone-2)',
                  borderRadius: 'var(--radius)',
                  textAlign: 'center',
                }}>
                  <p className="text-sm text-muted" style={{ marginBottom: '.375rem' }}>Your study ID</p>
                  <div style={{ fontFamily: 'monospace', fontSize: '1.375rem', fontWeight: 700, letterSpacing: '.05em', color: 'var(--ink-1)' }}>
                    {pid}
                  </div>
                  <p className="text-sm text-muted" style={{ marginTop: '.375rem' }}>
                    Please save this ID. The research team may ask for it.
                  </p>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
              <a href="mailto:mmmazzaferro@gmail.com" className="btn btn--secondary">
                Contact the research team
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
