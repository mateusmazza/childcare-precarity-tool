/**
 * Storage abstraction layer — backed by Firestore.
 *
 * All functions are async. Participant data is stored in the Firestore
 * 'participants' collection, keyed by participant ID (pid).
 *
 * The public API surface is identical to the previous localStorage version
 * so each instrument page works the same way — just with await on every call.
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
 * Researcher auth (Firebase Auth)
 *   researcherLogin(email, password)
 *   getResearcherAuth()
 *   researcherLogout()
 *
 * Data export
 *   exportParticipantCSV(pid)
 *
 * Week helpers (sync)
 *   getCurrentWeekId()
 *   getPast7Days()
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { db, auth } from '../firebase'
import {
  doc, getDoc, setDoc, collection, getDocs,
} from 'firebase/firestore'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'

const PARTICIPANTS_COL = 'participants'

function participantRef(pid) {
  return doc(db, PARTICIPANTS_COL, pid)
}

// ── Participant list ───────────────────────────────────────────────────────────

export async function getAllParticipantIds() {
  const snap = await getDocs(collection(db, PARTICIPANTS_COL))
  return snap.docs.map(d => d.id).sort()
}

export async function getAllParticipants() {
  const snap = await getDocs(collection(db, PARTICIPANTS_COL))
  return snap.docs.map(d => d.data())
}

// ── Participant CRUD ───────────────────────────────────────────────────────────

export async function getParticipant(pid) {
  const snap = await getDoc(participantRef(pid))
  return snap.exists() ? snap.data() : null
}

export async function saveParticipant(pid, data) {
  const ref      = participantRef(pid)
  const snap     = await getDoc(ref)
  const existing = snap.exists() ? snap.data() : {}
  const updated  = { ...existing, ...data, updatedAt: new Date().toISOString() }
  await setDoc(ref, updated)
  return updated
}

export async function generateParticipantId() {
  const snap     = await getDocs(collection(db, PARTICIPANTS_COL))
  const existing = new Set(snap.docs.map(d => d.id))
  let n = existing.size + 1
  let candidate
  do {
    candidate = `P${String(n).padStart(3, '0')}`
    n++
  } while (existing.has(candidate) && n < 10000)
  return candidate
}

export async function createParticipant(pid) {
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
  await setDoc(participantRef(pid), participant)
  return participant
}

// ── Consent ────────────────────────────────────────────────────────────────────

export async function saveConsent(pid) {
  return saveParticipant(pid, {
    consentGiven:   true,
    consentGivenAt: new Date().toISOString(),
  })
}

// ── Providers ──────────────────────────────────────────────────────────────────

export async function saveProviders(pid, providers) {
  return saveParticipant(pid, { providers })
}

// ── Screener ───────────────────────────────────────────────────────────────────

export async function saveScreener(pid, data) {
  const participant = await getParticipant(pid)
  const existing    = participant?.screener || {}
  const updated     = { ...existing, ...data, lastUpdatedAt: new Date().toISOString() }
  return saveParticipant(pid, { screener: updated })
}

export async function completeScreener(pid) {
  const participant = await getParticipant(pid)
  const updated     = { ...participant?.screener, completedAt: new Date().toISOString() }
  return saveParticipant(pid, { screener: updated })
}

// ── Entry Assessment ───────────────────────────────────────────────────────────

export async function saveEntryAssessmentSection(pid, section, data) {
  const participant = await getParticipant(pid)
  const existing    = participant?.entryAssessment || {}
  const updated     = {
    ...existing,
    [section]:     data,
    lastUpdatedAt: new Date().toISOString(),
  }
  return saveParticipant(pid, { entryAssessment: updated })
}

export async function completeEntryAssessment(pid) {
  const participant = await getParticipant(pid)
  const updated     = {
    ...participant?.entryAssessment,
    completedAt: new Date().toISOString(),
  }
  return saveParticipant(pid, { entryAssessment: updated })
}

// ── Weekly Check-ins ───────────────────────────────────────────────────────────

export async function saveWeeklyCheckin(pid, weekId, data) {
  const participant = await getParticipant(pid)
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

export async function completeWeeklyCheckin(pid, weekId) {
  const participant = await getParticipant(pid)
  const checkins    = participant?.weeklyCheckins || []
  const idx         = checkins.findIndex(c => c.id === weekId)
  if (idx >= 0) {
    checkins[idx] = { ...checkins[idx], completedAt: new Date().toISOString() }
    return saveParticipant(pid, { weeklyCheckins: checkins })
  }
}

export async function getWeeklyCheckin(pid, weekId) {
  const participant = await getParticipant(pid)
  return participant?.weeklyCheckins?.find(c => c.id === weekId) || null
}

export async function getLatestCheckin(pid) {
  const participant = await getParticipant(pid)
  const checkins    = participant?.weeklyCheckins || []
  if (checkins.length === 0) return null
  return checkins.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0]
}

// ── Exit Assessment ────────────────────────────────────────────────────────────

export async function saveExitAssessmentSection(pid, section, data) {
  const participant = await getParticipant(pid)
  const existing    = participant?.exitAssessment || {}
  const updated     = {
    ...existing,
    [section]:     data,
    lastUpdatedAt: new Date().toISOString(),
  }
  return saveParticipant(pid, { exitAssessment: updated })
}

export async function completeExitAssessment(pid) {
  const participant = await getParticipant(pid)
  const updated     = {
    ...participant?.exitAssessment,
    completedAt: new Date().toISOString(),
  }
  return saveParticipant(pid, { exitAssessment: updated, status: 'completed' })
}

// ── Researcher Auth (Firebase Auth) ───────────────────────────────────────────

export async function researcherLogin(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

export function getResearcherAuth() {
  return auth.currentUser
}

export async function researcherLogout() {
  return signOut(auth)
}

// ── Data Export ────────────────────────────────────────────────────────────────

export async function exportParticipantCSV(pid) {
  const participant = await getParticipant(pid)
  if (!participant) return null

  const rows         = []
  const entry        = participant.entryAssessment || {}
  const demographics = entry.demographics || {}
  const checkins     = participant.weeklyCheckins || []

  for (const checkin of checkins) {
    const calendarData = checkin.calendarData || {}
    for (const [date, hours] of Object.entries(calendarData)) {
      for (const [hour, providerId] of Object.entries(hours)) {
        const provider = participant.providers?.find(p => p.id === providerId)
        rows.push({
          participant_id:       participant.id,
          enrolled_at:          participant.enrolledAt,
          child_dob:            demographics.child_dob || '',
          race_ethnicity:       Array.isArray(demographics.race_ethnicity)
                                  ? demographics.race_ethnicity.join(';')
                                  : (demographics.race_ethnicity || ''),
          household_income:     demographics.household_income || '',
          urbanicity:           demographics.urbanicity || '',
          zip_code:             demographics.zip_code || '',
          employment_status:    demographics.employment_status || '',
          week_id:              checkin.id,
          week_start_date:      checkin.weekStartDate || '',
          checkin_completed_at: checkin.completedAt || '',
          date,
          hour:                 Number(hour),
          provider_id:          providerId || '',
          provider_name:        provider?.name || (providerId ? 'Unknown' : ''),
          provider_type:        provider?.type || '',
          multiplicity:         checkin.metrics?.multiplicity ?? '',
          instability:          checkin.metrics?.instability ?? '',
          entropy:              checkin.metrics?.entropy ?? '',
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

// ── Week helpers (synchronous — no Firestore needed) ──────────────────────────

export function getCurrentWeekId() {
  // Returns the Sunday that starts the previous calendar week (Sun–Sat).
  // If today is Sunday, "previous week" means the week that ended yesterday.
  const now    = new Date()
  const day    = now.getDay() // 0 = Sunday
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - day - 7)
  return `week_${sunday.toISOString().slice(0, 10)}`
}

export function getPast7Days() {
  // Returns Sun–Sat of the previous calendar week.
  const now    = new Date()
  const day    = now.getDay()
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - day - 7)
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}
