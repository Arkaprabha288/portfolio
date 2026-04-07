import { useEffect } from 'react'
import { fetchMe } from '../utils/authService'
import { useAuth } from '../context/AuthContext'

// Handles /auth/callback?token=xxx after Google OAuth redirect
export default function AuthCallback({ onDone }) {
  const { setUser } = useAuth()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      localStorage.setItem('token', token)
      fetchMe().then(u => {
        setUser(u)
        window.history.replaceState(null, '', '/')
        onDone?.()
      })
    } else {
      window.history.replaceState(null, '', '/')
      onDone?.()
    }
  }, []) // eslint-disable-line

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--clr-text-2)' }}>Signing you in...</p>
    </div>
  )
}
