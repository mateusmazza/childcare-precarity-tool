// Researcher login is embedded inside Dashboard.jsx
// This file simply redirects to /dashboard.
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ResearcherLogin() {
  const navigate = useNavigate()
  useEffect(() => { navigate('/dashboard', { replace: true }) }, [navigate])
  return null
}
