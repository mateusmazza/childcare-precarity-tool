import { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  researcherLogin,
  getAllParticipantIds,
  getParticipant,
  createParticipant,
  exportParticipantCSV,
} from '../utils/storage'
import { PROVIDER_TYPES } from '../data/questions'

// ── Utility: generate instrument links ────────────────────────────────────────

function makeLinks(pid) {
  const base = `${window.location.origin}${window.location.pathname}`
  return {
    screener: `${base}#/?pid=${pid}`,
    consent:  `${base}#/consent?pid=${pid}`,
    entry:    `${base}#/entry?pid=${pid}`,
    checkin:  `${base}#/checkin?pid=${pid}`,
    exit:     `${base}#/exit?pid=${pid}`,
  }
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// ── Researcher login form ─────────────────────────────────────────────────────

function ResearcherLogin({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')

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
        <h1 className="page__title">Researcher access</h1>
        <p className="page__subtitle">
          Enter your researcher password to access the dashboard.
        </p>
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="rpassword">Password</label>
              <input
                id="rpassword"
                type="password"
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
                placeholder="Researcher password"
              />
            </div>
            {error && <div className="alert alert--error">{error}</div>}
            <button type="submit" className="btn btn--primary" style={{ width: '100%' }}>
              Sign in
            </button>
          </form>
        </div>
        <p className="text-sm text-muted text-center mt-2">
          Set via <code>VITE_RESEARCHER_PASSWORD</code> in <code>.env.local</code>.
        </p>
      </div>
    </div>
  )
}

// ── Metric tile ───────────────────────────────────────────────────────────────

function Metric({ label, value }) {
  return (
    <div style={{
      textAlign: 'center', padding: '.875rem',
      background: 'var(--stone-2)', borderRadius: 'var(--radius)',
    }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '-.02em' }}>
        {value ?? '—'}
      </div>
      <div className="text-xs text-muted" style={{ marginTop: '.25rem' }}>{label}</div>
    </div>
  )
}

// ── Link copy row ─────────────────────────────────────────────────────────────

