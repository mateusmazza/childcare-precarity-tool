import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Welcome() {
  const { participant } = useApp()
  const navigate = useNavigate()

  return (
    <div>
      <div className="hero">
        <p className="hero__eyebrow">Stanford Graduate School of Education</p>
        <h1 className="hero__title">Caremometer</h1>
        <p className="hero__subtitle">
          Help us understand families' childcare experiences by completing a brief
          enrollment assessment and weekly check-ins about your childcare schedule.
        </p>
        <div className="hero__actions">
          {participant?.consentGiven ? (
            <button className="btn btn--white btn--lg" onClick={() => navigate('/checkin')}>
              Complete Weekly Check-in
            </button>
          ) : (
            <button className="btn btn--white btn--lg" onClick={() => navigate('/login')}>
              Participate in the Study
            </button>
          )}
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', marginBottom: '.5rem' }}>📅</div>
            <strong>Weekly Check-ins</strong>
            <p className="text-sm text-muted mt-1">
              A 5-minute weekly survey about your childcare schedule using an interactive calendar.
            </p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', marginBottom: '.5rem' }}>🔒</div>
            <strong>Private &amp; Anonymous</strong>
            <p className="text-sm text-muted mt-1">
              No personally identifying information is stored. Your data is used for research only.
            </p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', marginBottom: '.5rem' }}>🎓</div>
            <strong>Stanford Research</strong>
            <p className="text-sm text-muted mt-1">
              This study is conducted by researchers at the Stanford Graduate School of Education.
            </p>
          </div>
        </div>

        <div className="card card--blue">
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '.5rem' }}>What to expect</h2>
          <ul style={{ paddingLeft: '1.25rem', color: 'var(--gray-700)', lineHeight: 1.8, fontSize: '.9375rem' }}>
            <li><strong>Enrollment (~30 min):</strong> Answer questions about your background, childcare providers, and well-being.</li>
            <li><strong>Weekly check-ins (~5 min):</strong> Paint a calendar showing who cared for your child each hour last week.</li>
            <li><strong>Exit assessment (~30 min):</strong> A final survey at the end of the study period.</li>
          </ul>
        </div>

        <div className="text-center mt-3">
          <p className="text-sm text-muted">
            Questions about the study?{' '}
            <a href="mailto:mmmazzaferro@gmail.com">Contact us</a>
          </p>
        </div>
      </div>
    </div>
  )
}
