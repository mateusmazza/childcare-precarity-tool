// Simple inline SVG icons — no emoji
function IconCalendar() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="3" width="15" height="13.5" rx="2"/>
      <path d="M12 1.5v3M6 1.5v3M1.5 7.5h15"/>
    </svg>
  )
}
function IconLock() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8.25" width="12" height="8.25" rx="1.5"/>
      <path d="M6 8.25V5.25a3 3 0 0 1 6 0v3"/>
    </svg>
  )
}
function IconAcademic() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2.25L1.5 6 9 9.75 16.5 6 9 2.25z"/>
      <path d="M4.5 7.875v4.5a6 6 0 0 0 9 0v-4.5"/>
    </svg>
  )
}

export default function Welcome() {
  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="hero">
        <p className="hero__eyebrow">Stanford Graduate School of Education</p>
        <h1 className="hero__title">
          Care<span>mometer</span>
        </h1>
        <p className="hero__subtitle">
          A research study on childcare precarity — how families find, afford,
          and maintain childcare arrangements over time.
        </p>
        <div className="hero__actions">
          <a
            href="mailto:mmmazzaferro@gmail.com"
            className="btn btn--outline-white btn--lg"
          >
            Contact the research team
          </a>
        </div>
      </div>

      {/* ── About section ─────────────────────────────────────────────────── */}
      <div className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-card__icon"><IconCalendar /></div>
            <div className="feature-card__title">Weekly check-ins</div>
            <div className="feature-card__desc">
              A 5-minute weekly survey with an interactive calendar showing who
              cared for your child each hour.
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-card__icon"><IconLock /></div>
            <div className="feature-card__title">Private &amp; secure</div>
            <div className="feature-card__desc">
              Your responses are stored only in your browser during this
              prototype phase and are used solely for research.
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-card__icon"><IconAcademic /></div>
            <div className="feature-card__title">Stanford research</div>
            <div className="feature-card__desc">
              Conducted by researchers at the Stanford Graduate School of
              Education to inform childcare policy.
            </div>
          </div>
        </div>

        <div className="card card--accent" style={{ lineHeight: 1.75 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '.625rem', color: 'var(--accent-text)' }}>
            What to expect
          </h2>
          <p style={{ fontSize: '.9375rem', color: 'var(--accent-text)' }}>
            <strong>Enrollment (~30 min)</strong> — Answer questions about your background,
            childcare providers, and well-being.
            &nbsp;&nbsp;
            <strong>Weekly check-ins (~5 min)</strong> — Paint a calendar showing who cared
            for your child each hour last week.
            &nbsp;&nbsp;
            <strong>Exit assessment (~30 min)</strong> — A final survey at the end of
            the study period.
          </p>
        </div>

        <p
          className="text-sm text-muted text-center"
          style={{ marginTop: '2rem' }}
        >
          Participating in the study?{' '}
          You should have received a personal link from the research team.
          If you have questions, please{' '}
          <a href="mailto:mmmazzaferro@gmail.com">contact us</a>.
        </p>
      </div>
    </div>
  )
}
