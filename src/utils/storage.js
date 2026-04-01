/**
 * Storage abstraction layer — currently backed by localStorage.
 *
 * All functions are designed to have the same interface as a Qualtrics
 * embedded-data / survey-flow layer would use, making it straightforward
 * to port to Qualtrics or a backend (Firestore, etc.) later.
 *
 * Participant data is keyed by a participant ID (pid), so multiple
 * participants can coexist in the same browser (useful for dev / researcher
 * testing). Participant-specific links carry the pid as a URL query
 * parameter: ?pid=P001
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Public API
 * ─────────────────────────────────────────────────────────────────────────────
 * Participant management
 *   getParticipant(pid)
 *   saveParticipant(pid, data)
 *   createParticipant(pid)
 *   generateParticipantId()
 *   getAllParticipantIds()
 *   getAllParticipants()
 *
 * Screener
 *   saveScreener(pid, data)
 *   completeScreener(pid)
 *
 * Consent
 *   saveConsent(pid)
 *
 * Providers
 *   saveProviders(pid, providers)
 *
 * Entry assessment
 *   saveEntryAssessmentSection(pid, section, data)
 *   completeEntryAssessment(pid)
 *
 * Weekly check-ins
 *   saveWeeklyCheckin(pid, weekId, data)
 *   completeWeeklyCheckin(pid, weekId)
 *   getWeeklyCheckin(pid, weekId)
 *   getLatestCheckin(pid)
 *
 * Exit assessment
 *   saveExitAssessmentSection(pid, section, data)
 *   completeExitAssessment(pid)
 *
 * Researcher auth
 *   researcherLogin(password)
 *   getResearcherAuth()
 *   researcherLogout()
 *
 * Data export
 *   exportParticipantCSV(pid)
 *
 * Week helpers
 *   getCurrentWeekId()
 *   getPast7Days()
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Key helpers ────────────────────────────────────────────────────────────────

const PID_LIST_KEY     = 'cpt_pids'
const RESEARCHER_KEY   = 'cpt_researcher_auth'

function participantKey(pid) {
  return `cpt_p_${pid}`
}

// ── Participant list ───────────────────────────────────────────────────────────

function getParticipantIds() {
  try {
    const raw = localStorage.getItem(PID_LIST_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function registerPid(pid) {
  const ids = getParticipantIds()
  if (!ids.includes(pid)) {
    ids.push(pid)
    localStorage.setItem(PID_LIST_KEY, JSON.stringify(ids))
  }
}

export function getAllParticipantIds() {
  return getParticipantIds()
}

export function getAllParticipants() {
  return getParticipantIds().map(pid => getParticipant(pid)).filter(Boolean)
}

// ── Participant CRUD ───────────────────────────────────────────────────────────

export function getParticipant(pid) {
  try {
    const raw = localStorage.getItem(participantKey(pid))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveParticipant(pid, data) {
  const existing = getParticipant(pid) || {}
  const updated  = { ...existing, ...data, updatedAt: new Date().toISOString() }
  localStorage.setItem(participantKey(pid), JSON.stringify(updated))
  registerPid(pid)
  return updated
}

export function generateParticipantId() {
  const existing = new Set(getParticipantIds())
  let n = existing.size + 1
  let candidate
  do {
    candidate = `P${String(n).padStart(3, '0')}`
    n++
  } while (existing.has(candidate) && n < 10000)
  return candidate
}

export function createParticipant(pid) {
  const participant = {
    id:              pid,
    enrolledAt:      new Date().toISOString(),
    status:          'active',
    consentGiven:    false,
    providers:       [],
    screener:        null,
    entryAssessment: null,
    exitAssessment:  null,
    weeklyCheckins:  [],
  }
  localStorage.setItem(participantKey(pid), JSON.stringify(participant))
  registerPid(pid)
  return participant
}

// ── Consent ────────────────────────────────────────────────────────────────────

export function saveConsent(pid) {
  return saveParticipant(pid, {
    consentGiven:   true,
    consentGivenAt: new Date().toISOString(),
  })
}

// ── Providers ──────────────────────────────────────────────────────────────────

export function saveProviders(pid, providers) {
  return saveParticipant(pid, { providers })
}

// ── Screener ───────────────────────────────────────────────────────────────────

export function saveScreener(pid, data) {
  const participant = getParticipant(pid)
  const existing    = participant?.screener || {}
  const updated     = { ...existing, ...data, lastUpdatedAt: new Date().toISOString() }
  return saveParticipant(pid, { screener: updated })
}

export function completeScreener(pid) {
  const participant = getParticipant(pid)
  const updated     = { ...participant?.screener, completedAt: new Date().toISOString() }
  return saveParticipant(pid, { screener: updated })
}

// ── Entry Assessment ───────────────────────────────────────────────────────────

export function saveEntryAssessmentSection(pid, section, data) {
  const participant = getParticipant(pid)
  const existing    = participant?.entryAssessment || {}
  const updated     = {
    ...existing,
    [section]:     data,
    lastUpdatedAt: new Date().toISOString(),
  }
  return saveParticipant(pid, { entryAssessment: updated })
}

export function completeEntryAssessment(pid) {
  const participant = getParticipant(pid)
  const updated     = {
    ...participant?.entryAssessment,
    completedAt: new Date().toISOString(),
  }
  return saveParticipant(pid, { entryAssessment: updated })
}

// ── Weekly Check-ins ───────────────────────────────────────────────────────────

export function saveWeeklyCheckin(pid, weekId, data) {
  const participant = getParticipant(pid)
  const checkins    = participant?.weeklyCheckins || []
  const idx         = checkins.findIndex(c => c.id === weekId)
  const checkin     = { id: weekId, ...data, updatedAt: new Date().toISOString() }

  if (idx >= 0) {
    checkins[idx] = { ...checkins[idx], ...checkin }
  } else {
    checkins.push(checkin)
  }
  return saveParticipant(pid, { weeklyCheckins: checkins })
}

export function completeWeeklyCheckin(pid, weekId) {
  const participant = getParticipant(pid)
  const checkins    = participant?.weeklyCheckins || []
  const idx         = checkins.findIndex(c => c.id === weekId)
  if (idx >= 0) {
    checkins[idx] = { ...checkins[idx], completedAt: new Date().toISOString() }
    return saveParticipant(pid, { weeklyCheckins: checkins })
  }
}

export function getWeeklyCheckin(pid, weekId) {
  const participant = getParticipant(pid)
  return participant?.weeklyCheckins?.find(c => c.id === weekId) || null
}

export function getLatestCheckin(pid) {
  const participant = getParticipant(pid)
  const checkins    = participant?.weeklyCheckins || []
  if (checkins.length === 0) return null
  return checkins.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0]
}

// ── Exit Assessment ────────────────────────────────────────────────────────────

export function saveExitAssessmentSection(pid, section, data) {
  const participant = getParticipant(pid)
  const existing    = participant?.exitAssessment || {}
  const updated     = {
    ...existing,
    [section]:     data,
    lastUpdatedAt: new Date().toISOString(),
  }
  return saveParticipant(pid, { exitAssessment: updated })
}

export function completeExitAssessment(pid) {
  const participant = getParticipant(pid)
  const updated     = {
    ...participant?.exitAssessment,
    completedAt: new Date().toISOString(),
  }
  return saveParticipant(pid, { exitAssessment: updated, status: 'completed' })
}

// ── Researcher Auth ────────────────────────────────────────────────────────────

const RESEARCHER_PASSWORD =
  import.meta.env.VITE_RESEARCHER_PASSWORD || 'precarity-research-2025'

export function researcherLogin(password) {
  if (password === RESEARCHER_PASSWORD) {
    const auth = { authenticated: true, authenticatedAt: new Date().toISOString() }
    localStorage.setItem(RESEARCHER_KEY, JSON.stringify(auth))
    return true
  }
  return false
}

export function getResearcherAuth() {
  try {
    const raw = localStorage.getItem(RESEARCHER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function researcherLogout() {
  localStorage.removeItem(RESEARCHER_KEY)
}

// ── Data Export ────────────────────────────────────────────────────────────────

export function exportParticipantCSV(pid) {
  const participant = getParticipant(pid)
  if (!participant) return null

  const rows       = []
  const entry      = participant.entryAssessment || {}
  const demographics = entry.demographics || {}
  const checkins   = participant.weeklyCheckins || []

  for (const checkin of checkins) {
    const calendarData = checkin.calendarData || {}
    for (const [date, hours] of Object.entries(calendarData)) {
      for (const [hour, providerId] of Object.entries(hours)) {
        const provider = participant.providers?.find(p => p.id === providerId)
        rows.push({
          participant_id:      participant.id,
          enrolled_at:         participant.enrolledAt,
          child_dob:           demographics.child_dob || '',
          race_ethnicity:      Array.isArray(demographics.race_ethnicity)
                                 ? demographics.race_ethnicity.join(';')
                                 : (demographics.race_ethnicity || ''),
          household_income:    demographics.household_income || '',
          urbanicity:          demographics.urbanicity || '',
          zip_code:            demographics.zip_code || '',
          employment_status:   demographics.employment_status || '',
          week_id:             checkin.id,
          week_start_date:     checkin.weekStartDate || '',
          checkin_completed_at: checkin.completedAt || '',
          date,
          hour:                Number(hour),
          provider_id:         providerId || '',
          provider_name:       provider?.name || (providerId ? 'Unknown' : ''),
          provider_type:       provider?.type || '',
          multiplicity:        checkin.metrics?.multiplicity ?? '',
          instability:         checkin.metrics?.instability ?? '',
          entropy:             checkin.metrics?.entropy ?? '',
        })
      }
    }
  }

  if (rows.length === 0) return null

  const headers = Object.keys(rows[0])
  const csv     = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => JSON.stringify(String(row[h] ?? ''))).join(',')
    ),
  ].join('\n')

  return csv
}

// ── Week helpers ───────────────────────────────────────────────────────────────

export function getCurrentWeekId() {
  const now  = new Date()
  const day  = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  return `week_${monday.toISOString().slice(0, 10)}`
}

export function getPast7Days() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}
