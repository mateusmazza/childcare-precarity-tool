import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ProgressStepper from '../components/layout/ProgressStepper'
import SurveyQuestion  from '../components/survey/SurveyQuestion'
import {
  demographicsQuestions,
  affordabilityQuestions,
  reasonableEffortQuestions,
  meetsNeedsQuestions,
  parentEmotionalQuestions,
  childEmotionalQuestions,
  parentCognitionQuestions,
  childCognitionQuestions,
} from '../data/questions'
import {
  getParticipant,
  saveExitAssessmentSection,
  completeExitAssessment,
} from '../utils/storage'

/**
 * Exit Assessment (Instrument 3)
 *
 * Expected URL: /exit?pid=P001
 * Redirects if the participant has not completed enrollment.
 */

const STEPS = [
  'Current Situation',
  'Affordability',
  'Access & Effort',
  'Meets Your Needs',
  'Parent Well-being',
  'Child Well-being',
  'Parent Cognition',
  'Child Cognition',
  'Submit',
]

// A short subset of demographics for the exit survey
const exitDemographics = demographicsQuestions.filter(q =>
  ['employment_status', 'household_income', 'waitlist_status', 'waitlist_count', 'housing_stability'].includes(q.id)
)

function SurveySection({ questions, answers, setAnswers }) {
  return (
    <>
      {questions.map(q => (
        <SurveyQuestion
          key={q.id}
          question={q}
          value={answers[q.id]}
          onChange={val => setAnswers(prev => ({ ...prev, [q.id]: val }))}
        />
      ))}
    </>
  )
}