function LinkRow({ label, url }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const ok = await copyToClipboard(url)
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  return (
    <div style={{ marginBottom: '.625rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '.5rem', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '.8125rem', fontWeight: 600, color: 'var(--ink-2)', minWidth: 60 }}>
          {label}
        </span>
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={handleCopy}
          style={{ flexShrink: 0 }}
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
      <div className="link-box" style={{ marginTop: '.3rem' }}>{url}</div>
    </div>
  )
}

// ── Participant detail panel ───────────────────────────────────────────────────

function ParticipantDetail({ pid }) {
  const participant = getParticipant(pid)
  const links       = makeLinks(pid)

  if (!participant) {
    return <p className="text-sm text-muted">No data found for {pid}.</p>
  }

  const checkins          = participant.weeklyCheckins || []
  const completedCheckins = checkins.filter(c => c.completedAt)
  const avgMultiplicity   = completedCheckins.length > 0
    ? (completedCheckins.reduce((s, c) => s + (c.metrics?.multiplicity || 0), 0) / completedCheckins.length).toFixed(1)
    : null
  const withInstability   = completedCheckins.filter(c => c.metrics?.instability != null)
  const avgInstability    = withInstability.length > 0
    ? `${(withInstability.reduce((s, c) => s + c.metrics.instability, 0) / withInstability.length * 100).toFixed(0)}%`
    : null
  const avgEntropy        = completedCheckins.length > 0
    ? (completedCheckins.reduce((s, c) => s + (c.metrics?.entropy || 0), 0) / completedCheckins.length).toFixed(2)
    : null

  function handleExport() {
    const csv = exportParticipantCSV(pid)
    if (!csv) { alert('No calendar data to export yet.'); return }
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `caremometer-${pid}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* Status + export */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '.5rem' }}>
        <div style={{ display: 'flex', gap: '.375rem', flexWrap: 'wrap' }}>
          <span className={`badge badge--${participant.screener?.completedAt ? 'green' : 'gray'}`}>
            {participant.screener?.completedAt ? 'Screened' : 'Not screened'}
          </span>
          <span className={`badge badge--${participant.consentGiven ? 'green' : 'gray'}`}>
            {participant.consentGiven ? 'Consented' : 'No consent'}
          </span>
          <span className={`badge badge--${participant.entryAssessment?.completedAt ? 'green' : 'amber'}`}>
            {participant.entryAssessment?.completedAt ? 'Enrolled' : 'Not enrolled'}
          </span>
          <span className={`badge badge--${participant.exitAssessment?.completedAt ? 'green' : 'gray'}`}>
            {participant.exitAssessment?.completedAt ? 'Exited' : 'Active'}
          </span>
          <span className="badge badge--blue">{completedCheckins.length} check-in{completedCheckins.length !== 1 ? 's' : ''}</span>
        </div>
        <button className="btn btn--secondary btn--sm" onClick={handleExport}>
          Export CSV
        </button>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '.75rem', marginBottom: '1.25rem' }}>
        <Metric label="Avg providers/week" value={avgMultiplicity} />
        <Metric label="Avg instability"    value={avgInstability} />
        <Metric label="Avg entropy (bits)" value={avgEntropy} />
        <Metric label="Enrolled"           value={participant.enrolledAt?.slice(0, 10) || '—'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.25rem', alignItems: 'start' }}>
        {/* Providers */}
        <div className="card">
          <h3 className="section__title">Providers</h3>
          {(participant.providers || []).length === 0 ? (
            <p className="text-sm text-muted">None registered yet.</p>
          ) : (
            (participant.providers || []).map(p => (
              <div key={p.id} className="flex items-center" style={{ gap: '.5rem', marginBottom: '.375rem', fontSize: '.875rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: p.color, display: 'inline-block', flexShrink: 0 }} />
                <span>{p.name}</span>
                {p.type && <span className="badge badge--gray">{PROVIDER_TYPES.find(t => t.value === p.type)?.label}</span>}
              </div>
            ))
          )}
        </div>

        {/* Contact info — PII, researcher-only, never exported */}
        {(participant.contactInfo || participant.screener?.eligibilityAnswers) && (
          <div className="card">
            {participant.contactInfo && (
              <>
                <h3 className="section__title">
                  Contact information
                  <span className="badge badge--amber" style={{ marginLeft: '.5rem', fontSize: '.65rem' }}>PII — not exported</span>
                </h3>
                <div style={{ display: 'grid', gap: '.25rem', fontSize: '.8125rem', color: 'var(--ink-2)', marginBottom: '1rem' }}>
                  {participant.contactInfo.email && (
                    <div>
                      <span className="text-muted">Email: </span>
                      <strong>{participant.contactInfo.email}</strong>
                    </div>
                  )}
                  {participant.contactInfo.phone && (
                    <div>
                      <span className="text-muted">Phone: </span>
                      <strong>{participant.contactInfo.phone}</strong>
                    </div>
                  )}
                  {participant.contactInfo.collectedAt && (
                    <div>
                      <span className="text-muted">Collected: </span>
                      <strong>{participant.contactInfo.collectedAt.slice(0, 10)}</strong>
                    </div>
                  )}
                </div>
              </>
            )}
            {participant.screener?.eligibilityAnswers && (
              <>
                <h3 className="section__title">Screener responses</h3>
                <div style={{ display: 'grid', gap: '.25rem', fontSize: '.8125rem', color: 'var(--ink-2)' }}>
                  {Object.entries(participant.screener.eligibilityAnswers).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-muted">{k.replace(/_/g, ' ')}: </span>
                      <strong>{String(v)}</strong>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Demographics snapshot */}
        {participant.entryAssessment?.demographics && (
          <div className="card">
            <h3 className="section__title">Demographics</h3>
            <div style={{ display: 'grid', gap: '.25rem', fontSize: '.8125rem', color: 'var(--ink-2)' }}>
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

      {/* Check-ins table */}
      {checkins.length > 0 && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <h3 className="section__title">Weekly check-ins</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Week of</th>
                  <th>Status</th>
                  <th>Providers</th>
                  <th>Instability</th>
                  <th>Entropy</th>
                  <th>Hrs filled</th>
                </tr>
              </thead>
              <tbody>
                {checkins.sort((a, b) => b.id.localeCompare(a.id)).map(c => (
                  <tr key={c.id}>
                    <td>{c.weekStartDate || c.id.replace('week_', '')}</td>
                    <td>
                      {c.completedAt
                        ? <span className="badge badge--green">Complete</span>
                        : <span className="badge badge--amber">In progress</span>}
                    </td>
                    <td>{c.metrics?.multiplicity ?? '—'}</td>
                    <td>{c.metrics?.instability != null ? `${(c.metrics.instability * 100).toFixed(0)}%` : '—'}</td>
                    <td>{c.metrics?.entropy !== undefined ? c.metrics.entropy.toFixed(2) : '—'}</td>
                    <td>{c.metrics?.fillRate !== undefined ? `${(c.metrics.fillRate * 100).toFixed(0)}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Participant links */}
      <div className="card">
        <h3 className="section__title">Participant links</h3>
        <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
          Send these links to the participant at the appropriate time.
          Each link carries the participant ID — no login required.
        </p>
        <LinkRow label="Screener"        url={links.screener} />
        <LinkRow label="Consent / Entry" url={links.consent} />
        <LinkRow label="Weekly check-in" url={links.checkin} />
        <LinkRow label="Exit survey"     url={links.exit} />
      </div>
    </div>
  )
}

// ── Main dashboard ─────────────────────────────────────────────────────────────

function DashboardContent() {
  const [pids, setPids]             = useState(() => getAllParticipantIds())
  const [selectedPid, setSelectedPid] = useState(() => getAllParticipantIds()[0] || null)
  const [newPid, setNewPid]         = useState('')
  const [addError, setAddError]     = useState('')

  function handleAddParticipant(e) {
    e.preventDefault()
    const id = newPid.trim().toUpperCase().replace(/\s+/g, '')
    if (!id) { setAddError('Enter a participant ID.'); return }
    if (pids.includes(id)) { setAddError(`Participant ${id} already exists.`); return }

    createParticipant(id)
    const updated = getAllParticipantIds()
    setPids(updated)
    setSelectedPid(id)
    setNewPid('')
    setAddError('')
  }

  return (
    <div className="container--wide" style={{ padding: '2.5rem 1.5rem 5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-.02em', color: 'var(--ink-1)' }}>
          Researcher Dashboard
        </h1>
        <p className="text-muted text-sm">Caremometer — Prototype · Data stored in this browser</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* Sidebar: participant list */}
        <div>
          <div className="card" style={{ padding: '1rem' }}>
            <p style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.75rem' }}>
              Participants
            </p>
            {pids.length === 0 ? (
              <p className="text-sm text-muted">No participants yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
                {pids.map(pid => {
                  const p       = getParticipant(pid)
                  const enrolled = p?.entryAssessment?.completedAt
                  return (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => setSelectedPid(pid)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', padding: '.4375rem .625rem', border: 'none',
                        borderRadius: 'var(--radius-sm)', cursor: 'pointer', textAlign: 'left',
                        background: selectedPid === pid ? 'var(--accent-pale)' : 'transparent',
                        color: selectedPid === pid ? 'var(--accent-text)' : 'var(--ink-2)',
                        fontFamily: 'var(--font)', fontSize: '.875rem', fontWeight: selectedPid === pid ? 600 : 400,
                        transition: 'background .1s',
                      }}
                    >
                      <span>{pid}</span>
                      <span
                        style={{
                          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                          background: enrolled ? 'var(--green)' : 'var(--stone-4)',
                        }}
                        title={enrolled ? 'Enrolled' : 'Not enrolled'}
                      />
                    </button>
                  )
                })}
              </div>
            )}

            {/* Add participant */}
            <hr className="divider" style={{ marginTop: '.875rem', marginBottom: '.875rem' }} />
            <form onSubmit={handleAddParticipant}>
              <div style={{ marginBottom: '.375rem' }}>
                <input
                  type="text"
                  className="form-input"
                  value={newPid}
                  onChange={e => { setNewPid(e.target.value); setAddError('') }}
                  placeholder="e.g. P002"
                  style={{ fontSize: '.875rem', padding: '.4375rem .625rem' }}
                />
              </div>
              {addError && (
                <p style={{ fontSize: '.75rem', color: 'var(--red)', marginBottom: '.375rem' }}>{addError}</p>
              )}
              <button type="submit" className="btn btn--secondary btn--sm" style={{ width: '100%' }}>
                Add participant
              </button>
            </form>
          </div>
        </div>

        {/* Main panel */}
        <div>
          {selectedPid ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '.75rem', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-.015em' }}>
                  Participant {selectedPid}
                </h2>
              </div>
              <ParticipantDetail pid={selectedPid} />
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p className="text-muted">Select a participant from the sidebar, or add one to get started.</p>
            </div>
          )}
        </div>

      </div>
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
