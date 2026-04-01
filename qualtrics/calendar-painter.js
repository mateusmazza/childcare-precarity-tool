/**
 * Caremometer Calendar Painter — Qualtrics Embed
 *
 * Paste this entire script into the JavaScript editor of the calendar
 * question in your Qualtrics weekly check-in survey.
 *
 * In Qualtrics:
 *   1. Click the question → JavaScript (under the question behavior menu)
 *   2. Replace the default content with this script
 *   3. The calendar renders inside the question container
 *   4. Calendar data is saved as JSON in the question's text response
 *
 * The script reads provider names from embedded data fields:
 *   provider_1_name, provider_2_name, ... provider_6_name
 * Set these in the survey flow (e.g., piped from the entry survey or
 * hardcoded per participant).
 */

Qualtrics.SurveyEngine.addOnload(function () {
  var qContainer = this.getQuestionContainer()
  var qTextArea = null

  // Find the text response input (for TE/ML questions)
  var inputs = qContainer.querySelectorAll('textarea, input[type="text"]')
  if (inputs.length > 0) {
    qTextArea = inputs[0]
    qTextArea.style.display = 'none' // hide the raw textarea
  }

  // ── Configuration ─────────────────────────────────────────────────────
  var HOURS_START = 6
  var HOURS_END = 22 // 6 AM to 10 PM
  var HOUR_COUNT = HOURS_END - HOURS_START + 1

  var COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']
  var ERASER_COLOR = '#e5e7eb'

  // ── Read providers from embedded data ─────────────────────────────────
  var providers = []
  for (var i = 1; i <= 6; i++) {
    var name = Qualtrics.SurveyEngine.getEmbeddedData('provider_' + i + '_name')
    if (name && name.trim()) {
      providers.push({ id: 'prov_' + i, name: name.trim(), color: COLORS[(i - 1) % COLORS.length] })
    }
  }

  if (providers.length === 0) {
    providers = [
      { id: 'prov_1', name: 'Provider 1', color: COLORS[0] },
      { id: 'prov_2', name: 'Provider 2', color: COLORS[1] },
    ]
  }

  // ── Compute previous week (Sunday–Saturday) ───────────────────────────
  var now = new Date()
  var dayOfWeek = now.getDay()
  var lastSunday = new Date(now)
  lastSunday.setDate(now.getDate() - dayOfWeek - 7)

  var days = []
  for (var d = 0; d < 7; d++) {
    var dt = new Date(lastSunday)
    dt.setDate(lastSunday.getDate() + d)
    days.push(dt.toISOString().slice(0, 10))
  }

  var DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // ── State ─────────────────────────────────────────────────────────────
  var calendarData = {} // { 'YYYY-MM-DD': { hour: providerId } }
  var selectedTool = providers[0].id

  // Try to restore from existing textarea value
  if (qTextArea && qTextArea.value) {
    try { calendarData = JSON.parse(qTextArea.value) } catch (e) {}
  }

  // ── Build UI ──────────────────────────────────────────────────────────
  var wrapper = document.createElement('div')
  wrapper.style.cssText = 'margin-top:1rem;font-family:sans-serif;'

  // Legend
  var legend = document.createElement('div')
  legend.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;'

  function makeLegendBtn(prov) {
    var btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = prov.name
    btn.dataset.id = prov.id
    btn.style.cssText = 'padding:6px 12px;border:2px solid transparent;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;color:#fff;background:' + prov.color + ';'
    btn.onclick = function () {
      selectedTool = prov.id
      updateLegendStyles()
    }
    return btn
  }

  providers.forEach(function (p) { legend.appendChild(makeLegendBtn(p)) })

  // Eraser button
  var eraserBtn = document.createElement('button')
  eraserBtn.type = 'button'
  eraserBtn.textContent = 'Eraser'
  eraserBtn.style.cssText = 'padding:6px 12px;border:2px solid #999;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;color:#333;background:' + ERASER_COLOR + ';'
  eraserBtn.onclick = function () { selectedTool = 'eraser'; updateLegendStyles() }
  legend.appendChild(eraserBtn)

  function updateLegendStyles() {
    var btns = legend.querySelectorAll('button')
    btns.forEach(function (b) {
      var isActive = b.dataset.id === selectedTool || (selectedTool === 'eraser' && b.textContent === 'Eraser')
      b.style.borderColor = isActive ? '#0f172a' : 'transparent'
      b.style.opacity = isActive ? '1' : '0.6'
    })
  }
  updateLegendStyles()

  wrapper.appendChild(legend)

  // Grid table
  var table = document.createElement('table')
  table.style.cssText = 'border-collapse:collapse;width:100%;user-select:none;-webkit-user-select:none;'

  // Header row
  var thead = document.createElement('thead')
  var headerRow = document.createElement('tr')
  var thEmpty = document.createElement('th')
  thEmpty.style.cssText = 'padding:4px;font-size:11px;min-width:40px;'
  headerRow.appendChild(thEmpty)
  days.forEach(function (date, i) {
    var th = document.createElement('th')
    th.style.cssText = 'padding:4px;font-size:11px;text-align:center;min-width:36px;'
    th.innerHTML = DAY_LABELS[i] + '<br>' + date.slice(5)
    headerRow.appendChild(th)
  })
  thead.appendChild(headerRow)
  table.appendChild(thead)

  // Body rows (one per hour)
  var tbody = document.createElement('tbody')
  var isPainting = false

  function getProviderColor(provId) {
    var p = providers.find(function (pr) { return pr.id === provId })
    return p ? p.color : '#f3f4f6'
  }

  function paintCell(cell, date, hour) {
    var provId = selectedTool === 'eraser' ? null : selectedTool
    if (!calendarData[date]) calendarData[date] = {}
    if (provId) {
      calendarData[date][hour] = provId
      cell.style.background = getProviderColor(provId)
    } else {
      delete calendarData[date][hour]
      cell.style.background = '#f9fafb'
    }
    saveData()
  }

  function saveData() {
    if (qTextArea) {
      qTextArea.value = JSON.stringify(calendarData)
      // Trigger change event so Qualtrics picks it up
      var evt = document.createEvent('HTMLEvents')
      evt.initEvent('change', true, false)
      qTextArea.dispatchEvent(evt)
    }
  }

  for (var h = HOURS_START; h <= HOURS_END; h++) {
    var row = document.createElement('tr')
    var hourLabel = document.createElement('td')
    hourLabel.style.cssText = 'padding:2px 6px;font-size:11px;color:#6b7280;white-space:nowrap;text-align:right;'
    var ampm = h < 12 ? 'AM' : 'PM'
    var h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    hourLabel.textContent = h12 + ' ' + ampm
    row.appendChild(hourLabel)

    for (var di = 0; di < days.length; di++) {
      ;(function (date, hour) {
        var cell = document.createElement('td')
        cell.style.cssText = 'padding:0;border:1px solid #e5e7eb;width:14%;height:24px;cursor:pointer;transition:background .1s;'

        // Restore existing data
        var existing = calendarData[date] && calendarData[date][hour]
        cell.style.background = existing ? getProviderColor(existing) : '#f9fafb'

        cell.addEventListener('pointerdown', function (e) {
          e.preventDefault()
          isPainting = true
          paintCell(cell, date, hour)
        })
        cell.addEventListener('pointerenter', function () {
          if (isPainting) paintCell(cell, date, hour)
        })
        row.appendChild(cell)
      })(days[di], h)
    }
    tbody.appendChild(row)
  }

  document.addEventListener('pointerup', function () { isPainting = false })
  document.addEventListener('pointercancel', function () { isPainting = false })

  table.appendChild(tbody)
  wrapper.appendChild(table)
  qContainer.appendChild(wrapper)
})

Qualtrics.SurveyEngine.addOnUnload(function () {
  // Cleanup handled by Qualtrics
})
