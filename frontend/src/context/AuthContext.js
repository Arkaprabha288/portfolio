import { createContext, useContext, useState, useEffect } from 'react'
import { fetchMe, logout as logoutService } from '../utils/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = loading

  useEffect(() => {
    fetchMe()
      .then(u => setUser(u || null))
      .catch(() => setUser(null)) // backend not reachable — treat as logged out
  }, [])

  const logout = async () => {
    await logoutService()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
