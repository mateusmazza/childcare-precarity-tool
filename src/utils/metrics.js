/**
 * Caremometer — Metrics Engine
 *
 * Implements the three core longitudinal constructs:
 *   1. Multiplicity  — number of distinct providers used in a week
 *   2. Instability   — proportion of time slots that changed week-over-week
 *   3. Entropy       — Shannon entropy of provider usage distribution (unpredictability)
 *
 * All functions are pure (no side effects) and accept plain calendar data objects.
 *
 * Calendar data format:
 *   { 'YYYY-MM-DD': { [hour: number]: providerId | null } }
 *   Hours range from 6 to 22 (6 AM – 10 PM inclusive).
 */

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6) // 6..22

/**
 * Flatten a calendar object into a flat list of (date, hour, providerId) records.
 */
function flattenCalendar(calendarData) {
  const slots = []
  for (const [date, hours] of Object.entries(calendarData || {})) {
    for (const hour of HOURS) {
      slots.push({ date, hour, providerId: hours[hour] ?? null })
    }
  }
  return slots
}

/**
 * computeMultiplicity
 * Count the number of distinct non-null providers used in a week.
 *
 * @param {Object} calendarData - { 'YYYY-MM-DD': { [hour]: providerId | null } }
 * @returns {number} Integer >= 0
 */
export function computeMultiplicity(calendarData) {
  const slots = flattenCalendar(calendarData)
  const providers = new Set(slots.map(s => s.providerId).filter(Boolean))
  return providers.size
}

/**
 * computeInstability
 * Proportion of time slots where the provider changed between two consecutive weeks.
 * A slot is counted as "changed" if the provider assignment differs.
 * Null (no care) and a provider are considered different.
 *
 * @param {Object} currentWeekData  - calendar data for the current week
 * @param {Object} priorWeekData    - calendar data for the prior week
 * @returns {number} Float in [0, 1], or null if no prior week
 */
export function computeInstability(currentWeekData, priorWeekData) {
  if (!priorWeekData) return null

  const currentSlots = flattenCalendar(currentWeekData)
  const priorSlots = flattenCalendar(priorWeekData)

  if (currentSlots.length === 0 || priorSlots.length === 0) return null

  // Build a lookup for prior week by (dayOfWeek, hour) so we can compare
  // even when the actual dates differ between weeks.
  const priorByDayHour = {}
  for (const slot of priorSlots) {
    const dow = new Date(slot.date).getDay()
    priorByDayHour[`${dow}_${slot.hour}`] = slot.providerId
  }

  let changed = 0
  let total = 0

  for (const slot of currentSlots) {
    const dow = new Date(slot.date).getDay()
    const key = `${dow}_${slot.hour}`
    if (key in priorByDayHour) {
      total++
      if (slot.providerId !== priorByDayHour[key]) changed++
    }
  }

  return total > 0 ? changed / total : 0
}

/**
 * computeEntropy
 * Shannon entropy of the provider usage distribution within a week.
 * Higher entropy = more unpredictable / mixed arrangement.
 * Entropy is normalized by log2(n_providers) so it falls in [0, 1] when
 * there are 2+ providers; returns 0 for single-provider weeks.
 *
 * Formula: H = -Σ p_i * log2(p_i)
 *
 * @param {Object} calendarData
 * @returns {number} Float >= 0 (raw Shannon entropy in bits)
 */
export function computeEntropy(calendarData) {
  const slots = flattenCalendar(calendarData)
  const filled = slots.filter(s => s.providerId !== null)
  if (filled.length === 0) return 0

  // Count occurrences per provider
  const counts = {}
  for (const slot of filled) {
    counts[slot.providerId] = (counts[slot.providerId] || 0) + 1
  }

  const total = filled.length
  let H = 0
  for (const count of Object.values(counts)) {
    const p = count / total
    H -= p * Math.log2(p)
  }

  return H
}

/**
 * computeNormalizedEntropy
 * Entropy normalized to [0, 1] by the maximum possible entropy
 * for the observed number of distinct providers.
 *
 * @param {Object} calendarData
 * @returns {number} Float in [0, 1]
 */
export function computeNormalizedEntropy(calendarData) {
  const H = computeEntropy(calendarData)
  const n = computeMultiplicity(calendarData)
  if (n <= 1) return 0
  return H / Math.log2(n)
}

/**
 * computeAllMetrics
 * Convenience function that returns all metrics for a single week.
 *
 * @param {Object} currentWeekData
 * @param {Object|null} priorWeekData
 * @returns {{ multiplicity, instability, entropy, normalizedEntropy, filledSlots, totalSlots }}
 */
export function computeAllMetrics(currentWeekData, priorWeekData = null) {
  const slots = flattenCalendar(currentWeekData)
  const filledSlots = slots.filter(s => s.providerId !== null).length
  const totalSlots = slots.length

  return {
    multiplicity: computeMultiplicity(currentWeekData),
    instability: computeInstability(currentWeekData, priorWeekData),
    entropy: computeEntropy(currentWeekData),
    normalizedEntropy: computeNormalizedEntropy(currentWeekData),
    filledSlots,
    totalSlots,
    fillRate: totalSlots > 0 ? filledSlots / totalSlots : 0,
  }
}
