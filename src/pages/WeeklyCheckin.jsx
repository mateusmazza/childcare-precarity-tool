import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ProgressStepper  from '../components/layout/ProgressStepper'
import SurveyQuestion   from '../components/survey/SurveyQuestion'
import CalendarPainter  from '../components/calendar/CalendarPainter'
import { weeklyCheckinQuestions, PROVIDER_COLORS } from '../data/questions'
import {
  getParticipant,
  saveWeeklyCheckin,
  completeWeeklyCheckin,
  getWeeklyCheckin,
  saveParticipant,
  getCurrentWeekId,
  getPast7Days,
} from '../utils/storage'
import { computeAllMetrics } from '../utils/metrics'

/**
 * Weekly Check-in (Instrument 2)
 *
 * Expected URL: /checkin?pid=P001
 * Redirects to /entry?pid=P001 if enrollment has not been completed.
 */

const STEPS = ['Calendar', 'Quick Survey', 'Submit']

function newProvider(index, count) {
  return {
    id:    `prov_${Date.now()}_${count + index}`,
    name:  '',
    type:  '',
    color: PROVIDER_COLORS[(count + index) % PROVIDER_COLORS.length],
  }
}

export default function WeeklyCheckin() {
  const navigate  = useNavigate()
  const [params]  = useSearchParams()
  const pid       = params.get('pid')

  const weekId = getCurrentWeekId()
  const days   = getPast7Days()

  const [step, setStep]                     = useState(0)
  const [calendarData, setCalendarData]     = useState({})
  const [providers, setProviders]           = useState([])
  const [surveyAnswers, setSurveyAnswers]   = useState({})
  const [showProviderEdit, setShowProviderEdit] = useState(false)
  const [priorCalendar, setPriorCalendar]   = useState(null)

  // Guard — missing pid
  if (!pid) {
    return (
      <div className="container page">
        <div className="no-pid">
          <p className="no-pid__title">No participant link found</p>
          <p className="no-pid__body">
            Please use the weekly check-in link provided by the research team.
            If you need help, contact{' '}
            <a href="mailto:mmmazzaferro@gmail.com">the research team</a>.
          </p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    const p = getParticipant(pid)
    if (!p) { navigate(`/consent?pid=${pid}`); return }
    if (!p.entryAssessment?.completedAt) { navigate(`/entry?pid=${pid}`); return }

    // Load current week's data
    const saved = getWeeklyCheckin(pid, weekId)
    if (saved?.calendarData)  setCalendarData(saved.calendarData)
    if (saved?.surveyAnswers) setSurveyAnswers(saved.surveyAnswers)

    // Providers: this week's snapshot → participant record
    const providerSource = saved?.providers || p.providers || []
    setProviders(providerSource.length > 0 ? providerSource : [])

    // Prior week for instability metric
    const allCheckins = (p.weeklyCheckins || [])
      .filter(c => c.id !== weekId && c.completedAt)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    if (allCheckins.length > 0) setPriorCalendar(allCheckins[0].calendarData || null)
  }, [pid])

  // ── Autosave ─────────────────────────────────────────────────────────────

  function saveProgress() {
    saveWeeklyCheckin(pid, weekId, {
      weekStartDate: days[0],
      calendarData,
      providers,
      surveyAnswers,
    })
  }

  function goNext()  { saveProgress(); setStep(s => s + 1); window.scrollTo(0, 0) }
  function goBack()  { saveProgress(); setStep(s => s - 1); window.scrollTo(0, 0) }

  // ── Provider editing ──────────────────────────────────────────────────────

  function addProvider()            { setProviders(prev => [...prev, newProvider(0, prev.length)]) }
  function updateProvider(id, f, v) { setProviders(prev => prev.map(p => p.id === id ? { ...p, [f]: v } : p)) }
  function removeProvider(id)       { setProviders(prev => prev.length > 1 ? prev.filter(p => p.id !== id) : prev) }

  // ── Submit ────────────────────────────────────────────────────────────────

  function handleSubmit() {
    const metrics = computeAllMetrics(calendarData, priorCalendar)
    saveWeeklyCheckin(pid, weekId, {
      weekStartDate: days[0],
      calendarData,
      providers,
      surveyAnswers,
      metrics,
    })
    completeWeeklyCheckin(pid, weekId)
    saveParticipant(pid, { providers })
    navigate(`/thank-you?type=checkin&pid=${pid}`)
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  const validProviders = providers.filter(p => p.name.trim())
  const surveyQs       = weeklyCheckinQuestions.filter(q => q.id !== 'provider_changes')

  return (
    <div className="container page">
      <div className="instrument-badge">
        <span className="instrument-badge__dot" />
        Instrument 2 of 3 — Weekly Check-in
      </div>

      <h1 className="page__title">Weekly Check-in</h1>
      <p className="page__subtitle">
        Week of {days[0]} — Step {step + 1} of {STEPS.length}: <strong>{STEPS[step]}</strong>
      </p>

      <ProgressStepper steps={STEPS} current={step} />

      <div style={{ marginTop: '1.75rem' }}>

        {/* Step 0: Calendar */}
        {step === 0 && (
          <div>
            <div className="card card--accent" style={{ marginBottom: '1.25rem' }}>
              <strong>Instructions: </strong>
              Tap or drag on the calendar to paint which provider cared for
              your child during each hour. Use the legend below to switch providers.
              Tap a filled cell again, or select Eraser, to clear it.
            </div>

            {/* Provider change check */}
            <div className="card" style={{ marginBottom: '1rem' }}>
              <SurveyQuestion
                question={weeklyCheckinQuestions.find(q => q.id === 'provider_changes')}
                value={surveyAnswers.provider_changes}
                onChange={val => {
                  setSurveyAnswers(prev => ({ ...prev, provider_changes: val }))
                  if (val === 'yes') setShowProviderEdit(true)
                }}
              />
              {surveyAnswers.provider_changes === 'yes' && (
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  style={{ marginTop: '.5rem' }}
                  onClick={() => setShowProviderEdit(v => !v)}
                >
                  {showProviderEdit ? 'Hide editor' : 'Edit providers'}
                </button>
              )}
            </div>

            {/* Provider editor */}
            {showProviderEdit && (
              <div className="card" style={{ marginBottom: '1rem' }}>
                <h3 className="section__title">Update your providers</h3>
                {providers.map((p, i) => (
                  <div key={p.id} className="provider-card">
                    <div className="provider-card__header">
                      <div className="flex items-center" style={{ gap: '.5rem' }}>
                        <span className="provider-color-dot" style={{ backgroundColor: p.color }} />
                        <strong style={{ fontSize: '.875rem' }}>Provider {i + 1}</strong>
                      </div>
                      {providers.length > 1 && (
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          style={{ color: 'var(--red)' }}
                          onClick={() => removeProvider(p.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={p.name}
                        onChange={e => updateProvider(p.id, 'name', e.target.value)}
                        placeholder="Provider name"
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '.375rem', flexWrap: 'wrap' }}>
                      {PROVIDER_COLORS.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updateProvider(p.id, 'color', c)}
                          style={{
                            width: 24, height: 24, borderRadius: '50%',
                            backgroundColor: c,
                            border: p.color === c ? '3px solid var(--ink-1)' : '2px solid transparent',
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  style={{ marginTop: '.375rem' }}
                  onClick={addProvider}
                >
                  + Add provider
                </button>
              </div>
            )}

            {validProviders.length === 0 ? (
              <div className="alert alert--warning">
                Please add at least one provider before filling the calendar.
              </div>
            ) : (
              <CalendarPainter
                days={days}
                providers={validProviders}
                data={calendarData}
                onChange={setCalendarData}
              />
            )}
          </div>
        )}

        {/* Step 1: Survey */}
        {step === 1 && (
          <div>
            {surveyQs.map(q => (
              <SurveyQuestion
                key={q.id}
                question={q}
                value={surveyAnswers[q.id]}
                onChange={val => setSurveyAnswers(prev => ({ ...prev, [q.id]: val }))}
              />
            ))}
          </div>
        )}

        {/* Step 2: Submit */}
        {step === 2 && (
          <div>
            <div className="alert alert--success">
              You've completed this week's check-in. Click Submit to save your responses.
            </div>

            <div className="alert alert--info">
              Once you submit, your responses for this week will be saved.
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
            disabled={step === 0 && validProviders.length === 0}
          >
            {step === 0 && validProviders.length === 0 ? 'Add a provider first' : 'Continue'}
          </button>
        ) : (
          <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
            Submit check-in
          </button>
        )}
      </div>
    </div>
  )
}
