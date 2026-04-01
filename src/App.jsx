import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Header        from './components/layout/Header'
import Footer        from './components/layout/Footer'
import Screener       from './pages/Screener'
import Consent        from './pages/Consent'
import EntryAssessment from './pages/EntryAssessment'
import WeeklyCheckin   from './pages/WeeklyCheckin'
import ExitAssessment  from './pages/ExitAssessment'
import Dashboard       from './pages/Dashboard'
import ThankYou        from './pages/ThankYou'
import './App.css'

/**
 * Route structure
 *
 *  /                      Eligibility screener (Instrument 0 — public, no pid required)
 *  /consent?pid=…         Informed consent (step 1 of entry flow)
 *  /entry?pid=…           Enrollment / entry assessment
 *  /checkin?pid=…         Weekly check-in
 *  /exit?pid=…            Exit assessment
 *  /dashboard             Researcher dashboard (password-protected)
 *  /thank-you?type=…&pid=… Confirmation page
 *
 * Each instrument route carries the participant ID (pid) as a query parameter.
 * The researcher generates these links from the dashboard and sends them to
 * participants. This architecture mirrors how each instrument will be a
 * separate Qualtrics survey with pid passed via embedded data.
 */
export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <div className="app-shell">
          <Header />
          <main className="app-main">
            <Routes>
              <Route path="/"          element={<Screener />} />
              <Route path="/consent"   element={<Consent />} />
              <Route path="/entry"     element={<EntryAssessment />} />
              <Route path="/checkin"   element={<WeeklyCheckin />} />
              <Route path="/exit"      element={<ExitAssessment />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/thank-you" element={<ThankYou />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </HashRouter>
    </AppProvider>
  )
}