export default function ExitAssessment() {
  const navigate  = useNavigate()
  const [params]  = useSearchParams()
  const pid       = params.get('pid')

  const [step, setStep]                       = useState(0)
  const [currentSituation, setCurrentSituation] = useState({})
  const [affordability, setAffordability]     = useState({})
  const [effort, setEffort]                   = useState({})
  const [meetsNeeds, setMeetsNeeds]           = useState({})
  const [parentEmotional, setParentEmotional] = useState({})
  const [childEmotional, setChildEmotional]   = useState({})
  const [parentCognition, setParentCognition] = useState({})
  const [childCognition, setChildCognition]   = useState({})

  // Guard
  if (!pid) {
    return (
      <div className="container page">
        <div className="no-pid">
          <p className="no-pid__title">No participant link found</p>
          <p className="no-pid__body">
            Please use the exit survey link provided by the research team.
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

    // Rehydrate saved exit data
    const exit = p.exitAssessment || {}
    if (exit.currentSituation) setCurrentSituation(exit.currentSituation)
    if (exit.affordability)    setAffordability(exit.affordability)
    if (exit.effort)           setEffort(exit.effort)
    if (exit.meetsNeeds)       setMeetsNeeds(exit.meetsNeeds)
    if (exit.parentEmotional)  setParentEmotional(exit.parentEmotional)
    if (exit.childEmotional)   setChildEmotional(exit.childEmotional)
    if (exit.parentCognition)  setParentCognition(exit.parentCognition)
    if (exit.childCognition)   setChildCognition(exit.childCognition)
  }, [pid])

  function saveCurrentStep() {
    switch (step) {
      case 0: saveExitAssessmentSection(pid, 'currentSituation', currentSituation); break
      case 1: saveExitAssessmentSection(pid, 'affordability',    affordability);    break
      case 2: saveExitAssessmentSection(pid, 'effort',           effort);           break
      case 3: saveExitAssessmentSection(pid, 'meetsNeeds',       meetsNeeds);       break
      case 4: saveExitAssessmentSection(pid, 'parentEmotional',  parentEmotional);  break
      case 5: saveExitAssessmentSection(pid, 'childEmotional',   childEmotional);   break
      case 6: saveExitAssessmentSection(pid, 'parentCognition',  parentCognition);  break
      case 7: saveExitAssessmentSection(pid, 'childCognition',   childCognition);   break
      default: break
    }
  }

  function goNext()  { saveCurrentStep(); setStep(s => s + 1); window.scrollTo(0, 0) }
  function goBack()  { saveCurrentStep(); setStep(s => s - 1); window.scrollTo(0, 0) }

  function handleSubmit() {
    saveCurrentStep()
    completeExitAssessment(pid)
    navigate(`/thank-you?type=exit&pid=${pid}`)
  }

  return (
    <div className="container page">
      <div className="instrument-badge">
        <span className="instrument-badge__dot" />
        Instrument 3 of 3 — Exit Assessment
      </div>

      <h1 className="page__title">Exit Assessment</h1>
      <p className="page__subtitle">
        Step {step + 1} of {STEPS.length}: <strong>{STEPS[step]}</strong>
      </p>

      <div className="alert alert--info" style={{ marginBottom: '1.25rem' }}>
        This is the final survey of the study. Thank you for your participation.
      </div>

      <ProgressStepper steps={STEPS} current={step} />

      <div style={{ marginTop: '1.75rem' }}>
        {step === 0 && (
          <SurveySection
            questions={exitDemographics}
            answers={currentSituation}
            setAnswers={setCurrentSituation}
          />
        )}
        {step === 1 && (
          <SurveySection
            questions={affordabilityQuestions}
            answers={affordability}
            setAnswers={setAffordability}
          />
        )}
        {step === 2 && (
          <SurveySection
            questions={reasonableEffortQuestions}
            answers={effort}
            setAnswers={setEffort}
          />
        )}
        {step === 3 && (
          <SurveySection
            questions={meetsNeedsQuestions}
            answers={meetsNeeds}
            setAnswers={setMeetsNeeds}
          />
        )}
        {step === 4 && (
          <div>
            <div className="alert alert--warning">
              <strong>Placeholder questions</strong> — To be replaced with a validated instrument.
            </div>
            <SurveySection
              questions={parentEmotionalQuestions}
              answers={parentEmotional}
              setAnswers={setParentEmotional}
            />
          </div>
        )}
        {step === 5 && (
          <div>
            <div className="alert alert--warning">
              <strong>Placeholder questions</strong> — To be replaced with a validated instrument.
            </div>
            <SurveySection
              questions={childEmotionalQuestions}
              answers={childEmotional}
              setAnswers={setChildEmotional}
            />
          </div>
        )}
        {step === 6 && (
          <div>
            <div className="alert alert--warning">
              <strong>Placeholder questions</strong> — To be replaced with a validated instrument.
            </div>
            <SurveySection
              questions={parentCognitionQuestions}
              answers={parentCognition}
              setAnswers={setParentCognition}
            />
          </div>
        )}
        {step === 7 && (
          <div>
            <div className="alert alert--warning">
              <strong>Placeholder questions</strong> — To be replaced with a validated instrument.
            </div>
            <SurveySection
              questions={childCognitionQuestions}
              answers={childCognition}
              setAnswers={setChildCognition}
            />
          </div>
        )}
        {step === 8 && (
          <div>
            <div className="alert alert--success">
              You've completed all sections of the exit assessment. Click Submit to finish.
            </div>
            <div className="card">
              <p style={{ color: 'var(--ink-2)', lineHeight: 1.75, fontSize: '.9375rem' }}>
                Thank you for your participation in this study. Your responses will help us
                better understand and measure childcare precarity for families. The research
                team may follow up with you at a later date.
              </p>
              <p style={{ marginTop: '.75rem', color: 'var(--ink-3)', fontSize: '.875rem' }}>
                Questions? Contact us at{' '}
                <a href="mailto:mmmazzaferro@gmail.com">mmmazzaferro@gmail.com</a>.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className={`btn-row btn-row--${step === 0 ? 'right' : 'spread'}`}>
        {step > 0 && (
          <button type="button" className="btn btn--secondary" onClick={goBack}>
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" className="btn btn--primary btn--lg" onClick={goNext}>
            Continue
          </button>
        ) : (
          <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
            Submit exit assessment
          </button>
        )}
      </div>
    </div>
  )
}
