import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { researcherLogin, getParticipant, exportParticipantCSV } from '../utils/storage'
import { PROVIDER_TYPES } from '../data/questions'

// ── Researcher Login ───────────────────────────────────────────────────────────

function ResearcherLogin({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (researcherLogin(password)) {
      onLogin()
    } else {
      setError('Incorrect password. Please try again.')
      setPassword('')
    }
  }

  return (
    <div className="container page">
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h1 className="page__title">Researcher Login</h1>
        <p className="page__subtitle">Enter your researcher password to access the dashboard.</p>
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="rpassword">Researcher Password</label>
              <input
                id="rpassword"
                type="password"
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
                placeholder="Enter password"
              />
            </div>
            {error && <div className="alert alert--error">{error}</div>}
            <button type="submit" className="btn btn--primary" style={{ width: '100%' }}>
              Log in
            </button>
          </form>
        </div>
        <p className="text-sm text-muted text-center mt-2">
          Default password is set in <code>.env.local</code> via{' '}
          <code>VITE_RESEARCHER_PASSWORD</code>.
        </p>
      </div>
    </div>
  )
}

// ── Metric display ─────────────────────────────────────────────────────────────

function Metric({ label, value }) {
  return (
    <div style={{ textAlign: 'center', padding: '.875rem', background: 'var(--gray-50)', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)' }}>
      <div style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--blue)' }}>{value ?? '—'}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

function DashboardContent() {
  const participant = getParticipant()
  const navigate = useNavigate()

  if (!participant) {
    return (
      <div className="container page">
        <div className="alert alert--warning">
          No participant data found in this browser. Data is stored locally per browser session.
        </div>
      </div>
    )
  }

  const checkins = participant.weeklyCheckins || []
  const completedCheckins = checkins.filter(c => c.completedAt)
  const avgMultiplicity = completedCheckins.length > 0
    ? (completedCheckins.reduce((s, c) => s + (c.metrics?.multiplicity || 0), 0) / completedCheckins.length).toFixed(1)
    : null
  const avgInstability = completedCheckins.filter(c => c.metrics?.instability !== null).length > 0
    ? (completedCheckins.filter(c => c.metrics?.instability !== null)
        .reduce((s, c) => s + c.metrics.instability, 0) /
       completedCheckins.filter(c => c.metrics?.instability !== null).length * 100).toFixed(0) + '%'
    : null
  const avgEntropy = completedCheckins.length > 0
    ? (completedCheckins.reduce((s, c) => s + (c.metrics?.entropy || 0), 0) / completedCheckins.length).toFixed(2)
    : null

  function handleExport() {
    const csv = exportParticipantCSV()
    if (!csv) { alert('No data to export yet.'); return }
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `childcare-precarity-data-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleCopyReminderLink() {
    const url = `${window.location.origin}${window.location.pathname}#/checkin`
    navigator.clipboard.writeText(url).then(() => {
      alert(`Reminder link copied!\n\n${url}\n\nPaste this into a text message to send to the participant.`)
    })
  }

  return (
    <div className="container--wide" style={{ padding: '2rem 1.25rem 4rem' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Researcher Dashboard</h1>
          <p className="text-muted text-sm">Caremometer — Prototype</p>
        </div>
        <div className="flex" style={{ gap: '.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn--secondary btn--sm" onClick={handleCopyReminderLink}>
            📋 Copy Reminder Link
          </button>
          <button className="btn btn--primary btn--sm" onClick={handleExport}>
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* Summary metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Metric label="Participant" value={participant.id} />
        <Metric label="Enrollment" value={participant.enrolledAt?.slice(0, 10) || '—'} />
        <Metric label="Status" value={participant.status || '—'} />
        <Metric label="Check-ins completed" value={completedCheckins.length} />
        <Metric label="Avg providers/week" value={avgMultiplicity} />
        <Metric label="Avg instability" value={avgInstability} />
        <Metric label="Avg entropy (bits)" value={avgEntropy} />
      </div>

      {/* Participant detail */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem', alignItems: 'start' }}>
        <div className="card">
          <h3 className="section__title">Participant Info</h3>
          <table style={{ fontSize: '.875rem', width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['ID', participant.id],
                ['Email', participant.email],
                ['Consent', participant.consentGiven ? `Yes (${participant.consentGivenAt?.slice(0,10)})` : 'No'],
                ['Entry Assessment', participant.entryAssessment?.completedAt?.slice(0,10) || 'Incomplete'],
                ['Exit Assessment', participant.exitAssessment?.completedAt?.slice(0,10) || 'Not completed'],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td style={{ padding: '.3rem .5rem .3rem 0', color: 'var(--gray-500)', fontWeight: 500, whiteSpace: 'nowrap' }}>{k}</td>
                  <td style={{ padding: '.3rem 0', color: 'var(--gray-700)' }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 className="section__title">Providers</h3>
          {(participant.providers || []).length === 0
            ? <p className="text-muted text-sm">No providers yet.</p>
            : (participant.providers || []).map(p => (
                <div key={p.id} className="flex items-center" style={{ gap: '.5rem', marginBottom: '.375rem', fontSize: '.875rem' }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: p.color, display: 'inline-block', flexShrink: 0 }} />
                  <span>{p.name}</span>
                  {p.type && <span className="badge badge--gray" style={{ fontSize: '.65rem' }}>{PROVIDER_TYPES.find(t => t.value === p.type)?.label}</span>}
                </div>
              ))
          }
        </div>
      </div>

      {/* Weekly check-ins table */}
      <div className="card">
        <h3 className="section__title">Weekly Check-ins</h3>
        {checkins.length === 0 ? (
          <p className="text-muted text-sm">No check-ins yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Week</th>
                  <th>Status</th>
                  <th>Providers used</th>
                  <th>Instability</th>
                  <th>Entropy (bits)</th>
                  <th>Hours filled</th>
                </tr>
              </thead>
              <tbody>
                {checkins.sort((a, b) => b.id.localeCompare(a.id)).map(c => (
                  <tr key={c.id}>
                    <td>{c.weekStartDate || c.id.replace('week_', '')}</td>
                    <td>
                      {c.completedAt
                        ? <span className="badge badge--green">✓ Complete</span>
                        : <span className="badge badge--amber">In progress</span>}
                    </td>
                    <td>{c.metrics?.multiplicity ?? '—'}</td>
                    <td>{c.metrics?.instability !== null && c.metrics?.instability !== undefined ? `${(c.metrics.instability * 100).toFixed(0)}%` : '—'}</td>
                    <td>{c.metrics?.entropy !== undefined ? c.metrics.entropy.toFixed(2) : '—'}</td>
                    <td>{c.metrics?.fillRate !== undefined ? `${(c.metrics.fillRate * 100).toFixed(0)}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Demographics snapshot */}
      {participant.entryAssessment?.demographics && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3 className="section__title">Demographics Snapshot</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '.25rem .75rem', fontSize: '.8125rem', color: 'var(--gray-700)' }}>
            {Object.entries(participant.entryAssessment.demographics)
              .filter(([, v]) => v !== undefined && v !== null && v !== '')
              .map(([k, v]) => (
                <div key={k}>
                  <span className="text-muted">{k.replace(/_/g, ' ')}: </span>
                  <strong>{Array.isArray(v) ? v.join(', ') : String(v)}</strong>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Exported page ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { isResearcher, setIsResearcher } = useApp()

  if (!isResearcher) {
    return <ResearcherLogin onLogin={() => setIsResearcher(true)} />
  }

  return <DashboardContent />
}
