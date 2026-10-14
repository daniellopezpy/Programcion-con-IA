import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '@/context/auth-context'
import { api, SESSION_KEY } from '@/lib/api'

function loadSavedSession() {
  try {
    const value = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
    return value?.token ? value : null
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

function saveSession(token, user) {
  const session = { token, user }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export function AuthProvider({ children }) {
  const [initialSession] = useState(loadSavedSession)
  const [user, setUser] = useState(initialSession?.user || null)
  const [status, setStatus] = useState(initialSession ? 'loading' : 'anonymous')

  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
    setStatus('anonymous')
  }, [])

  useEffect(() => {
    let active = true
    const handleUnauthorized = () => {
      if (active) {
        setUser(null)
        setStatus('anonymous')
      }
    }

    window.addEventListener('saldo:unauthorized', handleUnauthorized)

    if (!initialSession?.token) {
      return () => {
        active = false
        window.removeEventListener('saldo:unauthorized', handleUnauthorized)
      }
    }

    api.get('/user')
      .then((currentUser) => {
        if (active) {
          saveSession(initialSession.token, currentUser)
          setUser(currentUser)
          setStatus('authenticated')
        }
      })
      .catch(() => {
        if (active) clearSession()
      })

    return () => {
      active = false
      window.removeEventListener('saldo:unauthorized', handleUnauthorized)
    }
  }, [clearSession, initialSession])

  const establishSession = useCallback((result) => {
    saveSession(result.token, result.user)
    setUser(result.user)
    setStatus('authenticated')
    return result.user
  }, [])

  const login = useCallback(async (credentials) => {
    return establishSession(await api.post('/login', credentials, { auth: false }))
  }, [establishSession])

  const register = useCallback(async (details) => {
    return establishSession(await api.post('/register', details, { auth: false }))
  }, [establishSession])

  const logout = useCallback(async () => {
    try {
      if (loadSavedSession()?.token) await api.post('/logout', {})
    } finally {
      clearSession()
    }
  }, [clearSession])

  const value = useMemo(() => ({
    user,
    status,
    isAuthenticated: status === 'authenticated',
    login,
    register,
    logout,
  }), [user, status, login, register, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
