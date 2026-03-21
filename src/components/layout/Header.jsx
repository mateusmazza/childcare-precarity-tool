import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { researcherLogout } from '../../utils/storage'

export default function Header() {
  const { participant, isResearcher, setIsResearcher } = useApp()
  const navigate = useNavigate()

  function handleLogout() {
    researcherLogout()
    setIsResearcher(false)
    navigate('/')
  }

  return (
    <header className="header">
      <div className="header__inner">
        <a href="#/" className="header__logo" onClick={e => { e.preventDefault(); navigate('/') }}>
          <div className="header__logo-icon">🏠</div>
          Caremometer
        </a>
        <nav className="header__nav">
          {participant && !isResearcher && (
            <a href="#/checkin" onClick={e => { e.preventDefault(); navigate('/checkin') }}>
              Weekly Check-in
            </a>
          )}
          {isResearcher && (
            <>
              <a href="#/dashboard" onClick={e => { e.preventDefault(); navigate('/dashboard') }}>
                Dashboard
              </a>
              <button onClick={handleLogout}>Log out</button>
            </>
          )}
          {!isResearcher && (
            <a href="#/researcher" onClick={e => { e.preventDefault(); navigate('/researcher') }}>
              Researcher
            </a>
          )}
        </nav>
      </div>
    </header>
  )
}
