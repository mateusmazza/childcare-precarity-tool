import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { saveConsent } from '../utils/storage'

export default function Consent() {
  const { participant, refreshParticipant } = useApp()
  const navigate = useNavigate()
  const [agreed, setAgreed] = useState(false)

  if (!participant) {
    navigate('/login')
    return null
  }

  function handleConsent(e) {
    e.preventDefault()
    if (!agreed) return
    saveConsent()
    refreshParticipant()
    navigate('/enroll')
  }

  return (
    <div className="container page">
      <h1 className="page__title">Informed Consent</h1>
      <p className="page__subtitle">
        Please read the following information carefully before participating.
      </p>

      <div className="card" style={{ marginBottom: '1.5rem', lineHeight: 1.75, color: 'var(--gray-700)', fontSize: '.9375rem' }}>
        <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '1rem' }}>
          Caremometer — Measuring Childcare Precarity
        </h2>

        <p style={{ marginBottom: '1rem' }}>
          <strong>Principal Investigator:</strong> Mateus Mazzaferro, Stanford Graduate School of Education
        </p>

        <h3 style={{ fontWeight: 600, marginBottom: '.5rem' }}>Purpose</h3>
        <p style={{ marginBottom: '1rem' }}>
          The purpose of this study is to develop and test a measure of childcare precarity —
          the degree to which a family's childcare arrangements are unstable, unreliable,
          or misaligned with their needs. Your participation will help us understand how
          childcare insecurity affects families and inform better policy and support systems.
        </p>

        <h3 style={{ fontWeight: 600, marginBottom: '.5rem' }}>What you will do</h3>
        <ul style={{ paddingLeft: '1.25rem', marginBottom: '1rem' }}>
          <li>Complete a one-time enrollment survey (~30 minutes) about your childcare arrangements, background, and well-being.</li>
          <li>Complete a brief weekly check-in (~5 minutes) for several weeks, including an interactive calendar of your childcare schedule.</li>
          <li>Complete a final exit survey (~30 minutes) at the end of the study period.</li>
        </ul>

        <h3 style={{ fontWeight: 600, marginBottom: '.5rem' }}>Risks</h3>
        <p style={{ marginBottom: '1rem' }}>
          This study involves minimal risk. Some questions touch on sensitive topics such as
          income, housing, and family stress. You may skip any question you do not wish to answer.
        </p>

        <h3 style={{ fontWeight: 600, marginBottom: '.5rem' }}>Benefits</h3>
        <p style={{ marginBottom: '1rem' }}>
          You will not receive direct compensation for participating in this study. Your
          participation will contribute to research that may benefit families and policymakers
          in the future.
        </p>

        <h3 style={{ fontWeight: 600, marginBottom: '.5rem' }}>Confidentiality</h3>
        <p style={{ marginBottom: '1rem' }}>
          This is a research prototype and is not yet IRB-approved. Data is stored locally
          in your browser and is not transmitted to a server at this time. The research team
          will handle any data in accordance with Stanford University's research ethics guidelines
          once IRB approval is obtained.
        </p>

        <h3 style={{ fontWeight: 600, marginBottom: '.5rem' }}>Voluntary Participation</h3>
        <p>
          Your participation is completely voluntary. You may stop participating at any time
          without penalty. If you have questions about this study, please contact the research
          team at <a href="mailto:mmmazzaferro@gmail.com">mmmazzaferro@gmail.com</a>.
        </p>
      </div>

      <form onSubmit={handleConsent}>
        <div className="card">
          <label className="choice-item" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              style={{ marginTop: '.125rem' }}
            />
            <span className="choice-item__label">
              I have read the information above and I voluntarily agree to participate
              in this research study. I understand that I can withdraw at any time.
            </span>
          </label>
        </div>

        <div className="btn-row">
          <button type="button" className="btn btn--secondary" onClick={() => navigate('/')}>
            ← Back
          </button>
          <button type="submit" className="btn btn--primary btn--lg" disabled={!agreed}>
            I Agree — Begin Enrollment →
          </button>
        </div>
      </form>
    </div>
  )
}
